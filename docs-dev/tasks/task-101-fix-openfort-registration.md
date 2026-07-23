<!-- cspell:words Openfort openfort backpro pkce embed referer referrerpolicy referrerPolicy frontpro penpal HTMLIFrameElement microtask microtasks navigations appendChild -->

# Task 101: Fix Openfort registration and login — embedded wallet iframe 403 + [Not connected]

**Status:** Done (functional fix shipped; UX follow-up tracked in task-102)
**Target repo:** `front-pro`
**Related:**
- `docs-dev/tasks/task-100-nextjs-migration-plan.md` (Phase 9, Phase 10)
- `docs-dev/release-notes/v0.2.2-openfort-implementation-with-onboarding.md`
- `docs-dev/tasks/task-102-openfort-registration-login-ux-improvement.md`
- upstream bug report: openfort-xyz/openfort-js#275

---

## 1. Background — the intended flow

InfraFund's Openfort integration is intentionally non-standard. Where most Openfort integrations set `connectOnLogin: true` and the SDK handles everything, we defer wallet creation because new users must first pass a qualification questionnaire before they are provisioned as backend users and given a wallet.

The intended flow (from `docs-dev/release-notes/v0.2.2-openfort-implementation-with-onboarding.md`):

```mermaid
flowchart TD
  LP[Public landing /] --> OB[Single Openfort button]
  OB --> OA[Openfort auth — no wallet created]
  OA --> CK{Backend: user exists?}
  CK -->|existing user| EX[Backend session exchange]
  EX --> APP[/home]
  CK -->|new user| Q1[Step 1: Role selection]
  Q1 --> Q2[Step 2: Individual or Organization]
  Q2 --> Q3[Step 3: Qualification checkboxes]
  Q3 -->|all confirmed| NX[Backend session exchange with role/type]
  NX --> WC[Create embedded wallet]
  WC --> APP
  Q3 -->|disqualified| WL[Non-resident contact form]
  WL --> DONE[Thank you / close]
```

Key design decisions that shape the problems below:

- **`connectOnLogin: false`** — Openfort authenticates the user identity without creating or connecting a wallet. The SDK's embedded-wallet iframe is never loaded automatically.
- **Explicit `create()` call** — `AuthSessionProvider.createWalletIfNeeded()` calls `useEthereumEmbeddedWallet().create({ recoveryMethod: AUTOMATIC })` at the right moment: after qualification for new users, or after session restore for existing users.
- **Two-layer session** — Openfort owns identity and wallets; our Next.js API routes own the app JWT and refresh cookie.

This worked under the previous Go backend (`../backpro`). The migration to the all-Next.js architecture (`task-100`) introduced two regressions that together prevented the full registration → login lifecycle from working.

---

## 2. Bug A — iframe 403: embedded wallet never loads on registration

### 2.1 Symptom

New user completes the qualification questionnaire. UI shows "Setting up your wallet...". After ~10 s the banner appears:

> "We couldn't restore your session — We couldn't connect to the wallet service. Please check your connection and try again."

### 2.2 Network trace

| # | Request | Status | Notes |
|---|---|---|---|
| 1 | `GET /api/v1/auth/refresh` | 401 | Expected — no app session yet. |
| 2 | `GET /iam/v2/auth/get-session` (Openfort) | 200 | Openfort verifies its own access token. |
| 3 | `GET /api/v1/auth/openfort/check` | 200 | Backend returns `{ exists: false }` — new-user path. |
| 4 | `POST /api/v1/auth/openfort/exchange` | 200 | App user created, JWT minted, refresh cookie set. |
| 5 | `GET /api/v1/me` | 200 | Profile returned. |
| 6 | `POST /api/auth/encryption-session` | 200 | Shield encryption session minted server-side. |
| 7 | **`GET https://embed.openfort.io/iframe/{pk}`** | **403** | **Iframe HTML never loads.** |

### 2.3 Root cause: no Referer header on the iframe navigation

Openfort's Cloudflare edge enforces an origin allowlist check via the `Referer` request header. When the browser sends the iframe navigation without a Referer, the edge returns 403 regardless of the CSP `frame-ancestors` configuration (which is correct).

Proof via curl:
```sh
# No Referer → 403
curl -i "https://embed.openfort.io/iframe/pk_test_…"

# Referer: http://localhost:3000/ → 200
curl -i -H "Referer: http://localhost:3000/" "https://embed.openfort.io/iframe/pk_test_…"
```

`localhost:3000` is correctly configured as an Allowed Origin in the Openfort dashboard. The 403 is entirely caused by the missing Referer.

### 2.4 Why no Referer is sent

The Openfort SDK creates the iframe in `sdk/src/api/embeddedWallet.ts`, method `createIframe()`:

```javascript
private createIframe(url: string): HTMLIFrameElement {
  const existingIframe = document.getElementById('openfort-iframe');
  if (existingIframe) existingIframe.remove();

  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.id = 'openfort-iframe';
  iframe.src = url;              // src set while detached — no navigation yet

  document.body.appendChild(iframe);  // navigation initiated HERE

  return iframe;
}
```

The iframe is created without a `referrerpolicy` attribute. When the browser initiates the navigation at `appendChild`, it reads the referrer policy (element attribute or document-level policy). Without an explicit policy, Chrome uses the page default which, in this configuration, results in no Referer being sent for the cross-origin `http://localhost:3000` → `https://embed.openfort.io` navigation.

Filed upstream as: **openfort-xyz/openfort-js#275**. The SDK fix is one line — `iframe.referrerPolicy = 'origin'` before `iframe.src = url`.

### 2.5 What did NOT work (and why)

#### Option A — `<meta name="referrer" content="origin">` (document-level metadata)

Implemented via `export const metadata: Metadata = { referrer: 'origin' }` in `src/app/layout.tsx`. This emits `<meta name="referrer" content="origin"/>` into every page's `<head>`.

**Result: failed.** The meta tag IS present in the live DOM (`document.querySelector('meta[name="referrer"]').content === "origin"` confirmed). The server also returns `Referrer-Policy: origin` as an HTTP response header (added to `next.config.ts`). Neither caused Chrome to send the Referer on the iframe navigation. `document.referrerPolicy` returns `undefined` even with the HTTP header present, suggesting the Chromium 147 build on Linux processes the policy differently for cross-origin HTTP→HTTPS iframe navigations.

#### Option D (first attempt) — MutationObserver

Added `OpenfortIframeFix` component using `MutationObserver` to watch `document.body` for the new iframe and set `referrerpolicy="origin"` on it.

**Result: failed.** The observer fires as a microtask _after_ `appendChild`. `document.getElementById('openfort-iframe').referrerPolicy === "origin"` was confirmed in the DOM, but Chrome had already committed the navigation's referrer policy synchronously at the `appendChild` call site. Setting the attribute one microtask later has no effect on the pending request.

### 2.6 What worked — `Node.prototype.appendChild` patch

The correct timing requires setting `referrerpolicy` _before_ the real `appendChild` executes. We patch `Node.prototype.appendChild` so our code runs synchronously before the browser initiates the navigation:

```typescript
// In OpenfortIframeFix component (src/lib/openfort-config.tsx):
const original = Node.prototype.appendChild;
Node.prototype.appendChild = function <T extends Node>(child: T): T {
  if (
    child instanceof HTMLIFrameElement &&
    child.id === 'openfort-iframe' &&
    !child.referrerPolicy
  ) {
    child.referrerPolicy = 'origin';
  }
  return original.call(this, child) as T;
};
```

Timeline:
1. SDK: `iframe.src = url` (element detached — no navigation)
2. SDK: `document.body.appendChild(iframe)`
3. **Our patch intercepts** → sets `referrerpolicy = 'origin'` synchronously
4. Real `appendChild` runs → browser reads `referrerpolicy = 'origin'` → sends `Referer: http://localhost:3000/`
5. `GET https://embed.openfort.io/iframe/{pk}` → **200** ✓

The patch is narrowly targeted (only `<iframe id="openfort-iframe">`), lives inside `OpenfortProvider` as a React component, and is removed on component unmount. Once the Openfort SDK ships the upstream fix, this component can be deleted.

---

## 3. Bug B — [Not connected]: wallet never reconnects on subsequent logins

### 3.1 Symptom

After a successful first registration the user logs out and signs back in. They are correctly identified as an existing user (questionnaire skipped, redirected to `/home`), but the wallet button in the top-right shows `[Not connected]`.

### 3.2 Root cause

`bootstrapSession()` called `finalizeAuthenticatedSession()` directly for existing users, bypassing `createWalletIfNeeded()`. This left the embedded-wallet iframe unloaded.

Additionally, `createWalletIfNeeded()` itself had an early return:
```typescript
if (wallets.length > 0) {
  finalizeAuthenticatedSession(accessToken, currentUser);
  return;  // ← skipped create() entirely
}
```

`wallets` from `useEthereumEmbeddedWallet()` is populated from the Openfort API (not from the iframe). A returning user who already has a wallet has `wallets.length > 0` immediately — without the iframe having loaded at all. The early return treated "wallet known to the API" as equivalent to "wallet connected and usable", which it is not. `connectOnLogin: false` means the iframe is never loaded automatically, so the wallet is perpetually [Not connected].

### 3.3 Fix

Removed the `wallets.length > 0` early return. `create()` is now always called:

- **New user**: provisions the wallet and connects it via the iframe (existing behaviour).
- **Returning user**: reconnects to the existing wallet via the iframe. The Openfort SDK handles this transparently — `create()` is effectively a "connect or create" operation when called with `recoveryMethod: AUTOMATIC`.

Both existing-user paths in `bootstrapSession()` (`refreshBackendSession` fast path and the Openfort token exchange path) now route through `createWalletIfNeeded()` instead of `finalizeAuthenticatedSession()`.

---

## 4. Files changed

| File | Change |
|---|---|
| `src/app/layout.tsx` | Added `metadata.referrer = 'origin'` (belt-and-suspenders; not the primary fix but harmless) |
| `next.config.ts` | Added `Referrer-Policy: origin` HTTP response header (belt-and-suspenders) |
| `src/lib/openfort-config.tsx` | Added `OpenfortIframeFix` component with `appendChild` patch; added explanatory comments |
| `src/components/auth/auth-session-provider.tsx` | Removed `wallets.length > 0` early return; routed existing-user paths through `createWalletIfNeeded`; added flow comments |

---

## 5. Known remaining issues (see task-102)

The functional fix is complete but the user experience for existing users logging back in is not yet polished:

- "Setting up your wallet..." loading state is shown on every login, including returning users. It was designed for first-time wallet creation (~5–10 s). For returning users the reconnect may be faster, but the same full-screen loading state is used.
- During the wallet reconnect a transient popup with "Connect Wallet" text appeared and disappeared after ~3–5 s. This is likely the wagmi/WalletConnect auto-connect UI triggering because the wallet is not yet connected when some component checks its status. It resolves itself but is confusing.
- The Openfort modal may briefly flash before being closed by `finalizeAuthenticatedSession`.

These are tracked in `docs-dev/tasks/task-102-openfort-registration-login-ux-improvement.md`.

---

## 6. Validation

- New user registration: qualification questionnaire → "Setting up your wallet..." → wallet address in header → `/home` ✓
- Existing user login: Google auth → "Setting up your wallet..." (brief) → wallet address in header → `/home` ✓
- `npm run format` and `npx tsc --noEmit` pass ✓

---

## 7. Follow-up for upstream

Open issue with `@openfort/react` / `@openfort/openfort-js` requesting `referrerpolicy="origin"` be set on the iframe element in `EmbeddedWalletApi.createIframe()` before `iframe.src` is assigned. Filed as openfort-xyz/openfort-js#275. Once that ships, `OpenfortIframeFix` in `src/lib/openfort-config.tsx` can be removed.

<!-- cspell:words Openfort openfort backpro pkce embed referer referrerpolicy referrerPolicy frontpro -->

# Task 101: Fix Openfort registration — embedded wallet iframe 403

**Status:** In progress
**Target repo:** `front-pro`
**Related:** `docs-dev/tasks/task-100-nextjs-migration-plan.md` (Phase 9, Phase 10), `docs-dev/release-notes/v0.2.2-openfort-implementation-with-onboarding.md`

## 1. Test scenario (new-user Google registration)

End-to-end Openfort onboarding for a brand-new user, exactly as documented in `docs-dev/test/local-testing-runbook.md`:

1. Start clean: account previously deleted; visit `http://localhost:3000`.
2. Click **Continue with Openfort**.
3. In the Openfort modal click **Google** → complete OAuth (or a live Google session passes through).
4. Qualification questionnaire appears: **Raise Funds → Continue → Individual → Continue → Continue** (all checkboxes pre-checked).
5. UI switches to **"Setting up your wallet..."**.
6. Expected: ~5–10 s later wallet address `0x…` appears in the header button and the user lands on `/home`.
7. Actual: ~10 s later the loading state is replaced by a banner **"We couldn't restore your session — We couldn't connect to the wallet service. Please check your connection and try again."**, and the user is stuck on `/`.

A subsequent hard reload (`Ctrl+R`) resolves the visible symptom — the wallet appears and the user proceeds — but that workaround is a known issue and not acceptable for shipping.

## 2. Investigation

### 2.1 Network trace during the failure

Captured via Chrome DevTools MCP from a fresh repro (clean dev-server log, account just soft-deleted). Bracketed by Openfort/InfraFund calls only — Sentry/analytics noise omitted.

| # | Request | Status | Notes |
|---|---|---|---|
| 1 | `GET /api/v1/auth/refresh` | 401 | Expected — no app session yet. |
| 2 | `GET /iam/v2/auth/get-session` (Openfort) | 200 | Openfort verifies its own access token. |
| 3 | `GET /api/v1/auth/openfort/check` | 200 | Backend returns `{ exists: false }` — new-user path. |
| 4 | `POST /api/v1/auth/openfort/exchange` | 200 | App user created, JWT minted, refresh cookie set. |
| 5 | `GET /api/v1/me` | 200 | Profile returned. |
| 6 | `POST /api/auth/encryption-session` | 200 | Shield encryption session minted server-side. |
| 7 | **`GET https://embed.openfort.io/iframe/{publishableKey}`** | **403** | **Iframe HTML never loads.** Body 26 bytes: `<html><body></body></html>`. |

The hidden Openfort iframe (`<iframe id="openfort-iframe" style="display: none;">`) never reaches `READY`, so the `useEthereumEmbeddedWallet().create({ recoveryMethod: AUTOMATIC })` promise inside `auth-session-provider.tsx` rejects after the SDK's internal timeout. The error message is matched by `getUserFacingErrorMessage` ("failed to establish iFrame connection") and the provider transitions to `status: 'error'`.

### 2.2 What makes Openfort 403 the iframe

Direct probes against the same URL from the host:

```sh
# No Referer header  → 403
curl -i "https://embed.openfort.io/iframe/pk_test_…"

# Referer http://localhost:3000/  → 200
curl -i -H "Referer: http://localhost:3000/" "https://embed.openfort.io/iframe/pk_test_…"
```

The successful 200 response carries the project's CSP:

```
content-security-policy: …; frame-ancestors http://localhost:3000 https://openfort.infrafund.dev; …
```

So `localhost:3000` is correctly listed as an Allowed Origin in the Openfort dashboard (verified at <https://dashboard.openfort.io/.../test/security>). The 403 is purely Openfort's edge enforcing an **origin check via the Referer header**, and the browser request from our Next.js page contains no Referer at all.

### 2.3 Why the browser sent no Referer

Inspected in DevTools and via `evaluate_script`:

- `<head>` contains no `<meta name="referrer">`.
- No `Referrer-Policy` HTTP header is sent by Next.js for the page response.
- `document.referrerPolicy` resolves to the empty string (default).
- The Openfort SDK creates the iframe as `<iframe id="openfort-iframe" src="…" style="display: none;">` with no `referrerpolicy` attribute.

The browser default `strict-origin-when-cross-origin` should send the origin for an `http://localhost:3000` → `https://embed.openfort.io` (cross-origin, more-secure) request, but for this hidden iframe it observably did not. Whether the cause is a Next.js 16 default, a Sentry instrumentation side-effect, or something specific about how `@openfort/react` mounts the iframe, the practical effect is the same: an empty Referer reaches Openfort and the 403 follows.

Live in-page proof:

```js
// Replace the SDK's iframe with one carrying referrerpolicy="origin"
const old = document.getElementById('openfort-iframe');
const fresh = document.createElement('iframe');
fresh.id = 'openfort-iframe';
fresh.setAttribute('referrerpolicy', 'origin');
fresh.style.display = 'none';
old.replaceWith(fresh);
fresh.src = old.getAttribute('src');
// → next request to embed.openfort.io/iframe/{pk} returns 200
```

### 2.4 Why a hard reload "fixes" it

Empirically, on the second load the iframe sometimes does receive a Referer (we did not pin down the exact trigger — likely a cache/timing interaction in how the SDK or React provider mounts the iframe on a warm load). The behavior is non-deterministic and not a real fix.

### 2.5 Why this regressed after the Go → Next.js migration

This worked under the previous Go-backend setup. Most likely the original `landing-pro` HTML or backend response carried a different referrer policy (header or meta) that ensured the SDK iframe always saw an origin. The migration to a single Next.js app and the rewrite of `src/app/layout.tsx` did not carry that forward — the new layout has no referrer configuration at all. We did not retrieve the historical policy; the fix below is the policy we want anyway.

## 3. Options considered

| # | Option | Where | Effect | Verdict |
|---|---|---|---|---|
| A | `<meta name="referrer" content="origin">` via Next.js `metadata.referrer` in `app/layout.tsx` | Document-wide | Browser sends only the origin (`http://localhost:3000` / `https://openfort.infrafund.dev`) for **all** outgoing requests, same- and cross-origin. | **Chosen.** |
| B | `metadata.referrer = 'strict-origin-when-cross-origin'` | Document-wide | Same effect for cross-origin; same-origin requests get the full URL. Modern browser default. | Rejected — we already see the default fail in this configuration; explicit `origin` is more uniform and slightly stricter. |
| C | HTTP `Referrer-Policy: origin` header from Next.js | Edge / response header | Same effect as A but via header. | Rejected — same outcome, but `metadata.referrer` is the App Router idiom and keeps the policy declaration colocated with the page contract. |
| D | Patch `referrerpolicy="origin"` onto the Openfort iframe at runtime (e.g. MutationObserver) | Client-only hack | Works (proven live) but reaches into SDK internals. | Rejected — brittle; would need re-validation on every `@openfort/react` upgrade. |
| E | Add `localhost:3000` to Openfort dashboard via some loosened check | External | We can't relax Openfort's edge check; it is already correctly configured. | N/A — not actionable. |

## 4. Decision

Apply **Option A**. Add `referrer: 'origin'` to the root `Metadata` export in `src/app/layout.tsx`. This emits `<meta name="referrer" content="origin">` into every page automatically and:

- Always sends an `Origin`-only Referer to third parties (Openfort, recaptcha, Sentry, …) — sufficient for Openfort's domain-allowlist check, and the minimum information disclosure that still satisfies it.
- Strips path/query from same-origin referrers as well, eliminating any incidental leakage of internal route names through Referer headers.
- Single point of declaration. Future SDK iframes inherit it automatically, so adding (e.g.) Apple login or another wallet provider won't reintroduce this class of bug.
- Does not require touching any third-party SDK code.

## 5. Implementation

Single edit: `src/app/layout.tsx` — add a typed `Metadata` export with `referrer: 'origin'`.

```ts
import type { Metadata } from 'next';

export const metadata: Metadata = {
  referrer: 'origin',
};
```

No other files need to change. `next.config.ts`, the Openfort provider wiring, and the auth/session API routes stay as-is.

## 6. Validation

- Reproduce the failing scenario above against the patched layout: the wallet should be created and the user should land on `/home` without the banner and without a manual reload.
- DevTools network panel: `GET https://embed.openfort.io/iframe/{pk}` returns **200** with the `Referer: http://localhost:3000/` request header present.
- Run `npm run format` and `npx tsc --noEmit`.
- Smoke-test the existing-user path (login again with the same Google account after wallet creation) to ensure refresh / `/api/v1/me` still work — the new policy must not break same-origin flows.

## 7. Notes / Follow-ups

- Open an issue with `@openfort/react` requesting that the embedded wallet iframe set `referrerpolicy="origin"` (or `strict-origin-when-cross-origin`) on the element it mounts. With that upstream, this app would work even with `referrer: 'no-referrer'` at the document level.
- Production verification: once deployed, confirm the iframe still loads at `https://openfort.infrafund.dev` (already in the project's allowed origins per the CSP `frame-ancestors`).
- Update `docs-dev/test/local-testing-runbook.md` to drop the "if the banner appears, hard reload" step once this fix lands and is verified.

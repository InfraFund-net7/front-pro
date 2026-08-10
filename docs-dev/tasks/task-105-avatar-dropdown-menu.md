<!-- cspell:words Openfort openfort lucide mousedown parameterise viem -->

# Task 105: Avatar dropdown menu (Account / Disconnect) with wallet status, plus wallet row on /account

**Status:** Done — verified in-browser
**Target repo:** `front-pro`
**Depends on:** task-103 (auth session model is in place)
**Related:** `docs-dev/tasks/task-104-openfort-login-pre-auth-cleanup.md`

---

## 1. Issue description

Logout is currently four clicks deep:

1. Click the wallet-address `OpenfortButton` in the header.
2. Openfort's modal opens at the `EthereumConnected` page.
3. Click the tiny gear icon in the modal's top-left.
4. Click "Disconnect" (last item in the menu).

Most users will not find it. The header already shows an unused avatar
circle (a static `<div>` with the user's first initial) right next to the
wallet-address button — the obvious place for account actions.

## 2. Desired end state

- Avatar circle becomes a clickable `<button>`.
- Small status dot in the bottom-right of the avatar:
  - **green** when the embedded wallet is connected,
  - **grey** otherwise.
- Browser-native `title` tooltip shows `"Connected"` / `"Not connected"`.
- Click opens a popover anchored under the avatar with:
  - Header: name + email (the same `displayName` / `secondaryLabel`
    currently shown in the "Hi {name}" greeting).
  - Wallet row: shortened address `0xAB…CD12` + copy-to-clipboard icon.
  - Divider.
  - **Account** — navigates to `/account`.
  - **Disconnect** — logs out (red text).
- Click-outside and Esc close the popover.
- The wallet-address `OpenfortButton` stays exactly where it is for
  debugging; can be removed/env-gated later.

## 3. Implementation

### 3.1 `src/components/auth/auth-session-provider.tsx`

Add `logout()` to the context value. It mirrors the existing
`deleteAccount()` minus the `deleteBackendAccount()` call:

```ts
const logout = useCallback(async () => {
  setStatus('loading');
  await Promise.allSettled([
    logoutBackendSession().catch(() => undefined),
    signOut().catch(() => undefined),
  ]);
  clearSession();
  setStatus('unauthenticated');
}, [clearSession, signOut]);
```

`MainLayout`'s existing route guard handles the redirect to `/` once
`status` flips to `unauthenticated`.

### 3.2 `src/components/header/avatar-menu.tsx` (new)

- Reads `useAuthSession()` for `backendUser`, `openfortUser`, `logout`.
- Reads `useEthereumEmbeddedWallet()` for `status` (`'connected'` vs
  other) and `address`.
- `useState`/`useRef` + `mousedown` + `keydown` listeners for
  click-outside / Esc dismissal — same pattern as
  `src/components/ui/dropdown.tsx`. Not refactored into a shared util:
  the dropdown there is a select-style component and not a good fit to
  parameterise.
- Lucide icons: `Copy`, `User`, `LogOut`.
- `navigator.clipboard.writeText(address)` for the copy action.

### 3.3 `src/components/header.tsx`

- Replace the static avatar `<div>` with `<AvatarMenu />`.
- Move the `displayName` / `avatarLabel` derivation into `AvatarMenu`
  (the header still computes `displayName` for the "Hi {name}" greeting,
  so the logic exists in two places — fine, both are tiny and reading
  from the same context).
- The `OpenfortButton label="Wallet" showAvatar` stays unchanged.

### 3.4 `/account` page — wallet row

Added a "Wallet ({chainName})" row at the bottom of the **Account Details**
card showing: external-link icon (block explorer) → copy icon → full
address. Uses the same `useEthereumEmbeddedWallet()` hook as the avatar
menu. Block explorer URL is derived from the chain ID via a small helper
that reuses viem's bundled `chain.blockExplorers.default.url`, so we don't
hand-maintain explorer URLs. Currently registered chains: Base, Base
Sepolia, Ethereum mainnet, Polygon, Sepolia. Unknown chains hide the link
icon gracefully.

## 4. Files

- `src/components/auth/auth-session-provider.tsx` (+ `logout()`).
- `src/components/header/avatar-menu.tsx` (new).
- `src/components/header.tsx` (swap avatar div for `<AvatarMenu />`).
- `src/lib/block-explorer.ts` (new — chain ID → explorer URL helper).
- `src/components/account/account-page.tsx` (+ wallet row in Account
  Details).

## 5. Verification

1. `npm run dev:local`, open via `chrome-devtools-mcp`.
2. Sign in. Hover the avatar — tooltip shows `"Connected"`. Status dot
   green.
3. Click avatar — popover opens with name + email, wallet address +
   copy icon, Account link, Disconnect button.
4. Click Account — navigates to `/account`.
5. Re-open menu, click copy icon — clipboard contains the full address
   (verify via `navigator.clipboard.readText()` in DevTools console).
6. Click Disconnect — `logout()` runs, `MainLayout` redirects to `/`.
   Sign in again works.
7. Click outside the popover — closes. Press Esc — closes.
8. Navigate to `/account` — Account Details card has a "Wallet
   ({chainName})" row at the bottom with link → copy → full address.
   Link opens the right block explorer for the active chain in a new tab.
9. `npm run format` and `npm run build` pass.

## 6. Out of scope

- Editing the `/account` page itself.
- Removing or env-gating the wallet-address `OpenfortButton`.
- Any other header changes.
- New tooltip dependency (browser-native `title` is fine here).

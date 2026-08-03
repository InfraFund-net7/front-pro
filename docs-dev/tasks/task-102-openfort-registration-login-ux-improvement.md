<!-- cspell:words Openfort openfort wagmi walletconnect penpal recognizes RainbowKit -->

# Task 102: Openfort registration and login — UX improvement

**Status:** Pending
**Target repo:** `front-pro`
**Depends on:** task-101 (functional fix — must be completed first)
**Related:** `docs-dev/release-notes/v0.2.2-openfort-implementation-with-onboarding.md`

---

## 1. Context

Task-101 fixed the functional regressions (iframe 403 on registration, [Not connected] on subsequent logins). Both paths now reach the authenticated state. However the user experience during the wallet connection phase is not yet polished for existing users logging back in.

The root cause of the UX friction: with `connectOnLogin: false` and our explicit `create()` call, every authentication — including returning users restoring a session — goes through the same "Setting up your wallet..." loading state and triggers wallet-connection UI from the wagmi/WalletConnect layer that was designed for new users only.

---

## 2. Observed issues (existing user login path)

These were observed during testing on 2026-05-01 with the task-101 fix in place.

### 2.1 "Setting up your wallet..." shown for all logins

When a returning user logs in, `createWalletIfNeeded()` sets `status = 'creating_wallet'` before calling `create()`. The `MainLayout` renders the full-screen "Setting up your wallet..." spinner for `status === 'creating_wallet'`. This was designed for new-user first-time wallet provisioning (which takes 5–10 s), but is now also shown for returning users on every login.

For returning users the iframe reconnect may be significantly faster (the wallet already exists; Shield only needs to restore the key share, not create it). The full-screen loading state implies something time-consuming is happening and may worry users who have logged in before.

**Desired behavior:** returning users should see a lightweight/inline loading indicator rather than the full-screen "Setting up your wallet..." spinner. Or the state label should be different (`'restoring_wallet'` vs `'creating_wallet'`).

### 2.2 Transient "Connect Wallet" popup

During the ~3–5 s wallet reconnect, a popup with a "Connect Wallet" button appeared and then disappeared automatically once the wallet connected.

**Hypothesis:** this is the wagmi/WalletConnect `ConnectButton` or `Web3Modal` UI triggering because some component checks wallet connectivity before `create()` completes. Once the Openfort embedded wallet is connected, wagmi recognizes it via `OpenfortWagmiBridge` and the popup closes. The popup is confusing because the user expects the process to be automatic — they should never need to click "Connect Wallet".

To investigate: identify which component renders this popup, trace when it appears relative to the `creating_wallet` → `authenticated` status transition, and determine whether it can be suppressed during the wallet connection phase.

### 2.3 Potential Openfort modal flash

The Openfort auth modal (`useUI().close()` is called in `finalizeAuthenticatedSession`) may briefly reappear between the end of the questionnaire flow and the wallet connection completing. Not yet confirmed as a consistent repro; needs observation.

---

## 3. Desired end state

### New user (first registration)
1. User clicks Openfort button.
2. Google auth completes → questionnaire shown.
3. User completes questionnaire → loading indicator.
4. "Setting up your wallet..." (full-screen is acceptable here — first-time wallet creation, ~5–10 s).
5. Wallet address appears in header. User lands on `/home`. ✓

### Existing user (returning login)
1. User clicks Openfort button.
2. Google auth completes → no questionnaire (already qualified).
3. Brief inline loading ("Connecting...") without the full-screen "Setting up your wallet..." spinner.
4. Wallet address appears in header. User lands on `/home`.
5. No "Connect Wallet" popup visible at any point. ✓

---

## 4. Investigation starting points

### 4.1 Distinguish new-wallet vs reconnect in the status machine

Add a new status value `'restoring_wallet'` (or carry a boolean flag) so the UI can render differently for returning users. The condition: if `wallets.length > 0` at the time `createWalletIfNeeded` runs, the user has an existing wallet being reconnected; otherwise it is first-time creation.

Relevant file: `src/components/auth/auth-session-provider.tsx` — `createWalletIfNeeded()`.

### 4.2 "Connect Wallet" popup source

Search for the component rendering the "Connect Wallet" UI. Likely candidates:
- `src/components/main-layout.tsx` — check what it renders for `status === 'creating_wallet'`
- Any wagmi `ConnectButton` or `RainbowKit` / `Web3Modal` component
- `OpenfortWagmiBridge` — check if it exposes any connect UI

The popup disappears automatically after the wallet connects, which suggests it is driven by wagmi's `isConnected` state, not by our app status. Suppressing it during `status === 'creating_wallet'` or `'restoring_wallet'` might be as simple as conditionally not rendering the wagmi connector UI.

### 4.3 Openfort modal visibility during transition

`closeOpenfortModal()` is called inside `finalizeAuthenticatedSession()`. Check whether the modal needs to be closed earlier (e.g., at the start of `createWalletIfNeeded()` rather than at the end) to avoid any flash between questionnaire close and wallet connection start.

---

## 5. Out of scope for task-102

- Functional wallet creation/reconnect logic — already fixed in task-101.
- Upstream Openfort SDK fix (`referrerpolicy` on the iframe) — tracked in openfort-xyz/openfort-js#275.
- Account deletion, logout, error-retry flows.

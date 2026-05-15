<!-- cspell:words Openfort openfort backpro lucide -->

# Task 103: Openfort registration and login — UX cleanup with single progress modal

**Status:** Done — verified in-browser via `chrome-devtools-mcp` on the returning-user path (cookie-restore reload). New-user / no-cookie / error paths still pending real-account QA.
**Target repo:** `front-pro`
**Depends on:** task-101 (functional fix)
**Supersedes:** task-102 (rolled into this task)
**Related:** `docs-dev/release-notes/v0.2.2-openfort-implementation-with-onboarding-review.md`

## Validators (passed)

- `npx tsc --noEmit` — pass
- `npm run format` (eslint + prettier + cspell + knip) — pass
- `npm run build` (next build, 29 routes) — pass
- In-browser smoke test, returning-user reload of `/home`: progress modal
  walks through all 5 steps, "Signed in — taking you to your dashboard…"
  success beat, redirect to `/home`, wallet address visible in header.
  No "Connected — Manage wallets" popup at any point.

## Files changed

- `src/components/auth/auth-session-provider.tsx` — added `authProgress`
  slice, step plan helpers, per-step transitions across `bootstrapSession`,
  `completeOnboarding`, and `createWalletIfNeeded`. Closes the Openfort
  built-in modal as soon as `isAuthenticated` becomes true (kills the
  "Connected — Manage wallets" popup). Single fixed 5-step plan from the
  start; cookie short-circuit marks `checking_account` done instead of
  swapping the plan length mid-flight. Wallet step ID is now passed in by
  the caller (`'connecting_wallet'` for returning users,
  `'setting_up_wallet'` for new users) — deciding it from `wallets.length`
  was racy because the SDK's `wallets[]` is populated asynchronously, which
  caused the wallet step to never resolve in the modal even though the
  wallet had connected.
- `src/components/auth/auth-progress-modal.tsx` — new component, renders
  the unified modal with step icons (✓ / spinner / ○ / ✗), per-step
  countdown (5 s for API steps, 10 s for wallet steps which round-trip
  through Shield + iframe + on-chain), error message + Retry button, and
  a brief "Signed in — taking you to your dashboard…" success beat.
- `src/components/main-layout.tsx` — dropped the `creating_wallet` and
  `loading` full-screen branches and the recoverable-error split. The
  progress modal now owns those visuals; only the very first
  `isOpenfortLoading` (pre-click SDK init) keeps a lightweight inline
  loader. While the bootstrap is in flight (`status` ∈ `idle | loading |
  creating_wallet | error`), private-route children are replaced with a
  placeholder so the dashboard doesn't flash through behind the modal
  while `router.replace('/')` is still pending.
- `src/components/auth/auth-state.tsx` — pruned `AuthErrorState` (no
  remaining usage).
- `src/components/ui/error-banner.tsx` — deleted (no remaining usage).

---

## 1. Issue description

After task-101 the Openfort flow works end-to-end functionally, but the
post-click window (≈10–15 s for a returning user, ≈5–10 s longer for a new
user) is visually noisy. Multiple unrelated pieces of UI surface and disappear
in sequence, creating the impression that the user must click something —
particularly a small **"Connected — Manage wallets"** popup that hangs around
for several seconds after Google authentication completes.

The user has no signal that work is happening, no breakdown of the steps the
system is going through, and no idea how long they should wait before
something is actually wrong.

---

## 2. Root-cause analysis

### 2.1 "Connected — Manage wallets" popup

Source: Openfort React SDK's own modal at
`@openfort/react/build/components/Pages/Connected/EthereumConnected.js:130`.

The `OpenfortButton` opens the Openfort modal on click. After Google OAuth
redirects back, the SDK marks the user as authenticated and the modal
auto-routes to its `CONNECTED` page (`EthereumConnected`). Because we set
`connectOnLogin: false`, `wallet.status !== 'connected'` while
`embeddedAccounts.length > 0`, so the SDK renders the `noWalletFallback`
branch — a button labelled **"Manage wallets"** with the heading
**"Connected"**.

The modal stays visible until our code calls `closeOpenfortModal()` inside
`finalizeAuthenticatedSession`
(`src/components/auth/auth-session-provider.tsx:191`), which only runs *after*
the embedded-wallet `create()` resolves — i.e. several seconds later. During
that window the user sees a clickable "Manage wallets" button and reasonably
assumes they are supposed to click it.

### 2.2 Cycling full-screen overlays

`MainLayout` renders different full-screen messages keyed off our internal
`status` (`src/components/main-layout.tsx:46-95`):

- `loading` → "Restoring your InfraFund session…" / "Checking your Openfort
  session…"
- `creating_wallet` → "Setting up your wallet…"

For a returning user the bootstrap transitions through `loading` →
`creating_wallet` → `authenticated` in quick succession, so the user sees the
overlay swap labels mid-flight. Each new label looks like a different thing
happening, when really it is one continuous bootstrap.

The "Setting up your wallet…" label is also misleading for returning users:
nothing is being *set up* — the SDK is reconnecting to an existing wallet via
the iframe.

### 2.3 No progress signal

The whole bootstrap can take 10–15 s. The user gets a generic spinner with no
breakdown ("authenticating", "loading profile", "connecting wallet"…) and no
sense of expected duration. There is no recoverable failure feedback either:
on error the user gets a generic banner that is hard to forward to support.

---

## 3. Desired end state

A **single progress modal** owns the entire post-click auth window:

- Suppresses every other auth popup (Openfort built-in modal, intermediate
  full-screen overlays).
- Shows the discrete steps of the bootstrap. Each step has an icon:
  ✓ done · ⠋ active (spinner) · ○ pending · ✗ error.
- The active step shows a small `~5s` countdown so the user knows roughly how
  long to wait. Once the timer hits 0 the spinner stays and the small text
  becomes "Still working…" — the timer never decides success/failure on its
  own; only the actual promise result does.
- On error: red ✗ on the failing step + an inline error message detailed
  enough to forward to support + a Retry button.
- On success: brief "✓ Signed in — taking you to your dashboard…" beat
  (~600 ms) before redirect, so the user sees confirmation rather than a
  blank flash.

### 3.1 Step catalogue

The set of steps is fixed up-front based on which path the user is on,
decided immediately after `checkOpenfortUser` (or short-circuited by the
refresh-cookie path):

**Returning user, refresh-cookie short-circuit:**
1. `signing_in` — Authenticating with Openfort
2. `restoring_session` — Restoring your session
3. `loading_profile` — Loading your profile
4. `connecting_wallet` — Connecting your wallet

**Returning user, no cookie:**
1. `signing_in`
2. `checking_account` — Checking your account
3. `restoring_session` — Restoring your session
4. `loading_profile`
5. `connecting_wallet`

**New user, after questionnaire:**
1. `signing_in` ✓
2. `checking_account` ✓
3. *(questionnaire — modal hides while user fills it in)*
4. `creating_account` — Creating your account
5. `loading_profile`
6. `setting_up_wallet` — Setting up your wallet
   *(different label since the embedded wallet is genuinely being provisioned
   for the first time; chosen by inspecting `wallets.length` at the moment
   the wallet step becomes active)*

---

## 4. Implementation plan

### 4.1 `src/components/auth/auth-session-provider.tsx`

- Add an `authProgress` slice on the context:
  ```ts
  type StepStatus = 'pending' | 'active' | 'done' | 'error';
  type StepId =
    | 'signing_in' | 'checking_account' | 'restoring_session'
    | 'creating_account' | 'loading_profile'
    | 'connecting_wallet' | 'setting_up_wallet';
  type ProgressStep = { id: StepId; label: string; status: StepStatus; errorMessage?: string };
  type AuthProgress = { steps: ProgressStep[]; isVisible: boolean } | null;
  ```
- Helpers: `setStepPlan(steps)`, `startStep(id)`, `completeStep(id)`,
  `failStep(id, msg)`, `clearProgress()`.
- `setStepPlan` is called the moment we know which path we're on:
  - In `bootstrapSession` after the refresh-cookie short-circuit succeeds
    (returning-user / refresh path).
  - In `bootstrapSession` after `checkOpenfortUser` resolves (returning vs
    new user).
  - In `completeOnboarding` at the start (new user).
- Wrap each async call in `bootstrapSession`, `completeOnboarding`, and
  `createWalletIfNeeded` with `startStep`/`completeStep`/`failStep`.
- **Close the Openfort built-in modal early.** In the `useEffect` that drives
  `bootstrapSession`, call `closeOpenfortModal()` as soon as
  `isAuthenticated && openfortUserId` and we are about to start bootstrap.
  This is what eliminates the "Connected — Manage wallets" popup. Keep the
  existing call in `finalizeAuthenticatedSession` as a defensive
  belt-and-suspenders.
- Hide the progress modal while the questionnaire is open
  (`status === 'needs_onboarding'`); show it again on submit.
- On `authenticated`, leave the modal visible briefly (component-side
  ~600 ms) then `clearProgress()`.

### 4.2 `src/components/auth/auth-progress-modal.tsx` — NEW

- Renders a centered modal with backdrop. Z-index above any residual Openfort
  modal.
- Lists each step in order with icon + label.
- Active step: spinner + "(~5s)" countdown. After 0, switches to
  "Still working…".
- Error step: red ✗, inline error text, support hint, Retry button (calls
  `retry()` from context).
- Success final beat: "✓ Signed in — taking you to your dashboard…" then
  closes.
- Icons: `lucide-react` (`Check`, `X`, `Loader2`, `Circle`) — already a
  project dependency.

### 4.3 `src/components/main-layout.tsx`

- Drop the `creating_wallet` and `loading` full-screen branches.
- Keep the initial `isOpenfortLoading` (pre-click SDK init) and the fatal
  `error` fallback for cases the modal does not own.
- Mount `<AuthProgressModal />` at the layout root so it renders regardless
  of route.

### 4.4 `src/components/auth/auth-state.tsx`

- `AuthErrorState` stays for the route-guard fatal-error case.
- `AuthLoadingState` may stay if used elsewhere; otherwise prune via Knip
  during `npm run format`.

No backend, Openfort SDK, or questionnaire changes are required.

---

## 5. Verification

1. `npm run dev:local`, open via `chrome-devtools-mcp`.
2. **Returning user, with refresh cookie** (reload page while signed in):
   modal shows `signing_in ✓`, `restoring_session ✓`, `loading_profile`
   active with countdown, `connecting_wallet` pending. The "Connected —
   Manage wallets" popup is never visible. End: brief "✓ Signed in" then
   `/home`.
3. **Returning user, no cookie** (logout, sign in again with same Google):
   all 5 steps tick through. No Openfort modal visible after Google redirect.
4. **New user** (fresh Google account): `signing_in ✓`, `checking_account ✓`.
   Modal hides for questionnaire. After submit: `creating_account`,
   `loading_profile`, `setting_up_wallet` (note the different label).
5. **Error path** (stop the local API mid-bootstrap, or temporarily make
   `getBackendMe` throw): failing step shows red ✗ with message inline;
   Retry restarts.
6. `npm run format` and `npm run build` pass.

---

## 6. Out of scope

- Functional auth/wallet logic (already shipped in task-101).
- Upstream Openfort SDK fix for `referrerpolicy` (tracked as
  openfort-xyz/openfort-js#275).
- Account deletion, logout, error-retry beyond what the modal exposes.

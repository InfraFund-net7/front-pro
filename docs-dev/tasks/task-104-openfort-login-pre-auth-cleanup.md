<!-- cspell:words Openfort openfort lucide -->

# Task 104: Openfort login — pre-auth flow cleanup (remove the second Google modal)

**Status:** Done — verified in-browser. The OAuth-callback flash is gone and the progress list now ticks left-to-right.
**Target repo:** `front-pro`
**Depends on:** task-103 (single progress modal must be in place)
**Related:** `docs-dev/tasks/task-103-openfort-login-ux-cleanup-and-progress-list.md`

## Validators (passed)

- `npx tsc --noEmit` — pass
- `npm run format` (eslint + prettier + cspell + knip) — pass

## Files changed

- `src/components/auth/auth-session-provider.tsx`
  - Added a mount-only `useEffect` that detects `openfortAuthProviderUI` in
    the URL and seeds `authProgress` with the returning-user 5-step plan
    (`signing_in` active), plus an eager `closeOpenfortModal()` call. The
    bootstrap useEffect overwrites the plan as soon as it runs; nothing
    else changes.
  - Reordered `bootstrapSession` to attempt the refresh-cookie short-circuit
    **silently** (no `startStep('restoring_session')` while the cookie
    request is in flight). Previously the cookie path ticked step 3
    (restoring_session) active before step 2 (checking_account), and then
    ticked step 2 done while step 3 was still spinning — visually 1 → 3 →
    2 → 3, which read as out-of-order. Now the cookie attempt is silent and
    on success steps 2 and 3 are ticked done in order; on failure the
    exchange path walks step 2 active → done → step 3 active → done. Both
    paths tick left-to-right.
- `src/components/main-layout.tsx` — derive `isHandlingOAuthCallback` from
  the URL synchronously and OR it into both the public-route and
  private-route render guards so the landing/dashboard does not flash
  during the OAuth callback window.

---

## 1. Issue description

After task-103 the **post-auth** window is clean (single progress modal owns
everything from sign-in to dashboard). The **pre-auth** window — the segment
between clicking "Continue with Openfort" and the progress modal taking over
— is still confusing. User-reported sequence on a fresh login:

1. Land on `/`, see InfraFund box + "Continue with Openfort" button.
2. Click button → Openfort modal opens with Google / Email choices.
3. Click Google → Google OAuth screen shows "Connecting…" briefly, disappears.
4. **InfraFund landing box reappears (looks like a page reload).**
5. **Google connect modal appears a second time.**
6. Finally the task-103 progress list takes over.

Goal: collapse steps 4–5 so the user goes straight from "completing Google
auth" to "our progress list". No flash of the landing page, no second
Openfort OAuth modal.

---

## 2. Root-cause analysis

`@openfort/react` uses **redirect-based** OAuth (full-page navigation, not a
popup):

- `node_modules/@openfort/react/build/hooks/openfort/auth/useOAuth.js:145` —
  `window.location.href = redirectUrl;` sends the browser to Google.
- After consent, Google redirects back to our app at
  `/?openfortAuthProviderUI=google&user_id=…&access_token=…`.
- On mount, `ConnectModal/index.js:165-194` detects those params, calls
  `setOpen(true)`, sets connector to `google`, and routes to the
  `ConnectWithOAuth` page.
- `ConnectModal/ConnectWithOAuth.js:22-72` then runs its `INIT → CONNECTING`
  flow: extracts `user_id` and `access_token`, strips them from the URL, and
  calls `client.auth.storeCredentials(...)`. Once that resolves, our `useUser`
  hook flips to `isAuthenticated = true` and the existing
  `bootstrapSession` useEffect calls `closeOpenfortModal()`.

So the user's perception decodes as:

| User sees                           | Actually is                                                       |
| ----------------------------------- | ----------------------------------------------------------------- |
| First "Google modal" (step 3)       | The actual Google OAuth screen on `accounts.google.com`           |
| "Page reload" (step 4)              | Google → our app full-page navigation; landing box renders        |
| Second "Google modal" (step 5)      | Openfort's own `ConnectWithOAuth` page reopening on `/`           |
| Progress list takes over (step 6)   | `storeCredentials` resolves → our useEffect closes Openfort modal |

The redirect itself is **unavoidable** with the current Openfort React SDK
(no popup mode). Closing Openfort's modal preemptively before
`storeCredentials` runs is also unsafe — `ConnectWithOAuth` must mount for
`storeCredentials` to be called, which is what authenticates the user.

What we **can** do is mask the brief Openfort OAuth UI window with our own
progress modal that already exists from task-103.

---

## 3. Recommended fix

Two minimal, complementary changes — neither fights the Openfort SDK.

### 3.1 Show our progress modal immediately on OAuth callback

In `AuthSessionProvider`, add a single small effect that runs once on mount:
if `window.location.search` contains `openfortAuthProviderUI`, seed
`authProgress` with the standard returning-user 5-step plan and mark
`signing_in` as **active** straight away.

Our task-103 progress modal renders at `z-[10001]` with an opaque-ish
backdrop, which sits above Openfort's `ConnectModal` portal. So even though
Openfort's `ConnectWithOAuth` page does open underneath (and must — that's
what calls `storeCredentials`), the user never sees it.

Once the existing `bootstrapSession` useEffect fires (after Openfort flips
`isAuthenticated`), it overwrites `authProgress` with a fresh plan and the
flow continues exactly as task-103 already handles it. No new state machine,
no changes to step IDs.

**File:** `src/components/auth/auth-session-provider.tsx` (~10 lines, new
useEffect placed just above the existing bootstrap effect).

### 3.2 Hide the public landing while we're handling an OAuth callback

In `MainLayout`, when an OAuth callback param is present in the URL OR
`authProgress` is non-null, render nothing on the public route — the
progress modal handles all visuals.

The existing `isBootstrapping` guard already covers
`loading | creating_wallet | error`. We extend it to also cover the brief
gap between page mount and the bootstrap useEffect firing (where `status`
is still `idle`).

**File:** `src/components/main-layout.tsx` (~5 lines, derive a new boolean
`isHandlingOAuthCallback` and OR it into the existing render guard).

---

## 4. Out of scope

- Replacing Openfort's redirect-based OAuth with a popup-based flow (would
  require bypassing the SDK's modal entirely — too invasive).
- Pre-loading the Openfort modal in a hidden popup window.
- Rolling our own Google OAuth client.
- Eliminating the actual Google → our-app navigation (inherent to
  redirect-based OAuth).

---

## 5. Verification

1. `npm run dev:local`, open via `chrome-devtools-mcp`.
2. Sign out completely (or use an incognito profile) so the next Google auth
   actually round-trips through Google's consent screen rather than silent
   re-auth.
3. Click "Continue with Openfort" → Google → consent.
4. **Expected:** on redirect back, the progress modal is the first thing
   visible. No flash of landing box. No second Google modal. `signing_in`
   shows active immediately, then ticks through normally to `authenticated`.
5. `npm run format` and `npm run build` pass.

---

## 6. Notes on what we are NOT fixing

- The actual Google → our-app navigation (the "page reload" feeling) is
  inherent to redirect-based OAuth. Without a popup mode in the Openfort
  SDK we cannot eliminate it; we can only mask the visible mess.
- Openfort's `ConnectWithOAuth` page is still mounted underneath our modal
  during the ~100–300 ms that `storeCredentials` takes. We hide it from
  view rather than prevent it.
- If the upstream Openfort React SDK ever exposes a programmatic
  "complete OAuth callback without opening modal" API, we should switch to
  it and drop change 3.1.

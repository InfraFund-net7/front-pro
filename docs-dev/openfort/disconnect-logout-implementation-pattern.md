<!-- cspell:words openfortAuthProviderUI Openfort openfort Penpal iframe -->

# Openfort Disconnect / Logout — Implementation Pattern

**Audience:** anyone integrating Openfort React SDK with their own backend session, or any future engineer hitting "disconnect doesn't actually log the user out".

**Status:** verified working pattern as of `@openfort/react@1.0.15` and `@openfort/openfort-js@1.3.3`.

**Reference fix:** task 113 in InfraFund Front Pro, `docs-dev/release-notes/v1.1.3-fix-disconnect-logout.md`.

## TL;DR

If your app uses Openfort for identity **and** issues its own backend session (HTTP-only refresh cookie, JWT, etc.), the canonical Openfort docs example for `useSignOut` is **not enough**. You need to:

1. Strip Openfort OAuth callback params from the URL **before** navigation.
2. **Fully `await`** `useOpenfortCore().logout` (not `useSignOut().signOut` — explanation below).
3. Revoke your own backend session.
4. **Hard-reload** to your public landing page (not soft `router.replace` / `router.push`).
5. Make sure your auth bootstrap effect can't fire while the disconnect is in flight.

If you skip any of these, you can end up in one of three failure modes:

- "I clicked disconnect and I'm still logged in." (storage not cleared because `useSignOut.signOut` doesn't await its inner `logout`)
- "I clicked disconnect, the URL is now `…/?openfortAuthProviderUI=google&access_token=…`, and reloading logs me back in." (soft navigation left `OpenfortProvider` mounted; the SDK's `ConnectModal` re-detects the callback params)
- "I clicked disconnect and the 5-step login modal flashes for ~100 ms before going home." (auth bootstrap useEffect re-fired during the in-flight disconnect awaits)

## Background — what the Openfort SDK gives you

Openfort React exposes several auth-related hooks. The relevant ones for sign-out:

| Hook | What it does |
|---|---|
| `useSignOut()` | Returns `{ signOut, status }`. Wraps the core logout with status tracking + optional `onSignOutSuccess` / `onSignOutError` callbacks. Documented as the canonical disconnect entrypoint. |
| `useOpenfortCore()` | Returns the lower-level SDK client including a `logout` function that you can `await` directly. |
| `useUI()` | Returns `{ open, close, setIsOpen, … }` for controlling the Openfort built-in `ConnectModal`. |
| `useUser()` | Returns `{ user, isAuthenticated, isLoading, getAccessToken }`. Drives auth-state-change effects. |

The Openfort docs disconnect example looks like this:

```tsx
const { signOut } = useSignOut({
  onSignOutSuccess: () => {
    window.location.href = '/';
  },
});
```

That example is correct for a pure-Openfort app where Openfort owns the entire session. It is **not** sufficient for an app that also issues its own backend session (cookie / JWT) and that has Openfort callback URL params landing in the address bar after OAuth.

## Trap 1 — `useSignOut().signOut` doesn't fully await the underlying logout

In `@openfort/react@1.0.15`, the `signOut` callback returned by `useSignOut` looks (paraphrased) like:

```ts
const signOut = useCallback(async () => {
  setStatus({ status: 'loading' });
  try {
    logout();                      // <-- NOT awaited
    setStatus({ status: 'success' });
    return onSuccess({ ... });
  } catch { /* ... */ }
}, [logout]);
```

The inner `logout()` (from `useOpenfortCore`) is a `Promise`-returning function that:

1. Synchronously clears the in-memory store (`setUser(null)`, `setActiveEmbeddedAddress(undefined)`, `setWalletStatus({ status: 'idle' })`, etc.).
2. Then `await openfort.auth.logout()` — the network call to `iam/v1/sessions/logout`, which is also where the SDK clears its localStorage entries (`auth`, `account`, …).
3. Then `await bridge.disconnect()`.

Because `useSignOut.signOut` does **not** `await` step 2/3, your `await signOut()` resolves while the localStorage clear is still in flight. If your code then immediately hard-reloads:

```ts
await signOut();           // resolves before storage is cleared
window.location.href = '/'; // page unloads with credentials still in storage
```

…OpenfortProvider re-mounts on the new page, reads the still-populated storage, sees the old auth tokens, and auto-restores the session. From the user's perspective: they clicked Disconnect, the page reloaded, and they're still logged in.

**Fix:** use `useOpenfortCore().logout` directly and `await` it. That gives you a promise that resolves only after `openfort.auth.logout()` and `bridge.disconnect()` have both completed and storage is fully cleared.

```ts
const { logout: openfortLogout } = useOpenfortCore();
// ...
await openfortLogout(); // fully drains SDK storage
```

The `useSignOut` docs example only works for the simplest possible case because the page unload is so fast that the in-flight network request to `iam/v1/sessions/logout` typically still reaches the server, and the localStorage clear is local-process so it persists across the same-origin reload anyway. But if you have any extra work to do between `signOut()` and the navigation (e.g. revoking your own backend session, which we do), or if the network round-trip is slow (Vercel preview, throttled connection), the race becomes visible.

## Trap 2 — soft navigation leaves OpenfortProvider mounted

A natural Next.js instinct after disconnect is:

```ts
router.replace('/');
```

This is wrong for Openfort logout. Soft navigation does not unmount the `OpenfortProvider`, the `ConnectModal`, or the `useUser` subscription. Specifically:

- The SDK's `ConnectModal` watches `window.location.search` for keys like `openfortAuthProviderUI`, `access_token`, `user_id`. When detected, it auto-opens itself and runs the OAuth callback handler (`ConnectWithOAuth`), which calls `storeCredentials`. This is how the "Login with Google" return flow re-arms auth on the next page mount.
- If those params are still in the URL when the disconnect path runs (e.g. user just logged in, then immediately hits Disconnect), and you only do `router.replace('/')`, the modal can re-detect them on a subsequent render or you can end up at `/?openfortAuthProviderUI=…` because Next.js is preserving the query string differently than you expect.
- Even if the params are clean, the in-memory SDK state (Penpal bridge, embedded-wallet iframe handle, internal `connectingRef`) is still mounted. Whether or not that re-arms auth depends on platform timing — it consistently failed on Vercel preview, intermittently passed on localhost.

**Fix:** strip the callback params from the URL **before** navigating, then **hard-reload**:

```ts
function stripOpenfortCallbackParams() {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  let mutated = false;
  for (const key of [
    'openfortAuthProviderUI',
    'access_token',
    'user_id',
    'error',
  ]) {
    if (url.searchParams.has(key)) {
      url.searchParams.delete(key);
      mutated = true;
    }
  }
  if (mutated) {
    window.history.replaceState({}, document.title, url.toString());
  }
}

function hardNavigateToRoot() {
  if (typeof window === 'undefined') return;
  stripOpenfortCallbackParams();
  if (window.location.pathname === '/') {
    window.location.reload();
  } else {
    window.location.assign('/');
  }
}
```

Hard-reload is the only way to guarantee the entire React tree (and therefore `OpenfortProvider` and all its in-memory state) is torn down and rebuilt from a clean URL.

## Trap 3 — there are two disconnect entry points, not one

Most teams build a custom "Disconnect" button somewhere in their own UI (we have it in the avatar menu). But the Openfort built-in modal **also** has a Disconnect button on its profile page. Users can hit either, and you have to handle both.

The two paths look like this:

```text
Custom button (avatar menu)                 Openfort modal Disconnect
─────────────────────────────              ────────────────────────────
your logout()                              SDK's internal logout()
  └─ openfortLogout (await)                  └─ store.setUser(null)
  └─ revoke backend session                  └─ openfort.auth.logout (in flight)
  └─ hardNavigateToRoot                    
                                           your secondary effect:
                                             - useUser hook re-renders
                                               with isAuthenticated=false
                                             - your "signedOut detector"
                                               useEffect fires
                                             - you revoke backend session
                                             - hardNavigateToRoot
```

If you only handle the custom-button path, the Openfort built-in disconnect leaves your backend session live: your refresh cookie still works, and the next time the user opens your app they're partially logged in (Openfort says "no", your app says "yes" until the next refresh fails).

**Fix:** drive both paths through the same exit point. We use a "secondary `signedOut` useEffect" that watches `useUser().isAuthenticated` going from `true → false`:

```ts
const previousAuthState = useRef(false);
const logoutInProgressRef = useRef(false);

useEffect(() => {
  const signedOut =
    previousAuthState.current && !isLoading && !isAuthenticated;

  previousAuthState.current = isAuthenticated;

  if (!signedOut) return;
  if (logoutInProgressRef.current) return; // custom button path already running
  logoutInProgressRef.current = true;

  void (async () => {
    await logoutBackendSession().catch(() => undefined);
    await openfortLogout().catch(() => undefined); // idempotent safety net
    hardNavigateToRoot();
  })();
}, [isAuthenticated, isLoading, openfortLogout]);
```

The `logoutInProgressRef` is set to `true` at the **start** of your custom logout, so when the SDK's `setUser(null)` flips `isAuthenticated` mid-await, this effect fires but short-circuits — only one path drives the cleanup.

## Trap 4 — your auth bootstrap effect re-fires during the in-flight disconnect

If your auth provider has a "primary driver" effect that runs auth bootstrap whenever `isAuthenticated && userId`, you have to make sure it doesn't kick off a fresh bootstrap **during** the disconnect.

Concrete race we hit:

1. User clicks Disconnect.
2. Custom logout begins. Sets `logoutInProgressRef = true`. Calls a `clearSession()` helper that resets your bootstrap-attempt deduplication ref to `null`.
3. `setStatus('unauthenticated')` (or any other state-touching call) triggers a re-render.
4. The bootstrap effect re-evaluates. At this moment:
   - `isAuthenticated` is still `true` (Openfort hasn't logged out yet — `openfortLogout()` is still awaiting).
   - The deduplication ref is `null`.
   - → The effect runs `bootstrapSession()` again, which seeds the 5-step "Loading…" modal.
5. ~100 ms later `openfortLogout` finishes, `isAuthenticated` flips false, the bootstrap effect re-runs and short-circuits, and `hardNavigateToRoot` runs.

Net effect: a ~100 ms flash of the wrong UI right before the reload. Cosmetic but jarring.

**Fix (two layers, belt-and-suspenders):**

1. Gate the bootstrap effect on `logoutInProgressRef`:

   ```ts
   useEffect(() => {
     if (logoutInProgressRef.current) return;
     // ... rest of bootstrap logic ...
   }, [/* deps */]);
   ```

2. Don't touch React state mid-disconnect. Move any state-clearing calls (`setStatus`, `clearSession`, etc.) **after** the awaits, or remove them entirely if you're hard-reloading anyway. Hard-reload throws away all React state, so there's no value in mutating it first.

## Trap 5 — don't treat refresh restore like interactive login

A browser refresh by an already signed-in user is not the same as an OAuth return or a fresh login. If your app has its own refresh cookie, use that as the first restore path and keep it quiet:

1. Wait for Openfort identity to finish loading.
2. If Openfort still has a user, try your backend refresh-cookie endpoint first.
3. If the refresh cookie succeeds, load your backend profile and mark the app session authenticated immediately.
4. Only fall back to Openfort token exchange / account check if the backend refresh cookie is absent or invalid.
5. Only seed visible login/bootstrap progress UI for that fallback path, not for the refresh-cookie fast path.

If you seed the login progress UI before trying the refresh cookie, every normal page refresh looks like a new login. If you also block rendering on wallet reconnect, a simple refresh can turn into a 10+ second black/loading screen.

Good refresh flow:

```ts
const refreshed = await refreshBackendSession().catch(() => null);

if (refreshed) {
  const me = await getBackendMe(refreshed.access_token);
  finalizeAuthenticatedSession(refreshed.access_token, me);
  void reconnectWalletInBackground();
  return;
}

// No app refresh cookie: now this is an interactive Openfort bootstrap.
setStepPlan([...]);
const openfortAccessToken = await getAccessToken();
```

## Trap 6 — embedded wallet reconnect is runtime state, not route auth

Openfort auth and the embedded wallet connection have different lifetimes:

- Openfort identity/auth can survive refresh via SDK storage.
- Your backend app session can survive refresh via an HTTP-only refresh cookie.
- The embedded wallet iframe/bridge is in-memory browser runtime state. A full page refresh tears down the React tree, Openfort provider, hidden iframe, Penpal bridge, and live wallet connection.

With `connectOnLogin: false`, calling `create()` is still needed for returning users if the app needs wallet signing, because it reloads/reconnects the embedded wallet iframe. But reconnecting the wallet should not be a prerequisite for rendering normal authenticated pages that only need profile/session data.

Recommended policy:

- For first login, onboarding completion, or routes/actions that immediately require signing: await `create()` and show explicit progress/errors.
- For refresh-cookie restore: render after backend session/profile restore, then start wallet reconnect in the background.
- UI that displays the wallet should tolerate a temporary `Not connected` state and update when reconnect completes.
- Log background reconnect failures for diagnostics, but do not downgrade the whole app session to `error` unless the current user action requires the wallet.

## Trap 7 — preserve private deep links during transient restore states

Route guards must distinguish between "not authenticated yet" and "confirmed unauthenticated". During refresh, auth state commonly passes through `idle` / `loading` before the refresh-cookie path finalizes. Redirecting private routes during those transient states causes deep links to be lost.

Bad guard:

```ts
if (!isPublicRoute && status !== 'authenticated') {
  router.replace('/');
}
```

On `/projects/1/digital-twin`, this can produce:

```text
refresh private route → status loading → replace('/') → session restored → public-route authenticated guard → replace('/home')
```

Good guard:

```ts
if (!isPublicRoute && status === 'unauthenticated') {
  router.replace('/');
}
```

Keep private route content hidden behind a loading surface while auth is settling, but do not mutate the URL until the user is definitively logged out.

## The full pattern

Putting it together, this is the disconnect entry point in `auth-session-provider.tsx`:

```tsx
import { useOpenfortCore, useUI, useUser } from '@openfort/react';

const OPENFORT_CALLBACK_PARAMS = [
  'openfortAuthProviderUI',
  'access_token',
  'user_id',
  'error',
] as const;

function stripOpenfortCallbackParams() {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  let mutated = false;
  for (const key of OPENFORT_CALLBACK_PARAMS) {
    if (url.searchParams.has(key)) {
      url.searchParams.delete(key);
      mutated = true;
    }
  }
  if (mutated) {
    window.history.replaceState({}, document.title, url.toString());
  }
}

function hardNavigateToRoot() {
  if (typeof window === 'undefined') return;
  stripOpenfortCallbackParams();
  if (window.location.pathname === '/') {
    window.location.reload();
  } else {
    window.location.assign('/');
  }
}

export function AuthSessionProvider({ children }) {
  const { isLoading, isAuthenticated } = useUser();
  const { logout: openfortLogout } = useOpenfortCore();
  const { close: closeOpenfortModal } = useUI();
  const logoutInProgressRef = useRef(false);
  const previousAuthState = useRef(false);

  // Custom button entry point.
  const logout = useCallback(async () => {
    if (logoutInProgressRef.current) return;
    logoutInProgressRef.current = true;
    closeOpenfortModal();

    await logoutBackendSession().catch(() => undefined);
    await openfortLogout().catch(() => undefined);

    hardNavigateToRoot();
  }, [closeOpenfortModal, openfortLogout]);

  // Openfort built-in modal entry point.
  useEffect(() => {
    const signedOut =
      previousAuthState.current && !isLoading && !isAuthenticated;
    previousAuthState.current = isAuthenticated;

    if (!signedOut) return;
    if (logoutInProgressRef.current) return;
    logoutInProgressRef.current = true;

    void (async () => {
      await logoutBackendSession().catch(() => undefined);
      await openfortLogout().catch(() => undefined);
      hardNavigateToRoot();
    })();
  }, [isAuthenticated, isLoading, openfortLogout]);

  // Bootstrap effect must short-circuit during disconnect.
  useEffect(() => {
    if (logoutInProgressRef.current) return;
    // ... your bootstrap logic ...
  }, [/* ... */]);

  return <Context.Provider value={{ logout, ... }}>{children}</Context.Provider>;
}
```

## What success looks like

After applying the pattern, both disconnect paths produce the same observable behavior:

- Click Disconnect → ~100–300 ms wait (network round-trip for both backend logout and Openfort logout).
- Page hard-reloads to `/`.
- URL has no Openfort callback params.
- `localStorage` has no Openfort entries.
- Reloading the page keeps the user logged out.
- Both localhost dev server and Vercel preview behave identically.

If you hit a regression here in the future, the first three things to check (in order):

1. Did someone replace `useOpenfortCore().logout` with `useSignOut().signOut`? (Common because the docs example is so visible.)
2. Did someone replace `window.location.assign('/')` with `router.replace('/')` or `router.push('/')`? (Common because the rest of the app uses `next/navigation` everywhere else.)
3. Did the `logoutInProgressRef` guard get removed from the bootstrap effect? (Easy to miss in a "tidy up dependencies" PR.)

## Why the canonical docs example isn't this

The Openfort docs example is correct for the simplest case: a fully Openfort-owned session, no separate backend session, no callback-param leakage in the URL, no in-app routing/state to keep clean. Most production apps don't fit that profile. The pattern in this document is the production version.

Worth filing as a docs improvement upstream, but until then this file is the reference for our codebase and any spinoff Openfort projects.

## Related files

- Implementation: `src/components/auth/auth-session-provider.tsx`
- Task tracking: `docs-dev/tasks/task-113-fix-disconnect-logout.md`
- Release notes: `docs-dev/release-notes/v1.1.3-fix-disconnect-logout.md`
- Vercel branch-skip config (separate concern): `vercel.json` `ignoreCommand`

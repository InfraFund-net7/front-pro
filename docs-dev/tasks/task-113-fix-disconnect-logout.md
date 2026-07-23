<!-- cspell:words openfortAuthProviderUI -->

# Task 113 — Fix Openfort Disconnect / Logout Regression

**Date:** 2026-05-09
**Status:** Open
**Priority:** High
**Related release notes:**

- `docs-dev/release-notes/v1.0.9-backend-next-migration-openfort-simplification.md`
- `docs-dev/release-notes/v1.0.10-backend-next-migration-openfort-simplification.md`
- `docs-dev/release-notes/v1.1.0-nextjs-backend-openfort-auth-summary.md`
- `docs-dev/release-notes/v1.1.2-code-audit-cleanup.md`
**Related task:** `docs-dev/tasks/task-112-code-audit.md`

## Most important regression clue

This issue likely has a very small and very useful regression window.

From the current working theory:

- disconnect likely worked before `6c501b4` (`Merge pull request #19 from InfraFund-net7/chore/task-112-code-audit-cleanup`)
- disconnect definitely did not work after `d80ded7` (`fix: upgrade Next.js security patch`)
- after the security patch, repeated attempts were made to repair disconnect, but none of those attempts fixed the user-facing problem

That makes these two commits the first place to investigate before adding any new speculative logic:

- `6c501b4`
- `d80ded7`

Recommended workflow for the next attempt:

- do **not** continue fixing directly on `develop`
- create a dedicated fix branch from a point before the regression, or from the last known-good commit if one can be identified with confidence
- reproduce and debug there
- merge back into `develop` only once the fix is confirmed to work on both localhost and preview

This is likely more efficient than continuing to stack additional disconnect experiments onto the already-broken `develop` line.

## Problem description — user experience only

There are currently two visible ways for a user to disconnect:

1. **InfraFund custom disconnect**
   - Click the top-right avatar circle
   - Click **Disconnect** in the app dropdown

2. **Openfort built-in disconnect**
   - Click the Openfort button to open the Openfort modal
   - Navigate to the small built-in profile / disconnect popup
   - Click **Disconnect** there

Expected behavior for both:

- The user should be logged out cleanly.
- The app should return to the public logged-out page.
- No auth bootstrap UI should appear.
- No Openfort callback URL or access token should remain in the browser address bar.
- Reloading the page should keep the user logged out.

Actual behavior observed:

- Clicking **Disconnect** does not produce a clean logout.
- The user briefly sees a blank / black page.
- In some versions of the attempted fixes, the app shows either:
  - a generic loading popup, or
  - the full 5-step login/bootstrap popup
  for a moment after disconnect.
- Final state is a blank / black screen with a long callback-style URL in the browser address bar.
- The URL contains Openfort OAuth callback parameters such as:
  - `openfortAuthProviderUI`
  - `access_token`
  - `user_id`
- Reloading the page can re-trigger auth/bootstrap instead of leaving the user logged out.

This is currently reproducible on preview / Vercel deployments and has also shown different but related behavior locally.

## What we need to implement

We need a clean, deterministic logout flow that makes **both disconnect entry points** behave the same way:

- Custom InfraFund disconnect from the avatar menu
- Openfort built-in disconnect from the Openfort modal/profile flow

Implementation goal:

- both paths must end in the exact same logged-out app state
- Openfort auth state must be cleared
- InfraFund backend session / refresh-cookie state must be cleared
- the app must not re-enter Openfort login/bootstrap flow during or immediately after disconnect
- any callback-style URL parameters must not be allowed to relaunch the auth flow after logout

A good final implementation should ideally make the app’s custom logout path align as closely as possible with Openfort’s supported / standard flow, while still correctly revoking the separate InfraFund backend session.

## What needs to be considered

### 1. Two-layer auth model

InfraFund does not use Openfort alone.

There are **two separate layers**:

- **Openfort session** — identity/auth/wallet state owned by Openfort
- **InfraFund app session** — backend JWT access token + refresh cookie + profile/bootstrap state owned by this app

Because of this, a simple Openfort sign-out is not enough on its own. The app must also revoke its own backend session.

### 2. Qualification-gated wallet model

The app intentionally uses `connectOnLogin: false` and manually controls when the wallet is connected/created.

That means auth bootstrap is not trivial:

- login
- account existence check
- session restore or exchange
- profile load
- wallet connect / setup

So disconnect must avoid accidentally re-triggering any of those post-login bootstrap steps.

### 3. Openfort callback URL handling

The app contains logic that reacts to callback-shaped URLs using query params like:

- `openfortAuthProviderUI`
- `access_token`
- `user_id`
- `error`

This logic was added to smooth the OAuth return/login experience, but it appears to be one of the main reasons logout is now fragile.

Any final logout fix must carefully handle the interaction between:

- Openfort SDK auto-detection of callback params
- app-side OAuth/bootstrap detection
- router redirects
- modal open/close state

### 4. Two disconnect entry points must converge

Even if the custom app disconnect button is fixed, the Openfort built-in disconnect must also end in the same stable logged-out result.

If one path works and the other does not, the bug is not fully solved.

### 5. Vercel / preview behavior differs from localhost

The bug has shown different symptoms between localhost and preview deployment.

That suggests the final fix must be validated on:

- localhost
- Vercel preview deployment

because redirect timing / OAuth return URL behavior may differ by environment.

## Why it likely worked before

Based on code history and release notes, disconnect used to be simpler and more passive.

Older auth/session flow behavior:

- the app mostly reacted to Openfort becoming unauthenticated
- then revoked its own backend session in a side effect
- there was less custom callback/bootstrap orchestration layered on top of the SDK

Relevant historical milestones:

- `v1.0.9` and `v1.0.10` describe a leaner Openfort integration
- `v1.1.0` documents the later login/bootstrap UX cleanup and callback smoothing work
- after that, several auth UX improvements introduced more custom state handling around login/bootstrap/callbacks

Strong hypothesis:

- disconnect likely worked before the later auth UX orchestration became more complex
- it may have still worked as late as around `v1.1.1`
- the regression may have been exposed or worsened by later changes around callback handling, modal management, or app-shell auth bootstrap

## Why v1.1.2 is a likely regression suspect

The large cleanup release in:

- `docs-dev/release-notes/v1.1.2-code-audit-cleanup.md`
- `docs-dev/tasks/task-112-code-audit.md`

is a likely suspect from the user’s perspective because it was a broad cleanup/refactor pass and the disconnect issue was noticed after that period.

Important nuance:

- the v1.1.2 release note explicitly says `auth-session-provider.tsx` was intentionally left alone
- so task 112 may not have directly edited the main auth state machine
- however, large cleanup work can still indirectly affect runtime behavior through surrounding UI/layout/state interactions or by changing expectations around what was manually smoke-tested afterward

At minimum, this release window should be treated as the main regression investigation range.

## What we tried and what did not work

Several attempted fixes were made and pushed, but the user confirmed they did **not** solve the issue.

### Attempted fixes that did not resolve it

1. **Treat logout callback URL as stale and sanitize it**
   - added callback classification helper logic
   - tracked logout-in-progress markers in sessionStorage
   - attempted to strip callback params after disconnect
   - result: did not solve the issue

2. **Switch custom logout path to use Openfort core logout more directly**
   - tried aligning custom app logout with Openfort’s internal modal disconnect behavior
   - result: did not solve the issue

3. **Simplify back toward older passive logout model**
   - removed some of the added callback helper logic
   - cleared local app state earlier
   - result: still ended in blank screen / callback URL behavior

4. **Clear callback params immediately on logout**
   - stripped `openfortAuthProviderUI`, `access_token`, `user_id`, `error` from the current URL before logout settled
   - result: no user-visible change

5. **Reset more Openfort modal/UI state during logout**
   - attempted stronger modal reset and route reset behavior
   - one attempt introduced a build error due to use of a non-exported API
   - build compatibility was restored afterward
   - result: still did not fix the user-facing logout bug

### Build / deployment side issues encountered during attempts

- one attempted fix used `useOpenfortUIContext`, which is **not exported** by `@openfort/react`, causing a build failure
- `vercel.json` was updated to try to ignore `entire/checkpoints/v1` branch deployments because the extra Entire checkpoint pushes were triggering unwanted Vercel deploy attempts

## Recommended approach for the next session

Do not continue stacking speculative fixes onto the current logic blindly.

Start fresh with a focused debugging pass:

1. reproduce the bug in-browser with devtools/network visibility
2. capture the exact sequence after disconnect:
   - URL changes
   - router changes
   - Openfort modal state
   - auth state changes (`isLoading`, `isAuthenticated`, `status`)
3. identify which effect / SDK behavior re-opens the auth/bootstrap path
4. decide whether the fix belongs in:
   - app-side auth-session-provider logic
   - app-side layout callback handling
   - Openfort modal control flow
   - or the integration architecture itself

The likely solution is not a large refactor. It is more likely a **small but precise** fix once the exact redirect/state sequence is observed.

## Definition of done

This task is complete only when all of the following are true:

- Disconnect from the avatar menu logs the user out cleanly.
- Disconnect from the Openfort built-in modal also logs the user out cleanly.
- The app ends on the public logged-out page.
- No callback/access-token query params remain in the browser address bar after logout.
- Reloading the page keeps the user logged out.
- Behavior is verified on both localhost and Vercel preview.
- No new build errors or deployment regressions are introduced.

## Notes for future pickup

- Treat this document as the fresh starting point.
- Re-check the regression window around late `v1.1.1` to `v1.1.2` and the auth UX cleanup commits before that.
- If needed, compare working historical behavior against current behavior in-browser, not only by reading code.

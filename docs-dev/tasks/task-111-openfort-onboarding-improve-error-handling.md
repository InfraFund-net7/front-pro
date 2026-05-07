<!-- cspell:words Openfort Infrafund onboarding -->

# Task 111: Openfort onboarding improve error handling

## Summary

Improve the Openfort login and onboarding flow so users are routed correctly between login and registration, recover cleanly from partially completed states, and see actionable error messages instead of generic retry prompts.

## Problem statement

The current flow can leave users stuck between Openfort identity and the app database state.

Observed issues include:

- A user can be sent to the onboarding questionnaire even though an app user record already exists or can be recovered.
- A user can reach step 3 (`Creating your account`) and receive a conflict such as `User already exists`.
- Generic messages such as `Something went wrong. Please try again.` or `please try again` are misleading when the problem is deterministic and retrying will not help.
- Users need a clean exit path if the flow gets stuck.
- The system should recover from temporary desynchronization between Openfort and the app database.

## Requirements

### 1. Expected behavior: existing user

If the authenticated Openfort user already maps to an existing app user, the user must not be sent to onboarding.

Expected outcome:

- Create an app session.
- Load the user profile.
- Connect or restore the wallet.
- Finish in authenticated state.

### 2. Expected behavior: new user

If the authenticated Openfort user does not map to an existing app user, the user should be sent to the onboarding questionnaire.

Expected outcome after successful questionnaire submission:

- Create the app user record.
- Create the app session.
- Set up or connect the wallet.
- Finish in authenticated state.

### 3. Recovery from Openfort/app DB desync

The flow must recover when Openfort identity and app database state are temporarily out of sync.

Important recovery cases:

- Openfort user exists, app user exists by `openfortUserId`.
- Openfort user exists, app user exists by verified email but is not yet linked by `openfortUserId`.
- Openfort user exists, app user was created during an earlier partial onboarding attempt.
- App user exists but the browser is still holding stale onboarding state from a previous run.

Expected outcome:

- If the user can be safely recovered and linked, do so automatically.
- Do not force the user through onboarding again when an existing account can be identified reliably.

### 4. Error handling requirements

Error messages must distinguish between:

- Recoverable transient issues such as network failures or expired sessions.
- Misconfiguration issues such as invalid Shield keys or missing environment variables.
- Identity and account-linking conflicts that require operator/support attention.
- Missing onboarding payload or invalid client-side state.

Expected behavior:

- Show user-facing messages that explain what happened and whether retrying is useful.
- Avoid generic `please try again` text unless the error is actually retryable.
- Preserve enough structured detail for logs and diagnostics.

### 5. Clean exit and restart

A user must be able to cancel or close the flow and restart from a clean state.

Expected cleanup:

- Clear local onboarding draft state.
- Clear transient auth progress state.
- Clear pending onboarding/wallet creation state.
- Attempt backend logout and Openfort sign-out where appropriate.
- Return the app to a clean unauthenticated state.

### 6. No accidental regressions

The improved error handling must not break the core login/register split.

Expected non-regression:

- Existing users still login directly.
- New users still go through onboarding.
- Wallet setup still happens only after session creation is complete.
- Errors are surfaced without changing intended success-path behavior.

## High-level implementation plan

### A. Normalize identity recovery on the backend

The backend should be the source of truth for recovery decisions.

Plan:

- Verify the Openfort access token first.
- Try to resolve the app user by `openfortUserId`.
- If not found, try to resolve by verified Openfort email.
- If found by email and it is safe, link that app user to the current `openfortUserId`.
- Only treat the user as genuinely new when no recoverable match exists.

Why:

- The frontend should not need to guess whether the user is new or existing when the backend can make that decision from verified identity data.

### B. Make `check` and `exchange` use the same resolution logic

The pre-onboarding check and the actual exchange/login path must use the same account-resolution rules.

Plan:

- Share a single backend resolution path for:
  - `checkOpenfortUser(...)`
  - `exchangeOpenfortSession(...)`
  - any conflict-recovery path after a failed create

Why:

- If the check route and exchange route apply different matching logic, users can be classified as new in one step and existing in the next.

### C. Recover from unique-constraint conflicts deterministically

Conflicts during user creation should not automatically be treated as fatal onboarding errors.

Plan:

- When create fails with a unique constraint, determine whether the conflict is on `openfortUserId` or email.
- Re-resolve the user using the shared identity-recovery path.
- If a user can now be recovered, continue the login flow instead of showing an error.
- Only show an unrecoverable error when the identity cannot be safely linked.

Why:

- Partially completed onboarding or concurrent requests can create the app user between the initial check and the create attempt.

### D. Tighten frontend state transitions

The frontend should not trap the user in onboarding after the backend can already identify them as existing.

Plan:

- Keep onboarding only for confirmed new-user cases.
- On onboarding submission failure, surface the backend message clearly.
- If the backend now indicates the user exists and was recovered, continue the login path instead of returning to the questionnaire.
- Preserve a clear cancel/restart path.

Why:

- A stale questionnaire should not win over backend truth.

### E. Improve user-facing error messages

Replace generic text with messages based on error category.

Plan:

- Map transient errors to retry guidance.
- Map configuration errors to support-oriented guidance.
- Map identity conflicts to account-recovery or support guidance.
- Include detail from backend `message`, `detail`, and structured fields when safe to expose.

Why:Write the requirements = expected behaviour , and then the
   implementation plan (no code needed , keep it high level, just mention any pitfalls or
   whatever needed to be able implement it properly). Filename :
   `docs-dev/tasks/task-111-openfort-onboarding-improve-error-handling.md`

- The user needs to know whether retrying is meaningful.

### F. Improve logging and observability

Logs should clearly show where the flow failed and whether recovery was attempted.

Plan:

- Log the flow stage (`check`, `exchange`, `onboarding`, `wallet create`, `encryption session`).
- Include the recovery path taken (`matched_by_openfort_id`, `matched_by_email`, `linked_existing_user`, `create_new_user`).
- Include non-sensitive identifiers useful for debugging, such as the tail of the Openfort user ID.
- Keep secrets and raw tokens out of logs.

## Pitfalls and implementation notes

### 1. Email-based recovery must be conservative

Matching by email is useful, but it must only use verified identity data coming from Openfort.

Notes:

- Do not trust arbitrary client-submitted email values for linking.
- If an email is already linked to a different active Openfort identity and that situation cannot be resolved safely, fail with a clear support-oriented message.

### 2. `check` route and `exchange` route must not drift

This is the main source of user-classification bugs.

Notes:

- If `check` says `new` but `exchange` says `existing`, the UX becomes inconsistent.
- Shared backend resolution logic is required.

### 3. Conflict recovery should not hide real data issues

Recover when safe, but do not silently merge unrelated identities.

Notes:

- Automatic recovery is correct for obvious partial-onboarding and same-email same-user cases.
- Ambiguous identity collisions should be surfaced explicitly.

### 4. Clean restart must clear both local and remote session artifacts

Only clearing React state is not enough.

Notes:

- Clear session storage and in-memory flow state.
- Attempt backend logout and Openfort sign-out.
- Ensure the next login attempt starts from the normal bootstrap path.

### 5. Keep wallet setup separate from account resolution

Wallet setup happens after session establishment and should remain a later step.

Notes:

- Do not mix wallet creation failures with user-resolution failures.
- Report them separately so the correct stage is visible in the UI and logs.

## Suggested validation scenarios

1. Existing app user with matching `openfortUserId` logs in directly.
2. Brand-new Openfort user completes onboarding, app user is created, then wallet is set up.
3. App user exists by verified email only, and is automatically linked to the current Openfort user and logged in.
4. App user is created during a partial onboarding attempt; reloading and trying again should recover and continue instead of failing at step 3.
5. A true configuration error in Shield still surfaces as a wallet-stage configuration issue rather than a generic auth failure.
6. Canceling or closing the flow returns the app to a clean unauthenticated state.

## Definition of done

This task is done when:

- Existing users never get stuck in onboarding when the backend can recover them.
- New users can complete onboarding without hitting misleading `already exists` errors.
- Error messages clearly indicate whether retrying is useful.
- The flow supports clean cancel/restart behavior.
- Backend logs make it clear which recovery path was used.
- No regressions are introduced in the standard login and wallet setup flow.

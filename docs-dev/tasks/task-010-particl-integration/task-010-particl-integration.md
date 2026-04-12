<!-- cspell:words Particl backpro openfort particl uuidv -->

# Task 010 - Particl Integration

## Status

- Last updated: 12 April 2026
- Frontend branch of record: `front-pro/particle`
- Backend branch currently in use: `backpro/openfort`
- Backend branch to resume Particle-aligned work on: `backpro/particl` (to be created)
- Overall state: the frontend Particle flow exists, but there is no matching backend auth/session handshake today

## Goal

Preserve the current frontend Particle implementation, keep the backend `openfort`
line intact, and document the exact context needed to resume later by creating a
parallel backend branch named `particl` from the pre-Openfort auth state.

This document is the handoff for that future work.

## Current state review

### Frontend (`front-pro`, branch `particle`)

The current frontend is already Particle-first.

#### Active behavior

- `src/app/layout.tsx`
  - wraps the app in `ParticleConnectProvider`
- `src/lib/particle-config.tsx`
  - validates the required public Particle env vars
  - enables social login
  - enables external wallet support through WalletConnect when `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` is present
- `src/components/header.tsx`
  - opens the Particle modal directly from the header
  - still shows a hardcoded guest identity in the shell
- `src/components/auth/login.tsx`
  - uses `AutoWalletRegister` as the active login/onboarding screen
- `src/components/AutoWalletRegister.tsx`
  - opens Particle manually
  - supports Particle social login
  - supports external wallets through the same Particle modal
  - reads Particle user info client-side
  - distinguishes Particle social login vs external wallet connection
  - lets the user save a contact email
  - stores that email in local storage only under `particle_contact_email`

#### Important frontend limitations right now

- No active frontend flow exchanges Particle identity for an InfraFund backend session.
- No active frontend flow stores a backend-issued access token.
- The saved contact email never leaves the browser.
- The header still shows placeholder guest identity instead of real backend/user data.

#### Legacy frontend auth plumbing still on disk

These routes/utilities still exist but are not wired into the current Particle UI:

- `src/app/api/auth/challenge/route.ts`
- `src/app/api/auth/register/route.ts`
- `src/app/api/login/route.ts`
- `src/app/api/register/route.ts`
- `src/utils/get-access-token.util.ts`
- `src/utils/interceptors.utils.ts`
- `src/services/api.service.ts`

Important mismatch:

- those proxy routes still target `auth/challenge`, `auth/register`, and `auth/login`
- nothing in the current Particle UI writes `access_token`
- the current modal-first frontend does not appear to call the legacy register/login flow

### Backend (`../backpro`, branch `openfort`)

The active backend no longer matches the frontend's provider or auth contract.

#### Live backend auth contract today

Active routes in `internal/interfaces/rest/router/auth.go`:

- `POST /v1/auth/openfort/exchange`
- `POST /v1/auth/refresh`
- `POST /v1/auth/logout`
- `GET /v1/me`
- `GET /v1/account/status`
- `GET /v1/kyc/status`

#### Live backend behavior today

- `internal/interfaces/rest/handler/auth.go`
  - expects an Openfort bearer token
  - accepts optional profile fields
  - issues the existing InfraFund JWT + refresh-cookie session
- `internal/application/auth/auth.go`
  - validates the Openfort token server-side
  - auto-provisions a local user
  - keeps the existing session, refresh-token, and lockout architecture
- durable external identity is currently `openfort_user_id`
- the earlier `particle_id` schema was renamed by migration `20260327193000_openfort_identity`
- `tests/integration/auth_test.go`
  - covers Openfort exchange
  - covers user provisioning
  - covers refresh/logout
  - covers protected endpoints

#### Important backend reality

I did not find active Particle auth code under the current live `backpro/internal/`
tree. The active router and auth service are Openfort-only. Some docs and migrations
still mention older Particle-era paths or schema names, but those are not the live
contract anymore.

### Observed cross-repo mismatch

Current frontend assumption:

- identity comes from Particle ConnectKit
- contact email is local-only
- no backend session is created

Current backend assumption:

- identity comes from an Openfort bearer token
- durable identity key is `openfort_user_id`
- protected app access depends on backend-issued session/JWT state

Result:

- the repos no longer share a live end-to-end auth contract

## Selected backend branch strategy

Do not revert `backpro/openfort`.

Instead, create a separate backend branch named `particl` from the clean
pre-Openfort base and continue Particle-aligned work there.

### Branch references

- Recommended new backend branch: `particl`
- Recommended base commit in `../backpro`: `35b1cf3`
- Reason: `35b1cf3` is the clean pre-Openfort branch point on `backpro/develop`
- First real backend auth-conversion commit on `openfort`: `0c5f83a`
  - `feat(auth): replace Particle login with Openfort exchange`

This keeps `openfort` intact while giving Particle work a clean branch to continue on.

## What `particl` would inherit from the pre-Openfort backend

At commit `35b1cf3`, the backend auth contract is Particle-based.

### Routes present at `35b1cf3`

- `POST /v1/auth/register`
- `POST /v1/auth/login`
- `POST /v1/auth/refresh`
- `POST /v1/auth/logout`

### Auth assumptions present at `35b1cf3`

- registration/login inputs use Particle `uuid` + `token`
- auth service validates those credentials through the Particle adapter
- durable external identity is `particle_id`
- the auth flow also creates wallet rows from Particle user info

### Important caveat

Creating `particl` from `35b1cf3` restores a Particle-aware backend baseline, but it
still does **not** automatically match the current frontend:

- the current frontend does not actively call `/auth/register` or `/auth/login`
- the current frontend does not explicitly collect/send Particle `uuid` + `token`
- the frontend still contains a leftover `/auth/challenge` proxy route, but the
  backend at `35b1cf3` does not expose a matching challenge endpoint

So the branch strategy solves the repo split, but not the final auth contract.

## Recommended implementation plan for `../backpro` on `particl`

### Phase 0 - Create `particl` and selectively port generic hardening

- Create `backpro/particl` from `35b1cf3`
- Review later `openfort` commits and cherry-pick only provider-agnostic work that
  still helps Particle, for example:
  - localhost-safe CORS/cookie hardening
  - `uuidv7()` compatibility/bootstrap fixes
  - security/dependency updates
  - local runbook/testing improvements
- Do **not** cherry-pick Openfort-specific auth contract changes into `particl`

### Phase 1 - Confirm the actual Particle proof-of-identity contract

Before backend implementation, confirm what the current Particle ConnectKit flow can
produce as secure proof for:

- social login
- external wallet connect inside the Particle modal

This point must be verified against the actual provider/client behavior, not assumed
from the old backend contract.

### Phase 2 - Define the backend auth surface that matches the current frontend

Do **not** blindly revive the old `register` / `login` contract as-is.

The current frontend is modal-first, not registration-form-first, so the backend
should likely move toward a cleaner exchange-style contract such as:

- `POST /v1/auth/particle/exchange`, or
- a provider-agnostic `POST /v1/auth/exchange`

That endpoint should accept:

- the provider proof that the backend can verify server-side
- app-specific profile fields the frontend already has or can collect:
  - `email`
  - `first_name`
  - `last_name`
  - `organization_name`
  - `phone_number`
  - `type`
  - `role`

Session endpoints should remain:

- `POST /v1/auth/refresh`
- `POST /v1/auth/logout`

### Phase 3 - Adapt the backend identity layer on `particl`

Once the contract is decided:

- add or restore the Particle verifier/adapter needed for server-side validation
- update routes, handler inputs, DTOs, auth service logic, and DI/bootstrap wiring
- decide how durable external identity should be stored:
  - short-term: restore `particle_id`
  - better long-term: use a provider-agnostic external identity model to avoid
    another full provider-specific migration later

### Phase 4 - Secure the external-wallet path

This is the biggest unknown.

For external wallets connected inside the Particle modal, the backend must use a real
proof strategy. That means one of:

- verify a provider-backed artifact server-side, or
- add a backend-generated challenge + signature verification flow

The backend must **not** trust:

- raw wallet addresses
- client-supplied user IDs
- frontend-only session assumptions

### Phase 5 - Port protected user/account endpoints if still needed

The current `openfort` backend already exposes:

- `GET /v1/me`
- `GET /v1/account/status`
- `GET /v1/kyc/status`

If those are still needed for the app shell after login, port or recreate them on
`particl` after the auth handshake is settled.

### Phase 6 - Wire the frontend to the backend session handshake

After the backend contract exists, the frontend still needs work to use it:

- send the real provider proof to the backend
- decide where the saved contact email belongs
- store/use the backend-issued auth state consistently
- replace the temporary guest/header identity with real session/user data
- clean up or replace stale proxy routes that still assume older endpoints

### Phase 7 - Config, docs, and end-to-end QA

- update `../backpro/.env.example` and any deployment/runtime assumptions for the
  chosen Particle contract
- update stale docs in `backpro` that still describe Openfort as the only active
  direction if `particl` becomes the resumed line of work
- do full auth QA across:
  - Particle social login
  - external wallet connect
  - disconnect/reconnect
  - backend session creation
  - refresh
  - logout
  - `/me` and status endpoints

## Files and areas to look at first when work resumes

### Frontend files

- `src/lib/particle-config.tsx`
- `src/components/header.tsx`
- `src/components/auth/login.tsx`
- `src/components/AutoWalletRegister.tsx`
- `src/app/api/auth/challenge/route.ts`
- `src/app/api/auth/register/route.ts`
- `src/app/api/login/route.ts`
- `src/app/api/register/route.ts`
- `src/utils/get-access-token.util.ts`
- `src/utils/interceptors.utils.ts`
- `src/services/api.service.ts`

### Backend files on the future `particl` branch

Start from the pre-Openfort versions of:

- `internal/interfaces/rest/router/auth.go`
- `internal/interfaces/rest/handler/auth.go`
- `internal/interfaces/rest/input/auth.go`
- `internal/application/auth/auth.go`
- `internal/application/auth/auth_helpers.go`
- `internal/domain/user/entity/user.go`
- `internal/domain/user/repository/user.go`
- `internal/infrastructure/persistence/postgres/user_repo.go`
- `internal/infrastructure/persistence/postgres/queries/user.sql`
- `internal/bootstrap/api/api.go`
- `tests/integration/auth_test.go`
- `.env.example`

Also compare later `openfort` work for generic improvements that may be worth porting.

## Handoff summary

If work resumes later, the intended starting point is:

1. In `../backpro`, create `particl` from `35b1cf3`
2. Keep `openfort` intact
3. Reconfirm the real Particle proof available from the current frontend flow
4. Design the backend auth contract to match the frontend as it exists now, not as
   the old backend expected it
5. Implement that contract on `particl`
6. Then wire the frontend to actually consume the backend session

## Open questions that must be clarified before moving on

1. What exact proof does Particle ConnectKit expose for social login that the backend
   can validate server-side?
2. What exact proof does Particle expose for external wallet connections inside the
   Particle modal, and can the backend validate it directly?
3. Should `particl` use a single exchange-style endpoint, a provider-agnostic
   exchange endpoint, or the legacy register/login contract?
4. Should the saved contact email be part of the first auth exchange, or handled by a
   separate profile-completion/update endpoint?
5. Should durable external identity on `particl` remain `particle_id`, or should the
   backend move to a provider-agnostic external identity model now?
6. Should wallet rows still be created during auth as the old Particle backend did,
   or should wallet lifecycle be treated as provider/frontend-owned?
7. Do `/v1/me`, `/v1/account/status`, and `/v1/kyc/status` need to exist on `particl`
   from the first implementation pass?
8. Which later `openfort` improvements should be cherry-picked immediately into
   `particl`, and which should stay exclusive to the Openfort line?
9. What deployment topology should `particl` optimize for first: localhost-only,
   same-site subdomains, or something else?

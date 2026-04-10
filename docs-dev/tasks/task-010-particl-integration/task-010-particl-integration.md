# Task 010 - Particl Integration

## Status

Work was implemented on the `particle` branch to make the frontend use Particle as the primary login/connect entrypoint again.

## What has already been implemented

- Replaced the legacy header wallet modal flow with a direct Particle trigger in `src/components/header.tsx`.
- Updated `src/lib/particle-config.tsx` to:
  - validate required Particle public env vars
  - keep social login enabled
  - add external EVM wallet support through `evmWalletConnectors(...)`
  - expose whether external wallet support is configured
- Reworked `src/components/AutoWalletRegister.tsx` from a debug/test screen into a user-facing onboarding panel that:
  - opens Particle manually instead of auto-opening on page load
  - shows connection state
  - distinguishes Particle social login vs external wallet connection
  - asks for contact email after connect
  - lets the user reuse the Particle login email or save another email
  - stores the chosen contact email in local storage
- Simplified `src/components/auth/login.tsx` so the login page uses the new Particle onboarding flow.
- Removed the hardcoded `.infrafund.test` cookie clearing behavior and switched to host-only cookie clearing.
- Added `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` passthrough in:
  - `deployment/Dockerfile`
  - `.github/workflows/deploy-dev.yaml`
  - `.github/workflows/deploy.yaml`
- Added `pino-pretty` to fix the WalletConnect/Particle build warning that was breaking the production build path.
- Cleaned minor lint/type issues touched during the integration work so the branch builds cleanly.

## What still needs to be implemented

- Test the full flow against real Particle dashboard credentials in dev/prod-like environments.
- Confirm that external wallets appear inside the Particle modal once WalletConnect is configured.
- Decide how the saved contact email should be sent to the backend; currently it is only stored locally in the browser.
- Verify whether the backend actually requires the `auth/challenge`, `auth/login`, and `auth/register` routes for protected app access.
- If backend authentication is required:
  - wire the frontend to the challenge/login/register flow
  - ensure the challenge is server-generated and not static
  - store and use the returned access token consistently
- Replace the temporary guest/header identity with real user/session data after login.
- Do an end-to-end manual QA pass for:
  - social login
  - external wallet connect
  - disconnect/reconnect
  - login page flow with and without `survey_data` cookie

## What must be configured for it to work

### Required runtime env vars

These public env vars must be present for Particle itself:

- `NEXT_PUBLIC_PROJECT_ID`
- `NEXT_PUBLIC_CLIENT_KEY`
- `NEXT_PUBLIC_APP_ID`

### Required for external wallets

To support MetaMask / Coinbase Wallet / WalletConnect-style wallets through Particle:

- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`

Without this value, the current implementation will still support Particle social login, but external wallets will not be available.

### GitHub Actions / deployment secrets

The deploy workflows now also expect WalletConnect secrets:

- Dev: `DEV_PARTICLE_WALLETCONNECT_PROJECT_ID`
- Prod: `PARTICLE_WALLETCONNECT_PROJECT_ID`

Existing Particle-related secrets are still required:

- Dev:
  - `DEV_PARTICLE_PROJECT_ID`
  - `DEV_PARTICLE_CLIENT_KEY`
  - `DEV_PARTICLE_APP_ID`
- Prod:
  - `PARTICLE_PROJECT_ID`
  - `PARTICLE_CLIENT_KEY`
  - `PARTICLE_APP_ID`

### Optional / backend-related

If the app must authenticate against the backend after wallet connect, this also needs to be valid:

- `NEXT_PUBLIC_API_BASE_URL`

And the backend endpoints behind these routes must work correctly:

- `auth/challenge`
- `auth/login`
- `auth/register`

## Validation completed

The branch was validated after the integration work with:

- `npm run format:lint`
- `npm run build`

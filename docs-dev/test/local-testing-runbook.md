<!-- cspell:words Openfort Reown recaptcha pgcrypto uuidv sslmode waitlists signup -->

# Local Testing Runbook

This runbook explains how to start the local test environment and manually test the migrated single Next.js app. Keep environment-variable details in `config-operation/environment-variables.md`.

## Prerequisites

1. Install dependencies:

   ```sh
   npm install
   ```

2. Populate `.env.local` from `.env.example`.
3. Confirm Docker is running.

## Start local environment

```sh
npm run dev:local
```

This command:

1. starts local Postgres from `deployment/docker-compose.local.yml` when `DATABASE_URL` is not already reachable;
2. pushes the Prisma schema;
3. seeds country reference data if the `countries` table is empty;
4. starts the Next.js dev server on `http://localhost:3000`.

Dev server output is mirrored to:

```sh
.next/dev-server.log
```

Follow logs from another terminal:

```sh
tail -f .next/dev-server.log
```

Stop local Postgres when needed:

```sh
npm run db:local:down
```

## Openfort test credentials

Openfort test account for automated testing and App Store review flows. When enabled, deterministic credentials bypass email/SMS delivery.

| Field    | Value                    |
|----------|--------------------------|
| Email    | `test-96cb@openfort.xyz` |
| Phone    | `+15555557383`           |
| OTP code | `371941`                 |

## Manual smoke-test flow

### 1. Landing page

1. Open `http://localhost:3000`.
2. Confirm the page renders without console errors.
3. Confirm `.next/dev-server.log` does not show server errors.

### 2. Openfort login

1. Click the Openfort login entry point.
2. Choose email OTP or phone OTP.
3. Use the deterministic test credentials above.
4. Confirm the app reaches the InfraFund onboarding/qualification flow.

### 3. Qualified onboarding

1. Complete onboarding as an individual.
2. Confirm `/api/v1/auth/openfort/check` and `/api/v1/auth/openfort/exchange` succeed.
3. Confirm wallet creation/recovery runs after qualification, not before it.
4. Confirm the account page loads protected profile data.

### 4. Organization onboarding

1. Repeat login with a fresh or reset Openfort user if needed.
2. Select organization/company flow.
3. Confirm organization name is required.
4. Confirm app session creation succeeds after valid fields are submitted.

### 5. Session lifecycle

1. Refresh the browser.
2. Confirm the app restores the session via `/api/v1/auth/refresh`.
3. Sign out.
4. Confirm protected account data is inaccessible after logout.

### 6. Public forms

1. Test waitlist signup.
2. Test contact form submission.
3. Test non-resident individual/company flows.
4. If reCAPTCHA keys are not configured, expect captcha-protected flows to fail or require configuring `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` and `RECAPTCHA_SECRET_KEY`.

### 7. Cleanup route

With `CRON_SECRET` set, test the cleanup route locally:

```sh
curl -i -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/cleanup
```

## Useful validation commands

```sh
npm run format:prettier
npm run format:lint
npm run format:cspell -- --no-progress
npm run format:knip
npx tsc --noEmit
npm run build
```

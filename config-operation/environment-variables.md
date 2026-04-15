# Environment Variables — Operational Reference

**Last updated:** 2026-04-15
**Branch:** `openfort`

This document is the single source of truth for all environment variables required to build, deploy, and operate the front-pro dashboard.

---

## Section 1: Frontend Build-Time Variables

Baked into the JS bundle via the `NEXT_PUBLIC_` prefix. Passed as Dockerfile `ARG`s in `deployment/Dockerfile`.

| Variable | Required | Source | Description |
|---|---|---|---|
| `NEXT_PUBLIC_OPENFORT_PUBLIC_KEY` | Yes | Openfort Dashboard | Must match `INFRA_AUTH_OPENFORT_PUBLISHABLE_KEY` in backpro |
| `NEXT_PUBLIC_SHIELD_API_KEY` | Yes | `openfort embedded-wallet setup` | Shield publishable key for embedded wallet config |
| `NEXT_PUBLIC_API_BASE_URL` | Yes | Deployment config | Backend API base URL (e.g. `http://localhost:8080/v1` for local) |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | Yes (for non-resident flow) | Google reCAPTCHA admin console | reCAPTCHA v3 site key |
| `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` | No | WalletConnect Cloud | Optional — enables external wallet support |
| `NEXT_PUBLIC_POLICY_ID` | No | Openfort Dashboard > Policies | Optional — gas sponsorship policy ID |

---

## Section 2: Frontend Runtime Variables (server-side only)

Required by the Next.js API route at `src/app/api/auth/encryption-session/route.ts`. Must be injected at **runtime** via Docker Compose environment section — NOT as Dockerfile build args.

| Variable | Required | Source | Description |
|---|---|---|---|
| `SHIELD_SECRET_KEY` | Yes | `openfort embedded-wallet setup` | Shield secret key for encryption sessions |
| `SHIELD_ENCRYPTION_SHARE` | Yes | `openfort embedded-wallet setup` | Server-side encryption share for automatic wallet recovery |
| `SHIELD_URL` | No | Defaults to `https://shield.openfort.io` | Shield API endpoint override |

**How to get Shield credentials:**

```bash
openfort login
openfort embedded-wallet setup
```

Copy from the setup output or `~/.config/openfort/credentials`. Alternatively, use the Openfort Dashboard > Embedded Wallet > Shield configuration.

---

## Section 3: Backend Variables (backpro)

Key auth-related variables from `backpro/.env.example`:

| Variable | Required | Notes |
|---|---|---|
| `INFRA_AUTH_OPENFORT_PUBLISHABLE_KEY` | Yes | **Must match** frontend `NEXT_PUBLIC_OPENFORT_PUBLIC_KEY` |
| `INFRA_AUTH_JWT_SIGNING_KEY` | Yes | Secret key for JWT signing |
| `INFRA_AUTH_JWT_ISSUER` | Yes | JWT issuer string |
| `INFRA_REST_COOKIE_ENCRYPTION_SECRET_KEY` | Yes | Cookie encryption key |
| `INFRA_REST_CORS_ALLOW_ORIGINS` | Yes | Must include the frontend origin (e.g. `http://localhost:3000`) |
| `INFRA_REST_COOKIE_SAME_SITE` | Yes | `lax` for same-domain, `none` for cross-origin |
| `INFRA_REST_RECAPTCHA_GOOGLE_SECRET` | Yes (for non-resident flow) | Server-side reCAPTCHA secret key |
| `INFRA_POSTGRES_HOST` | Yes | Database host |
| `INFRA_POSTGRES_PORT` | Yes | Database port |
| `INFRA_POSTGRES_USERNAME` | Yes | Database user |
| `INFRA_POSTGRES_PASSWORD` | Yes | Database password |
| `INFRA_POSTGRES_DATABASE` | Yes | Database name |

**Note:** The backend bypasses captcha validation when `INFRA_REST_RECAPTCHA_GOOGLE_SECRET` is empty. This is safe for local development but the key must be set for deployed environments.

---

## Section 4: GitHub Secrets per Environment

**Dev environment** (workflow: `.github/workflows/deploy-dev.yaml`, runner: `develop-runner`):

| Secret | Maps to Dockerfile ARG |
|---|---|
| `DEV_API_BASE_URL` | `NEXT_PUBLIC_API_BASE_URL` |
| `DEV_AUTH_OPENFORT_PUBLISHABLE_KEY` | `NEXT_PUBLIC_OPENFORT_PUBLIC_KEY` |
| `DEV_SHIELD_API_KEY` | `NEXT_PUBLIC_SHIELD_API_KEY` |
| `GOOGLE_RECAPTCHA_SITE_KEY` | `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` |

**Production environment** (workflow: `.github/workflows/deploy.yaml`, runner: `prod-runner`):

| Secret | Maps to Dockerfile ARG |
|---|---|
| `PROD_API_BASE_URL` | `NEXT_PUBLIC_API_BASE_URL` |
| `AUTH_OPENFORT_PUBLISHABLE_KEY` | `NEXT_PUBLIC_OPENFORT_PUBLIC_KEY` |
| `SHIELD_API_KEY` | `NEXT_PUBLIC_SHIELD_API_KEY` |
| `GOOGLE_RECAPTCHA_SITE_KEY` | `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` |

---

## Section 5: Docker Compose Runtime Variables

The Docker Compose files referenced by the workflows (`${{ vars.DOCKER_COMPOSE_PATH_DEVELOP }}` and `${{ vars.DOCKER_COMPOSE_PATH_PRODUCTION }}`) must inject these as environment variables to the dashboard container:

| Variable | Required | Purpose |
|---|---|---|
| `SHIELD_SECRET_KEY` | Yes | Used by `src/app/api/auth/encryption-session/route.ts` |
| `SHIELD_ENCRYPTION_SHARE` | Yes | Used by `src/app/api/auth/encryption-session/route.ts` |

Without these, wallet creation will fail in deployed environments with "Shield credentials not configured on server".

---

## Section 6: Google OAuth Setup for Openfort

The frontend already has `AuthProvider.GOOGLE` configured at `src/lib/openfort-config.tsx:65`.

Setup steps:

1. Go to Google Cloud Console > APIs & Services > Credentials
2. Create an OAuth 2.0 Client ID (Web application type)
3. Add authorized redirect URIs — get the exact callback URL from the Openfort Dashboard > Auth Providers > Google
4. Copy the Client ID and Client Secret
5. In the Openfort Dashboard, go to **Authentication > Providers**
6. Enable **Google** and paste the Client ID and Client Secret
7. No frontend code changes needed — `AuthProvider.GOOGLE` is already in the config

---

## Section 7: Apple iOS Login Setup for Openfort

Apple Sign-In is not yet configured. When ready, it requires both dashboard setup and a one-line frontend change.

Setup steps:

1. Apple Developer account > Certificates, Identifiers & Profiles
2. Create an App ID with "Sign In with Apple" capability enabled
3. Create a Services ID (this becomes the OAuth client ID for web)
4. Configure the Services ID: add the return URL from the Openfort Dashboard > Auth Providers > Apple
5. Generate a private key for Sign In with Apple (Keys section)
6. In the Openfort Dashboard, go to **Authentication > Providers**
7. Enable **Apple** and configure with: Services ID, Team ID, Key ID, and the private key (.p8 file)

Frontend change when ready — in `src/lib/openfort-config.tsx`:

```ts
// BEFORE:
authProviders: [AuthProvider.GOOGLE, AuthProvider.EMAIL_OTP],

// AFTER:
authProviders: [AuthProvider.GOOGLE, AuthProvider.EMAIL_OTP, AuthProvider.APPLE],
```

---

## Section 8: reCAPTCHA v3 Setup

The reCAPTCHA code implementation is **already complete**:
- `src/app/layout.tsx` — conditionally loads the reCAPTCHA v3 script when site key is set
- `src/utils/recaptcha.ts` — `getRecaptchaToken(action)` utility
- `src/components/auth/non-resident-form.tsx` — calls it with action `'non_resident_waitlist'`
- `deployment/Dockerfile` — build arg and env for the site key
- Both deploy workflows pass `secrets.GOOGLE_RECAPTCHA_SITE_KEY`

What's needed is purely configuration:

**Option A — Reuse existing keys from landing-pro:**

1. Copy the reCAPTCHA site key from `landing-pro`'s env configuration
2. Copy the reCAPTCHA secret key from `landing-pro`'s backend env
3. Set `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` in `.env.local` (frontend)
4. Set `INFRA_REST_RECAPTCHA_GOOGLE_SECRET` in `.env` (backend)
5. Ensure the reCAPTCHA admin console includes `localhost` in allowed domains

**Option B — Create new reCAPTCHA credentials:**

1. Go to https://www.google.com/recaptcha/admin
2. Register a new site with **reCAPTCHA v3**
3. Add all domains: `localhost` for dev, production domain(s)
4. Copy the **Site Key** (public) → `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`
5. Copy the **Secret Key** (server-side) → `INFRA_REST_RECAPTCHA_GOOGLE_SECRET`

**For deployed environments:**

6. Set `GOOGLE_RECAPTCHA_SITE_KEY` GitHub secret (used by both deploy workflows)
7. Set `GOOGLE_RECAPTCHA_SECRET` GitHub secret (used by backpro deploy workflows at `backpro/.github/workflows/deployer-dev.yml` and `deployer-prod.yml`)

**Local testing note:** The backend bypasses captcha when `INFRA_REST_RECAPTCHA_GOOGLE_SECRET` is empty. So local testing of the non-resident flow works without the key — the form submits, just without captcha protection. Set the key to test the full captcha flow.

---

## Section 9: Version Bump Note

Once all N1–N7 items from `docs-dev/tasks/v0.2.5-openfort-frontend-implementation-review-fix.md` are resolved and verified, the `package.json` version is bumped from `0.1.0` to `0.2.6`.

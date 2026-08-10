<!-- cspell:words Openfort Reown Supabase recaptcha pgcrypto uuidv sslmode waitlists nodemailer -->

# Environment Variables — Operational Reference

**Last updated:** 2026-04-29
**Branch:** `openfort`

This is the canonical environment reference for the single Next.js `front-pro` app. The Go backend has been retired; do not configure `NEXT_PUBLIC_API_BASE_URL`, `API_URL`, `INFRA_AUTH_*`, or other `backpro`-only variables for this app.

Use `.env.local` for local secrets and `.env.example` as the sanitized template. Regenerate the template from a working local env with:

```sh
npm run env:example
```

## Local baseline

| Variable                  | Required | Local/default value                                                       | Source                                                             | Purpose                                                       |
|---------------------------|----------|---------------------------------------------------------------------------|--------------------------------------------------------------------|---------------------------------------------------------------|
| `NEXT_PUBLIC_ENVIRONMENT` | Yes      | `development`                                                             | Local/deployment config                                            | Selects app environment and Base/Base Sepolia chain behavior. |
| `DATABASE_URL`            | Yes      | `postgresql://postgres:postgres@localhost:5432/infra_dev?sslmode=disable` | `deployment/docker-compose.local.yml` or managed Postgres/Supabase | Prisma database connection for all Next.js API routes.        |

Local database and dev server setup is documented in `docs-dev/test/local-testing-runbook.md`.

## Openfort and Shield

| Variable                                | Required | Local/test shape                          | Source                           | Purpose                                                                                          |
|-----------------------------------------|----------|-------------------------------------------|----------------------------------|--------------------------------------------------------------------------------------------------|
| `NEXT_PUBLIC_OPENFORT_PUBLIC_KEY`       | Yes      | `pk_test_...`                             | Openfort Dashboard > API Keys    | Browser-side Openfort publishable key.                                                           |
| `OPENFORT_PUBLISHABLE_KEY`              | Yes      | Same as `NEXT_PUBLIC_OPENFORT_PUBLIC_KEY` | Openfort Dashboard > API Keys    | Server-side Openfort publishable key for the Node SDK.                                           |
| `OPENFORT_SECRET_KEY`                   | Yes      | `sk_test_...`                             | Openfort Dashboard > API Keys    | Server-side Openfort API key for token verification, user deletion, and Shield session creation. |
| `OPENFORT_BASE_URL`                     | No       | `https://api.openfort.io`                 | Openfort docs                    | Optional Openfort API override.                                                                  |
| `NEXT_PUBLIC_SHIELD_API_KEY`            | Yes      | Shield publishable key                    | `openfort embedded-wallet setup` | Browser-side Shield publishable key for embedded wallet recovery.                                |
| `SHIELD_URL`                            | No       | `https://shield.openfort.io`              | Openfort docs                    | Optional Shield API override.                                                                    |
| `SHIELD_SECRET_KEY`                     | Yes      | Shield secret key                         | `openfort embedded-wallet setup` | Server-side Shield secret for encryption sessions.                                               |
| `SHIELD_ENCRYPTION_SHARE`               | Yes      | Shield encryption share                   | `openfort embedded-wallet setup` | Server-side encryption share for automatic wallet recovery.                                      |
| `NEXT_PUBLIC_POLICY_ID`                 | No       | Empty unless testing sponsorship          | Openfort Dashboard > Policies    | Optional fee sponsorship policy ID.                                                              |
| `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` | No       | Reown project ID                          | Reown Cloud                      | Optional external-wallet support.                                                                |

Get Shield values with:

```sh
openfort login
openfort embedded-wallet setup
```

Openfort Dashboard security must allow `http://localhost:3000` for local testing and the deployed origins for dev/prod.

## App session auth

| Variable                            | Required | Local/default value                     | Source                          | Purpose                                           |
|-------------------------------------|----------|-----------------------------------------|---------------------------------|---------------------------------------------------|
| `APP_JWT_SECRET`                    | Yes      | Generate with `openssl rand -base64 32` | Local/deployment secret manager | Signs InfraFund app access tokens.                |
| `APP_JWT_ISSUER`                    | No       | Empty locally                           | Deployment config               | Optional JWT issuer claim.                        |
| `APP_JWT_AUDIENCE`                  | Yes      | `infrafund`                             | App convention                  | JWT audience claim.                               |
| `APP_JWT_ACCESS_TOKEN_TTL`          | Yes      | `15m`                                   | App convention                  | Access-token lifetime.                            |
| `APP_AUTH_SESSION_ACTIVITY_TIMEOUT` | Yes      | `15m`                                   | App convention                  | Refresh-session idle timeout.                     |
| `APP_AUTH_SESSION_ABSOLUTE_TTL`     | Yes      | `7d`                                    | App convention                  | Refresh-session absolute lifetime.                |
| `APP_REFRESH_COOKIE_DOMAIN`         | No       | Empty locally                           | Deployment config               | Optional cookie domain for deployed environments. |
| `APP_REFRESH_COOKIE_SAME_SITE`      | Yes      | `lax`                                   | App convention                  | Refresh-cookie SameSite policy.                   |

Refresh tokens are stored only as an `httpOnly` cookie plus a hashed database value.

## Captcha for public forms

| Variable                         | Required                                    | Local/default value    | Source                 | Purpose                                      |
|----------------------------------|---------------------------------------------|------------------------|------------------------|----------------------------------------------|
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | Required for captcha-protected public forms | Empty until configured | Google reCAPTCHA Admin | Browser site key for waitlist/contact flows. |
| `RECAPTCHA_SECRET_KEY`           | Required for captcha-protected public forms | Empty until configured | Google reCAPTCHA Admin | Server-side token verification key.          |

Create or reuse reCAPTCHA v3 keys at <https://www.google.com/recaptcha/admin> and add `localhost` plus deployed domains.

## Cleanup cron

| Variable      | Required              | Local/default value                     | Source                          | Purpose                                   |
|---------------|-----------------------|-----------------------------------------|---------------------------------|-------------------------------------------|
| `CRON_SECRET` | Yes for cleanup route | Generate with `openssl rand -base64 32` | Local/deployment secret manager | Bearer token for `GET /api/cron/cleanup`. |

## Contact form email

| Variable                     | Required              | Local/default value | Source                  | Purpose                                                  |
|------------------------------|-----------------------|---------------------|-------------------------|----------------------------------------------------------|
| `CONTACT_FORM_EMAIL_ENABLED` | No                    | `false`             | Local/deployment config | Enables SMTP notification after contact form submission. |
| `SMTP_HOST`                  | Only if email enabled | Empty               | Email provider          | SMTP host.                                               |
| `SMTP_PORT`                  | Only if email enabled | Empty               | Email provider          | SMTP port.                                               |
| `SMTP_USER`                  | Only if email enabled | Empty               | Email provider          | SMTP username.                                           |
| `SMTP_PASSWORD`              | Only if email enabled | Empty               | Email provider          | SMTP password/app password.                              |
| `SMTP_SENDER`                | Only if email enabled | Empty               | Email provider          | From address.                                            |
| `CONTACT_FORM_RECEIVER`      | Only if email enabled | Empty               | Team inbox              | Contact-form destination inbox.                          |

## Deployment mapping

Build-time variables with the `NEXT_PUBLIC_` prefix must be available when building the Next.js bundle. Server-only variables must be injected at runtime by the hosting platform or container environment.

Current deploy workflows pass:

| Workflow secret                                                       | Runtime/build variable            |
|-----------------------------------------------------------------------|-----------------------------------|
| `DEV_AUTH_OPENFORT_PUBLISHABLE_KEY` / `AUTH_OPENFORT_PUBLISHABLE_KEY` | `NEXT_PUBLIC_OPENFORT_PUBLIC_KEY` |
| `DEV_SHIELD_API_KEY` / `SHIELD_API_KEY`                               | `NEXT_PUBLIC_SHIELD_API_KEY`      |
| `GOOGLE_RECAPTCHA_SITE_KEY`                                           | `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`  |

The deployment environment also needs server-only values such as `DATABASE_URL`, `APP_JWT_SECRET`, `OPENFORT_SECRET_KEY`, `OPENFORT_PUBLISHABLE_KEY`, `SHIELD_SECRET_KEY`, `SHIELD_ENCRYPTION_SHARE`, `CRON_SECRET`, and optional SMTP variables.

## Local testing reference

See `docs-dev/test/local-testing-runbook.md` for local startup, log monitoring, deterministic Openfort test credentials, and manual smoke-test steps.

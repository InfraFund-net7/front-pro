<!-- cspell:words neondb Neon uuidv7 uuidv pooler sslmode prebuild UNPOOLED -->

# Deploying InfraFund to Vercel with Neon Postgres

Step-by-step guide to deploy this project on a new Vercel account with a custom
domain. The database schema and seed data are applied **automatically on every build**
via the `prebuild` script — no manual DB setup required.

## Prerequisites

- A Vercel account with access to add a project
- The GitHub repo connected (or ready to connect) to Vercel
- A domain you control (for DNS configuration)
- Credentials for all third-party services (Openfort, reCAPTCHA, Sentry, etc.)
  See `config-operation/environment-variables.md` for the full list.

---

## Step 1 — Create the Vercel project

1. In the Vercel dashboard, click **Add New → Project**
2. Import the `front-pro` GitHub repository
3. Set **Root Directory** to `/` (default)
4. Set **Framework Preset** to `Next.js` (auto-detected)
5. Do **not** click Deploy yet — set env vars first

---

## Step 2 — Add the Neon Postgres integration

1. In your Vercel project, go to **Storage → Connect Store**
2. Select **Neon** and follow the OAuth flow
3. Create a new Neon project (or connect an existing one)
4. Vercel automatically injects `DATABASE_URL` and `DATABASE_URL_UNPOOLED`

If you prefer to provision Neon manually, create a project at
[console.neon.tech](https://console.neon.tech), copy the connection string, and add
`DATABASE_URL` as an environment variable manually.

---

## Step 3 — Set environment variables

In **Vercel → Project Settings → Environment Variables**, add all variables listed in
`config-operation/environment-variables.md`.

Key variables:

| Variable                               | Where to get it                                     |
|----------------------------------------|-----------------------------------------------------|
| `DATABASE_URL`                         | Injected by Neon integration (or from Neon console) |
| `APP_JWT_SECRET`                       | Generate: `openssl rand -hex 32`                    |
| `APP_REFRESH_TOKEN_SECRET`             | Generate: `openssl rand -hex 32`                    |
| `OPENFORT_SECRET_KEY`                  | Openfort dashboard → API Keys                       |
| `OPENFORT_PUBLISHABLE_KEY`             | Openfort dashboard → API Keys                       |
| `NEXT_PUBLIC_OPENFORT_PUBLISHABLE_KEY` | Same as above                                       |
| `RECAPTCHA_SECRET_KEY`                 | Google reCAPTCHA admin console                      |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`       | Google reCAPTCHA admin console                      |
| `SENTRY_DSN`                           | Sentry project settings                             |
| `NEXT_PUBLIC_SENTRY_DSN`               | Same as above                                       |
| `CRON_SECRET`                          | Generate: `openssl rand -hex 32`                    |

Set variables for all relevant environments (Preview and/or Production).

---

## Step 4 — Configure the custom domain

1. In **Vercel → Project Settings → Domains**, add your domain (e.g. `infrafund.dev`)
2. Vercel shows the DNS records to add (usually an A record or CNAME)
3. In your DNS provider, add those records
4. Wait for DNS propagation (usually under 5 minutes on Cloudflare)

---

## Step 5 — Deploy

Trigger a deployment by pushing to the branch connected to your environment, or click
**Redeploy** in the Vercel dashboard.

During the build, `prebuild` runs automatically:

```
prisma generate && node scripts/setup-neon-db.mjs
```

This script:

1. Installs the `pg_uuidv7` extension (Neon runs Postgres 17; `uuidv7()` is not
   built-in until Postgres 18)
2. Creates a `uuidv7()` alias pointing to `uuid_generate_v7()`
3. Runs `prisma db push --accept-data-loss` to create all tables
4. Seeds 251 ISO countries (skips automatically if already seeded)

Build time is approximately 60–90 seconds.

---

## Step 6 — Verify

Once the deployment is green, open the site and click **Login / Register**. The
progress modal should complete all five steps:

1. Authenticating with Openfort ✓
2. Checking your account ✓
3. Restoring your session ✓
4. Loading your profile ✓
5. Connecting your wallet ✓

---

## Postgres version note

| Environment                        | Postgres | `uuidv7()` source             |
|------------------------------------|----------|-------------------------------|
| Local Docker (`npm run dev:local`) | 18.x     | Built-in `pg_catalog`         |
| Neon (Vercel)                      | 17.x     | `pg_uuidv7` extension + alias |

The `setup-neon-db.mjs` script detects the Postgres version automatically and skips
the extension step on Postgres 18+.

---

## Adding Prisma migrations later

This project currently uses `prisma db push` (schema-first, no migration files). If
formal migrations are added, update the `run` call in `scripts/setup-neon-db.mjs` to:

```js
run('npx', ['prisma', 'migrate', 'deploy']);
```

`prisma migrate deploy` applies pending migrations in order and is safe to run on
every build (skips already-applied migrations).

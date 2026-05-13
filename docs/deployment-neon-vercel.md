<!-- cspell:words neondb Neon uuidv7 uuidv pooler sslmode prebuild UNPOOLED replayable -->

# Deploying InfraFund to Vercel with Neon Postgres

Step-by-step guide to deploy this project on a new Vercel account with a custom
 domain. The application build, database bootstrap, Prisma migrations, and seed
 data are applied automatically when Vercel runs the configured build command.

## Current repo state

This repository already contains the Vercel/Neon schema-sync pieces:

- `prisma/schema.prisma` — source-of-truth Prisma data model
- `prisma/migrations/` — committed Prisma migrations that Vercel replays
- `scripts/bootstrap-neon-db.mjs` — ensures `uuidv7()` works on Neon/Postgres 17
- `scripts/vercel-build.mjs` — the Vercel build entrypoint for schema sync
- `scripts/seed-countries.mjs` — idempotent country seed
- `scripts/check-prisma-migration-sync.mjs` — CI guard for schema-without-migration drift
- `.github/workflows/prisma-migration-guard.yaml` — enforces committed migrations on PRs and pushes to `develop` and `main`

The intended deployment behavior is:

- push to `develop` → Vercel Preview deploy
- push to `main` → Vercel Production deploy
- each deploy runs the schema-sync pipeline before `next build`

## Build pipeline used by Vercel

Vercel must use this build command:

```sh
npm run vercel-build
```

That command executes `scripts/vercel-build.mjs`, which runs:

```sh
npx prisma generate
node scripts/bootstrap-neon-db.mjs
npx prisma migrate deploy
node scripts/seed-countries.mjs
next build
```

What each step does:

1. `prisma generate` refreshes the Prisma client
2. `bootstrap-neon-db.mjs` installs `pg_uuidv7` if needed and creates the `uuidv7()` alias
3. `prisma migrate deploy` replays any unapplied committed migrations against the target database
4. `seed-countries.mjs` seeds countries only if missing
5. `next build` builds the app only after the DB is ready

---

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
4. Use the detected project settings
5. Do **not** click Deploy yet — set env vars first

---

## Step 2 — Add the Neon Postgres integration

1. In your Vercel project, go to **Storage → Connect Store**
2. Select **Neon** and follow the OAuth flow
3. Create a new Neon project (or connect an existing one)
4. Vercel automatically injects `DATABASE_URL` and related Postgres variables

If you prefer to provision Neon manually, create a project at
[console.neon.tech](https://console.neon.tech), copy the connection string, and add
`DATABASE_URL` manually in Vercel.

Important:

- Preview and Production can point to different databases if required
- `prisma migrate deploy` will run against whichever `DATABASE_URL` is present for that environment

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

Set variables for all relevant environments, especially:

- **Preview** for the `develop` branch deployment path
- **Production** for the `main` branch deployment path

---

## Step 4 — Configure Vercel build settings

In **Vercel → Project Settings → Build & Development Settings**:

- confirm **Build Command** is set to `npm run vercel-build`
- leave the output directory blank unless your Vercel setup explicitly requires otherwise

CLI verification:

```sh
npx vercel project inspect front-pro
```

Expected output should show:

```text
Build Command    npm run vercel-build
```

If needed, set it with the Vercel API/CLI or in the dashboard before the first deployment.

---

## Step 5 — Configure branch-to-environment behavior

Recommended convention in this repo:

- `develop` → Preview deployment
- `main` → Production deployment

Vercel will create a new deployment when you push to the connected repo/branch.
Because the build command runs `prisma migrate deploy`, each deployment automatically
applies pending migrations for that environment before the app build completes.

This means:

- a direct push to `develop` triggers Preview schema sync
- a direct push to `main` triggers Production schema sync
- a Vercel redeploy also re-runs the migration step

---

## Step 6 — Configure the custom domain

1. In **Vercel → Project Settings → Domains**, add your domain (e.g. `infrafund.dev`)
2. Vercel shows the DNS records to add (usually an A record or CNAME)
3. In your DNS provider, add those records
4. Wait for DNS propagation (usually under 5 minutes on Cloudflare)

---

## Step 7 — Deploy

Trigger a deployment by pushing to the branch connected to your environment, or click
**Redeploy** in the Vercel dashboard.

On each deploy, Vercel will run:

```sh
npm run vercel-build
```

This gives automatic schema sync for Neon because `prisma migrate deploy` is part of the build pipeline.

Build time is approximately 60–90 seconds depending on cache state.

---

## Step 8 — Verify the app

Once the deployment is green, open the site and click **Login / Register**. The
progress modal should complete all five steps:

1. Authenticating with Openfort ✓
2. Checking your account ✓
3. Restoring your session ✓
4. Loading your profile ✓
5. Connecting your wallet ✓

---

## Schema sync workflow for developers

### Local development database

Local development typically uses:

```sh
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/infra_dev?sslmode=disable
```

That local DB is separate from the Vercel Preview/Production Neon databases.

### When changing the schema

Whenever `prisma/schema.prisma` changes:

1. generate a migration locally
2. commit both the schema change and the migration files
3. push to the target branch
4. let Vercel replay the migrations with `prisma migrate deploy`

Typical command:

```sh
npx prisma migrate dev --name <change-name>
```

Commit all of:

- `prisma/schema.prisma`
- the new folder under `prisma/migrations/`
- any generated code changes that belong with the migration

### What not to do

Do not rely on editing `prisma/schema.prisma` alone and pushing it.
If no migration file is committed, `prisma migrate deploy` has nothing to apply.

---

## Guardrails already present in the repo

This repo includes a migration guard script and workflow:

- command: `npm run check:prisma-migrations`
- script: `scripts/check-prisma-migration-sync.mjs`
- workflow: `.github/workflows/prisma-migration-guard.yaml`

The workflow runs on:

- pull requests to `develop` and `main`
- direct pushes to `develop` and `main`

The guard fails if:

- `prisma/schema.prisma` changed
- but no file under `prisma/migrations/` was committed

This helps ensure Vercel deployments always have replayable migrations available.

---

## How to force schema sync without a new code change

If the schema migrations are already committed and you just want Vercel to replay them again for an environment:

- use **Redeploy** in the Vercel dashboard, or
- run a Vercel redeploy from the CLI

Example:

```sh
npx vercel redeploy <deployment-id> --target preview
```

That will re-run `npm run vercel-build`, including:

- Neon bootstrap
- `prisma migrate deploy`
- country seed
- app build

---

## How to reason about schema sync status

The safest mental model is:

- local schema authority = `prisma/schema.prisma` + committed `prisma/migrations/`
- deployed schema authority = whatever `prisma migrate deploy` successfully applied in that Vercel environment

If a Vercel deployment succeeds while connected to the intended Neon database, that is a strong signal the committed migrations were applied successfully.

For stricter verification on a future account:

- inspect Vercel build logs for the migration step
- confirm the deployment used the intended `DATABASE_URL`
- optionally run `npx prisma migrate status` against the actual environment database connection string

---

## Postgres version note

| Environment                        | Postgres | `uuidv7()` source             |
|------------------------------------|----------|-------------------------------|
| Local Docker (`npm run dev:local`) | 18.x     | Built-in `pg_catalog`         |
| Neon (Vercel)                      | 17.x     | `pg_uuidv7` extension + alias |

The Neon bootstrap script detects whether `uuidv7()` already exists and only installs the extension/alias when needed.

---

## Quick checklist for setting up another Vercel account later

- connect the repo
- connect or create the Neon database
- add all required environment variables
- set **Build Command** to `npm run vercel-build`
- verify the target branch/environment mapping
- deploy once
- inspect build logs to confirm bootstrap + migrations ran
- verify the app loads and auth flow works

If all of the above are done, the new Vercel account will use the same automatic Neon schema-sync process as this one.

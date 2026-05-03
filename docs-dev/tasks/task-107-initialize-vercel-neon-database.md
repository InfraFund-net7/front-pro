<!-- cspell:words neondb Neon uuidv7 uuidv dbgenerated prebuild -->

# Task 107: Initialize Vercel / Neon database for preview deployment

**Status:** Done
**Target repo:** `front-pro`
**Depends on:** task-103 through task-106 (openfort login UX baseline)

## Issue

After deploying the `openfort` branch to Vercel (`openfort.infrafund.dev`), login
failed at step 2 "Checking your account" with "Something went wrong. Please try again."

Root cause: the Neon database was empty — no tables existed. The `prebuild` script
only ran `prisma generate`, which generates the client but does not apply the schema.

Additionally, Neon runs Postgres 17 while local Docker uses Postgres 18. The Prisma
schema uses `@default(dbgenerated("uuidv7()"))` for primary keys. On Postgres 17,
`uuidv7()` is not a built-in — it requires the `pg_uuidv7` extension plus a wrapper
alias, since `pg_uuidv7` v1.6 ships `uuid_generate_v7()`, not `uuidv7()`.

## Fix

Two changes:

**`package.json`** — `prebuild` now runs the full DB setup before `next build`:

```json
"prebuild": "prisma generate && node scripts/setup-neon-db.mjs"
```

**`scripts/setup-neon-db.mjs`** (already existed, updated to add `--accept-data-loss`):

On every Vercel build this script:
1. Detects whether `uuidv7()` is a `pg_catalog` built-in (Postgres 18+)
2. If not, installs `pg_uuidv7` and creates a `uuidv7()` alias
3. Runs `prisma db push --accept-data-loss`
4. Seeds 251 ISO countries (skips if already seeded)

Vercel's build environment has direct TCP access to Neon, so the script runs cleanly
without any manual steps.

**`vercel.json`** — added `ignoreCommand` to prevent `entire/checkpoints/v1`
(a log-only branch pushed by the `entire` CLI) from triggering spurious deployments.

## Result

Login flow fully working on `openfort.infrafund.dev`. All five progress steps pass:
Authenticating with Openfort → Checking your account → Restoring your session →
Loading your profile → Connecting your wallet.

No manual database setup is required for future deployments. See
`docs/deployment-neon-vercel.md` for the full deployment guide.

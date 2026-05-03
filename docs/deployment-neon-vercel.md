<!-- cspell:words neondb Neon uuidv7 uuidv pooler UNPOOLED sslmode libpq pacman ETIMEDOUT dbgenerated waitlists -->

# Deploying to Vercel with Neon Postgres

This guide covers one-time database initialization for a new Vercel deployment
(preview, production, or any branch that gets its own Neon database).

## When you need this

- First deployment of a new branch to Vercel
- The Vercel project was linked to a new Neon database
- The error "Something went wrong" appears at step 2 "Checking your account"
  and the Neon database is empty (no tables)

## Prerequisites

- Vercel CLI: `npm i -g vercel` (or `npx vercel`)
- `psql` CLI available locally (`sudo pacman -S postgresql` / `brew install libpq`)
- Access to the Vercel project (run `vercel link` if not already linked)

## Quick Summary

```
vercel env pull .env.neon --environment preview                                            
DATABASE_URL="$(grep '^DATABASE_URL_UNPOOLED=' .env.neon | cut -d= -f2- | tr -d '"')" npm run db:neon:setup                                                                              
rm .env.neon  
```

## Step 1 — Pull the Neon DATABASE_URL from Vercel

```bash
vercel env pull .env.neon --environment preview
# or --environment production for prod

grep DATABASE_URL .env.neon
# → DATABASE_URL="postgresql://neondb_owner:...@ep-xxx-pooler.eu-west-2.aws.neon.tech/neondb?..."
```

The pulled file contains both pooled (`-pooler.` hostname) and non-pooled URLs.
Use the **non-pooled** `DATABASE_URL_UNPOOLED` for schema setup (Prisma requires a
direct connection for `db push`).

```bash
grep DATABASE_URL_UNPOOLED .env.neon
# → DATABASE_URL_UNPOOLED="postgresql://neondb_owner:...@ep-xxx.eu-west-2.aws.neon.tech/neondb?sslmode=require"
```

## Step 2 — Run the Neon setup script

```bash
DATABASE_URL="$(grep '^DATABASE_URL_UNPOOLED=' .env.neon | cut -d= -f2- | tr -d '"')" \
  npm run db:neon:setup
```

This script (`scripts/setup-neon-db.mjs`) does:

1. Connects to the database and checks whether `uuidv7()` is a built-in
   (`pg_catalog`, present in Postgres 18+).
2. If not (Neon runs Postgres 17), installs the `pg_uuidv7` extension and creates
   a `uuidv7()` alias pointing to `uuid_generate_v7()` — which is what `pg_uuidv7`
   v1.6 provides.
3. Runs `prisma db push` to create all tables.
4. Runs `scripts/seed-countries.mjs` to insert the 251 ISO countries.

### If the Node.js `pg` client times out (ETIMEDOUT on port 5432)

This can happen on some networks where the Node.js TCP stack behaves differently from
`psql` (libpq). Run the three steps manually instead:

```bash
NEON_URL="postgresql://neondb_owner:...@ep-xxx.eu-west-2.aws.neon.tech/neondb?sslmode=require"

# 1. Install extension and create uuidv7() alias
psql "$NEON_URL" <<'SQL'
CREATE EXTENSION IF NOT EXISTS pg_uuidv7;
CREATE OR REPLACE FUNCTION uuidv7() RETURNS uuid
  LANGUAGE SQL AS $$ SELECT uuid_generate_v7() $$;
SQL

# 2. Apply Prisma schema
DATABASE_URL="$NEON_URL" npx prisma db push

# 3. Seed countries
psql "$NEON_URL" -f prisma/seed/countries.sql
```

## Step 3 — Verify

```bash
psql "$NEON_URL" -c "\dt"
# → 10 tables: account_lockouts, contact_forms, countries, lockout_audit_logs,
#              non_resident_waitlists, sessions, user_organizations, users,
#              waitlist, wallets

psql "$NEON_URL" -c "SELECT COUNT(*) FROM countries;"
# → 251
```

## Step 4 — Clean up

Delete the pulled env file — it contains secrets.

```bash
rm .env.neon
```

## Step 5 — Redeploy on Vercel (if needed)

If environment variables were added or changed after the last deployment:

```bash
vercel redeploy --target preview
# or visit Vercel dashboard → Deployments → Redeploy
```

## Postgres version compatibility note

| Environment | Postgres | `uuidv7()` source |
|---|---|---|
| Local Docker (`npm run dev:local`) | 18.x | Built-in `pg_catalog` |
| Neon (Vercel) | 17.x | `pg_uuidv7` extension + alias |

The Prisma schema uses `@default(dbgenerated("uuidv7()"))` for all primary keys. The
`db:neon:setup` script handles both cases automatically. If Neon upgrades to Postgres
18 in the future, the alias step will be skipped automatically.

## Adding Prisma migrations later

This project currently uses `prisma db push` (schema-first, no migration files). If
formal migration files are added, replace step 2 with:

```bash
DATABASE_URL="$NEON_URL" npx prisma migrate deploy
```

`prisma migrate deploy` applies all pending migration files in order and is safe to
run repeatedly (skips already-applied migrations).

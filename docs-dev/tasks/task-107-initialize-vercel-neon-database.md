<!-- cspell:words neondb Neon uuidv7 uuidv PGHOST pgcatalog plpgsql dbgenerated libpq -->

# Task 107: Initialize Vercel / Neon database for preview deployment

**Status:** Done
**Target repo:** `front-pro`
**Depends on:** task-103 through task-106 (openfort login UX baseline)

## Issue

After deploying the `openfort` branch to Vercel (`openfort.infrafund.dev`), login
failed at step 2 "Checking your account" with "Something went wrong. Please try
again."

The root cause was that **the Neon database had never been initialized**. The Vercel
environment variables (including `DATABASE_URL`) were copied from `.env.local`, but
the `npm run dev:local` setup script that creates tables and seeds data is local-only
— it starts Docker and runs against a local Postgres instance. No equivalent step had
been run against the cloud Neon database.

## Investigation

1. Checked Vercel environment variables: all expected keys were present (`DATABASE_URL`,
   `OPENFORT_SECRET_KEY`, `APP_JWT_SECRET`, etc.).
2. Connected to the Neon database via `psql` — no tables existed; only `plpgsql` and
   default extensions.
3. Ran `npx prisma db push` against the Neon `DATABASE_URL` → failed immediately with:
   ```
   ERROR: function uuidv7() does not exist
   ```

## Root cause: Postgres 17 vs 18 compatibility

The Prisma schema uses `@default(dbgenerated("uuidv7()"))` for all primary keys.

| Environment | Postgres version | `uuidv7()` availability |
|---|---|---|
| Local Docker | 18.3 | Built-in `pg_catalog` function |
| Neon (Vercel) | 17.8 | Not built-in — needs `pg_uuidv7` extension |

The `pg_uuidv7` extension **is** available on Neon, but its v1.6 release renamed the
function from `uuidv7()` to `uuid_generate_v7()`. A `uuidv7()` wrapper alias was
therefore needed in addition to installing the extension.

## Fix applied

All steps run against the Neon non-pooled URL
(`ep-little-flower-abh704gp.eu-west-2.aws.neon.tech`):

```sql
-- 1. Install pg_uuidv7 extension
CREATE EXTENSION IF NOT EXISTS pg_uuidv7;

-- 2. Create uuidv7() alias (pg_uuidv7 v1.6 ships uuid_generate_v7(), not uuidv7())
CREATE OR REPLACE FUNCTION uuidv7() RETURNS uuid
LANGUAGE SQL AS $$ SELECT uuid_generate_v7() $$;
```

```bash
# 3. Apply Prisma schema (creates all 10 tables)
DATABASE_URL='...' npx prisma db push

# 4. Seed 251 countries (via psql — Node.js pg client timed out on port 5432)
psql '...' -f prisma/seed/countries.sql
```

## Why Node.js `pg` timed out but `psql` and Prisma did not

The Node.js `pg` client (used by `seed-countries.mjs`) timed out connecting on port
5432, while `psql` (libpq) and the Prisma Rust engine connected fine. This appears to
be an OS-level or library-level TCP behaviour difference with Neon's endpoints from
this development machine. The seed was applied directly via `psql -f` as a workaround.
The `db:neon:setup` script detects this scenario automatically — if the `pg` client
continues to have issues on a future machine, the psql workaround in
`docs/deployment-neon-vercel.md` covers it.

## Changes

- `scripts/setup-neon-db.mjs` — new script that:
  - Detects whether `uuidv7()` is a built-in (`pg_catalog`, Postgres 18+)
  - If not, installs `pg_uuidv7` and creates the `uuidv7()` alias
  - Runs `prisma db push`
  - Runs `seed-countries.mjs`
- `package.json` — added `db:neon:setup` script

## Verification

```sql
-- After setup, Neon should have:
SELECT COUNT(*) FROM countries;   -- 251
\dt                               -- 10 tables
\df uuidv7                        -- 1 row (public.uuidv7)
\dx                               -- pg_uuidv7 listed
```

All verified ✓. Vercel deployment after the commit redeploys and login works end-to-end.

## Out of scope

- Prisma migrations (the project uses `prisma db push` / schema-first, no migration
  files). If migration files are added later, the setup step changes to
  `prisma migrate deploy`.
- Production database setup (separate Neon project or separate branch, same procedure).
- The Node.js `pg` timeout root cause (libpq vs Node.js TCP behaviour; not blocking).

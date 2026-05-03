#!/usr/bin/env node

// Sets up the Neon (or any remote) Postgres database.
// Installs pg_uuidv7 extension when uuidv7() is not a built-in (Postgres < 18),
// then applies the Prisma schema and seeds countries.
//
// Usage: DATABASE_URL='postgresql://...' npm run db:neon:setup

import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import pg from 'pg';

const root = resolve(import.meta.dirname, '..');
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('Error: DATABASE_URL is not set.');
  process.exit(1);
}

const client = new pg.Client({ connectionString });
await client.connect();

try {
  // uuidv7() is a pg_catalog built-in in Postgres 18+.
  // On older versions (e.g. Neon's Postgres 17) the pg_uuidv7 extension is
  // needed, but its v1.6 provides uuid_generate_v7() rather than uuidv7(),
  // so we install the extension and then create a uuidv7() wrapper alias.
  const { rows } = await client.query(`
    SELECT COUNT(*) > 0 AS has_builtin
    FROM pg_proc
    WHERE proname = 'uuidv7'
      AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'pg_catalog')
  `);

  if (rows[0].has_builtin) {
    console.log('uuidv7() is a built-in (Postgres 18+), no extension needed.');
  } else {
    console.log('Installing pg_uuidv7 extension...');
    await client.query('CREATE EXTENSION IF NOT EXISTS pg_uuidv7');

    // pg_uuidv7 v1.6 ships uuid_generate_v7(), not uuidv7(). Create an alias
    // so the Prisma schema's @default(dbgenerated("uuidv7()")) works on both
    // Postgres 17 (Neon) and Postgres 18+ (local Docker, where it is built-in).
    await client.query(`
      CREATE OR REPLACE FUNCTION uuidv7() RETURNS uuid
      LANGUAGE SQL AS $$ SELECT uuid_generate_v7() $$
    `);
    console.log('pg_uuidv7 installed and uuidv7() alias created.');
  }
} finally {
  await client.end();
}

run('npx', ['prisma', 'db', 'push', '--accept-data-loss']);
run('node', ['scripts/seed-countries.mjs']);

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    env: process.env,
    stdio: 'inherit',
    shell: false,
  });

  if (result.error) throw result.error;

  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(' ')} failed with exit code ${result.status}`
    );
  }
}

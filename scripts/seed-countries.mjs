#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import pg from 'pg';

import { loadEnvLocal } from './load-env-local.mjs';

const root = resolve(import.meta.dirname, '..');
const defaultDatabaseUrl =
  'postgresql://postgres:postgres@localhost:5432/infra_dev?sslmode=disable';

loadEnvLocal(root);

const connectionString = process.env.DATABASE_URL || defaultDatabaseUrl;
const client = new pg.Client({ connectionString });

await client.connect();

try {
  const result = await client.query(
    'SELECT COUNT(*)::int AS count FROM countries'
  );
  const count = result.rows[0]?.count ?? 0;

  if (count > 0) {
    console.log(`Countries seed skipped; ${count} rows already exist.`);
    process.exit(0);
  }

  const sql = readFileSync(resolve(root, 'prisma/seed/countries.sql'), 'utf8');

  await client.query(sql);
  console.log('Countries seed applied.');
} finally {
  await client.end();
}

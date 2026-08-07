#!/usr/bin/env node

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
  // Preserve pre-migration visibility as the status baseline: components
  // that were shown default to 'installed', components that were hidden
  // default to 'not_started' (already the column default).
  const result = await client.query(
    `UPDATE project_digital_twin_components
     SET status = 'installed'
     WHERE is_visible = true AND status = 'not_started'`
  );

  console.log(
    `Digital twin status backfill applied; ${result.rowCount} component(s) set to 'installed'.`
  );
} finally {
  await client.end();
}

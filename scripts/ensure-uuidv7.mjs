#!/usr/bin/env node

import pg from 'pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('Error: DATABASE_URL is not set.');
  process.exit(1);
}

const client = new pg.Client({ connectionString });
await client.connect();

try {
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
    await client.query(`
      CREATE OR REPLACE FUNCTION uuidv7() RETURNS uuid
      LANGUAGE SQL AS $$ SELECT uuid_generate_v7() $$
    `);
    console.log('pg_uuidv7 installed and uuidv7() alias created.');
  }
} finally {
  await client.end();
}

#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import pg from 'pg';

import { loadEnvLocal } from './load-env-local.mjs';

const root = resolve(import.meta.dirname, '..');
const composeFile = 'deployment/docker-compose.local.yml';
const defaultDatabaseUrl =
  'postgresql://postgres:postgres@localhost:5432/infra_dev?sslmode=disable';

loadEnvLocal(root);
process.env.DATABASE_URL ||= defaultDatabaseUrl;

if (await canConnect()) {
  console.log('Using existing local Postgres from DATABASE_URL.');
} else {
  run('docker', ['compose', '-f', composeFile, 'up', '-d', 'postgres']);
  await waitForPostgres();
}

run('npx', ['prisma', 'db', 'push']);
run('node', ['scripts/seed-countries.mjs']);

async function waitForPostgres() {
  for (let attempt = 1; attempt <= 30; attempt += 1) {
    if (await canConnect()) return;
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1000);
  }

  throw new Error('Postgres did not become ready in time.');
}

async function canConnect() {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

  try {
    await client.connect();
    await client.query('SELECT 1');
    return true;
  } catch {
    return false;
  } finally {
    await client.end().catch(() => undefined);
  }
}

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    env: process.env,
    stdio: 'inherit',
    shell: false,
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed`);
  }
}

#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');

run('node', ['scripts/ensure-uuidv7.mjs']);
run('npx', ['prisma', 'migrate', 'deploy']);
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

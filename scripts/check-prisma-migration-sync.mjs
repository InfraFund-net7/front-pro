#!/usr/bin/env node

import { execFileSync } from 'node:child_process';

const baseRef =
  process.env.GITHUB_BASE_REF ||
  process.env.MIGRATION_CHECK_BASE ||
  'origin/develop';

const diffOutput = execGit(['diff', '--name-only', `${baseRef}...HEAD`]);
const changedFiles = diffOutput
  .split('\n')
  .map((file) => file.trim())
  .filter(Boolean);

const schemaChanged = changedFiles.includes('prisma/schema.prisma');
const migrationChanged = changedFiles.some(
  (file) =>
    file.startsWith('prisma/migrations/') &&
    file !== 'prisma/migrations/migration_lock.toml'
);

if (schemaChanged && !migrationChanged) {
  console.error(
    `prisma/schema.prisma changed without a committed migration. Run \`npx prisma migrate dev --name <name>\` and commit prisma/migrations/. Compared against ${baseRef}.`
  );
  process.exit(1);
}

console.log(
  schemaChanged
    ? `Prisma schema and migration files are in sync relative to ${baseRef}.`
    : `Prisma schema unchanged relative to ${baseRef}; migration sync check passed.`
);

function execGit(args) {
  return execFileSync('git', args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

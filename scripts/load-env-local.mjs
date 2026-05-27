import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export function loadEnvLocal(root = process.cwd()) {
  const envPath = resolve(root, '.env.local');

  if (!existsSync(envPath)) return;

  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#') || !line.includes('=')) continue;

    const [key, ...parts] = line.split('=');
    const name = key.trim();

    if (!name || process.env[name]) continue;

    process.env[name] = stripQuotes(parts.join('=').trim());
  }
}

function stripQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

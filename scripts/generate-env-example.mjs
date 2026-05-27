#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const args = new Map();

for (let index = 2; index < process.argv.length; index += 1) {
  const arg = process.argv[index];

  if (!arg.startsWith('--')) continue;

  args.set(arg.slice(2), process.argv[index + 1]);
  index += 1;
}

const sourcePath = resolve(root, args.get('source') ?? '.env.local');
const outputPath = resolve(root, args.get('output') ?? '.env.example');

function parseEnv(path) {
  const env = new Map();

  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#') || !line.includes('=')) continue;

    const [key, ...parts] = line.split('=');
    env.set(key.trim(), parts.join('=').trim());
  }

  return env;
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

function hintFromValue(key, rawValue, fallback) {
  const value = stripQuotes(rawValue ?? '');

  if (!value) return fallback ?? '';
  if (key.includes('SECRET') || key.includes('PASSWORD')) {
    if (value.startsWith('sk_test_')) return 'sk_test_...';
    if (value.startsWith('sk_live_')) return 'sk_live_...';
    return fallback ?? '<secret>';
  }

  if (value.startsWith('pk_test_')) return 'pk_test_...';
  if (value.startsWith('pk_live_')) return 'pk_live_...';

  return fallback ?? `${value.slice(0, 10)}...`;
}

const sections = [
  {
    title: 'Application Configuration',
    rows: [
      ['# Set service environment: development, preview, or production'],
      ['NEXT_PUBLIC_ENVIRONMENT', 'development'],
    ],
  },
  {
    title: 'PostgreSQL Database Configuration',
    rows: [
      ['# Local default matches deployment/docker-compose.local.yml'],
      [
        'DATABASE_URL',
        'postgresql://postgres:postgres@localhost:5432/infra_dev?sslmode=disable',
      ],
    ],
  },
  {
    title: 'Openfort Configuration',
    rows: [
      ['# Client-side publishable key from https://dashboard.openfort.io'],
      ['NEXT_PUBLIC_OPENFORT_PUBLIC_KEY', 'pk_test_...'],
      [
        '# Server-side publishable key; keep equal to NEXT_PUBLIC_OPENFORT_PUBLIC_KEY',
      ],
      ['OPENFORT_PUBLISHABLE_KEY', 'pk_test_...'],
      ['# Server-side secret key from Openfort Dashboard > API Keys'],
      ['OPENFORT_SECRET_KEY', 'sk_test_...'],
      ['# Optional API override'],
      ['OPENFORT_BASE_URL', 'https://api.openfort.io'],
    ],
  },
  {
    title: 'Embedded Wallet / Shield Configuration',
    rows: [
      ['# Shield publishable key from `openfort embedded-wallet setup`'],
      ['NEXT_PUBLIC_SHIELD_API_KEY', '<shield-publishable-key>'],
      ['# Optional Shield API override'],
      ['SHIELD_URL', 'https://shield.openfort.io'],
      ['# Server-side Shield values from `openfort embedded-wallet setup`'],
      ['SHIELD_SECRET_KEY', '<shield-secret-key>'],
      ['SHIELD_ENCRYPTION_SHARE', '<shield-encryption-share>'],
    ],
  },
  {
    title: 'Wallet Configuration',
    rows: [
      ['# Optional gas sponsorship policy ID'],
      ['NEXT_PUBLIC_POLICY_ID', ''],
      ['# Optional WalletConnect/Reown project ID for external wallets'],
      ['NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID', ''],
    ],
  },
  {
    title: 'App Session Auth Configuration',
    rows: [
      ['# Generate with: openssl rand -base64 32'],
      ['APP_JWT_SECRET', '<base64-32-byte-secret>'],
      ['APP_JWT_ISSUER', ''],
      ['APP_JWT_AUDIENCE', 'infrafund'],
      ['APP_JWT_ACCESS_TOKEN_TTL', '15m'],
      ['APP_AUTH_SESSION_ACTIVITY_TIMEOUT', '15m'],
      ['APP_AUTH_SESSION_ABSOLUTE_TTL', '7d'],
      ['APP_REFRESH_COOKIE_DOMAIN', ''],
      ['APP_REFRESH_COOKIE_SAME_SITE', 'lax'],
    ],
  },
  {
    title: 'reCAPTCHA Configuration',
    rows: [
      ['# Required for public form endpoints'],
      ['NEXT_PUBLIC_RECAPTCHA_SITE_KEY', '<recaptcha-site-key>'],
      ['RECAPTCHA_SECRET_KEY', '<recaptcha-secret-key>'],
    ],
  },
  {
    title: 'Cesium Ion Configuration',
    rows: [
      ['# Client-side Cesium Ion token for 3D Tiles digital twin assets'],
      ['NEXT_PUBLIC_CESIUM_ION_ACCESS_TOKEN', '<cesium-ion-access-token>'],
    ],
  },
  {
    title: 'Cleanup Cron Configuration',
    rows: [
      ['# Generate with: openssl rand -base64 32'],
      ['CRON_SECRET', '<base64-32-byte-secret>'],
    ],
  },
  {
    title: 'Contact Form Email Configuration',
    rows: [
      [
        '# Optional; SMTP values are required only when CONTACT_FORM_EMAIL_ENABLED=true',
      ],
      ['CONTACT_FORM_EMAIL_ENABLED', 'false'],
      ['SMTP_HOST', ''],
      ['SMTP_PORT', ''],
      ['SMTP_USER', ''],
      ['SMTP_PASSWORD', '<smtp-password>'],
      ['SMTP_SENDER', ''],
      ['CONTACT_FORM_RECEIVER', ''],
    ],
  },
];

const source = parseEnv(sourcePath);
const lines = [
  '# =============================================================================',
  '# InfraFund Next.js local/runtime environment',
  '# Generated from .env.local with secret-safe example values.',
  '# Run: npm run env:example',
  '# =============================================================================',
  '',
];

for (const section of sections) {
  lines.push(
    '# =============================================================================',
    `# ${section.title}`,
    '# ============================================================================='
  );

  for (const row of section.rows) {
    if (row.length === 1) {
      lines.push(row[0]);
      continue;
    }

    const [key, fallback] = row;
    lines.push(`${key}=${hintFromValue(key, source.get(key), fallback)}`);
  }

  lines.push('');
}

writeFileSync(outputPath, `${lines.join('\n').trimEnd()}\n`);

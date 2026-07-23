import 'server-only';

export const refreshTokenCookieName = 'refresh_token';

const defaultAccessTokenTtlMs = 15 * 60 * 1000;
const defaultActivityTimeoutMs = 15 * 60 * 1000;
const defaultAbsoluteSessionTtlMs = 7 * 24 * 60 * 60 * 1000;

function readOptionalString(name: string) {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function parseDuration(value: string | undefined, fallbackMs: number) {
  if (!value) return fallbackMs;

  const match = value.match(/^(\d+)(ms|s|m|h|d)?$/i);
  if (!match) return fallbackMs;

  const amount = Number(match[1]);
  const unit = match[2]?.toLowerCase() ?? 'ms';
  const multipliers: Record<string, number> = {
    ms: 1,
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return amount * multipliers[unit];
}

function readDuration(name: string, fallbackMs: number) {
  return parseDuration(readOptionalString(name), fallbackMs);
}

export function getAuthConfig() {
  return {
    accessTokenTtlMs: readDuration(
      'APP_JWT_ACCESS_TOKEN_TTL',
      defaultAccessTokenTtlMs
    ),
    activityTimeoutMs: readDuration(
      'APP_AUTH_SESSION_ACTIVITY_TIMEOUT',
      defaultActivityTimeoutMs
    ),
    absoluteSessionTtlMs: readDuration(
      'APP_AUTH_SESSION_ABSOLUTE_TTL',
      defaultAbsoluteSessionTtlMs
    ),
    cookieDomain: readOptionalString('APP_REFRESH_COOKIE_DOMAIN'),
    cookieSameSite: (
      readOptionalString('APP_REFRESH_COOKIE_SAME_SITE') ?? 'lax'
    ).toLowerCase(),
  };
}

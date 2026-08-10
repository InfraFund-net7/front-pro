import 'server-only';

import type { NextResponse } from 'next/server';

import { getAuthConfig, refreshTokenCookieName } from '@/server/auth/config';

function normalizeSameSite(value: string): 'lax' | 'strict' | 'none' {
  if (value === 'strict' || value === 'none') return value;
  return 'lax';
}

export function setRefreshTokenCookie(
  response: NextResponse,
  token: string,
  expires: Date
) {
  const authConfig = getAuthConfig();

  response.cookies.set({
    name: refreshTokenCookieName,
    value: token,
    expires,
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: normalizeSameSite(authConfig.cookieSameSite),
    ...(authConfig.cookieDomain ? { domain: authConfig.cookieDomain } : {}),
  });
}

export function clearRefreshTokenCookie(response: NextResponse) {
  const authConfig = getAuthConfig();

  response.cookies.set({
    name: refreshTokenCookieName,
    value: '',
    maxAge: 0,
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: normalizeSameSite(authConfig.cookieSameSite),
    ...(authConfig.cookieDomain ? { domain: authConfig.cookieDomain } : {}),
  });
}

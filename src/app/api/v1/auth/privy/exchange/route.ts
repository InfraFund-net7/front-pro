import type { NextRequest } from 'next/server';

import { setRefreshTokenCookie } from '@/server/auth/cookies';
import { requireBearerToken } from '@/server/auth/http';
import { getRequestMetadata, handleApiError, jsonOk } from '@/server/http';
import { exchangePrivySession } from '@/server/services/auth';
import { readJsonObject } from '@/server/validation/public-forms';

function optionalString(body: Record<string, unknown>, field: string) {
  const value = body[field];
  return typeof value === 'string' ? value.trim() : undefined;
}

export async function POST(request: NextRequest) {
  try {
    const body = await readJsonObject(request);
    const login = await exchangePrivySession({
      accessToken: requireBearerToken(request),
      firstName: optionalString(body, 'first_name'),
      lastName: optionalString(body, 'last_name'),
      organizationName: optionalString(body, 'organization_name'),
      phoneNumber: optionalString(body, 'phone_number'),
      email: optionalString(body, 'email'),
      type: optionalString(body, 'type'),
      role: optionalString(body, 'role'),
      metadata: getRequestMetadata(request),
    });
    const response = jsonOk({
      user_id: login.userId,
      access_token: login.accessToken,
      expires_at: login.accessTokenExpiresAt.toISOString(),
    });

    setRefreshTokenCookie(
      response,
      login.refreshToken,
      login.refreshTokenExpiresAt
    );

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}

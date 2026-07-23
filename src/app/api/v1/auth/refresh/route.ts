import type { NextRequest } from 'next/server';

import { refreshTokenCookieName } from '@/server/auth/config';
import { handleApiError, jsonOk } from '@/server/http';
import { refreshBackendSession } from '@/server/services/auth';
import { ApiError } from '@/server/http';

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get(refreshTokenCookieName)?.value;

    if (!refreshToken) {
      throw new ApiError(
        'UNAUTHORIZED',
        'Invalid refresh token or revoked token.'
      );
    }

    const login = await refreshBackendSession(refreshToken);

    return jsonOk({
      user_id: login.userId,
      access_token: login.accessToken,
      expires_at: login.accessTokenExpiresAt.toISOString(),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

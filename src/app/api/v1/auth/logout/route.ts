import type { NextRequest } from 'next/server';

import { clearRefreshTokenCookie } from '@/server/auth/cookies';
import { refreshTokenCookieName } from '@/server/auth/config';
import { handleApiError, jsonNoContent } from '@/server/http';
import { logoutBackendSession } from '@/server/services/auth';

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get(refreshTokenCookieName)?.value;
    const response = jsonNoContent();

    if (refreshToken) {
      await logoutBackendSession(refreshToken);
    }

    clearRefreshTokenCookie(response);

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}

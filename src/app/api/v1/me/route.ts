import type { NextRequest } from 'next/server';

import { clearRefreshTokenCookie } from '@/server/auth/cookies';
import { requireBearerToken } from '@/server/auth/bearer';
import { handleApiError, jsonNoContent, jsonOk } from '@/server/http';
import {
  deleteCurrentAccount,
  getCurrentUser,
} from '@/server/services/account';

export async function GET(request: NextRequest) {
  try {
    const accessToken = requireBearerToken(request);
    const user = await getCurrentUser(accessToken);

    return jsonOk(user);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const accessToken = requireBearerToken(request);
    await deleteCurrentAccount(accessToken);

    const response = jsonNoContent();
    clearRefreshTokenCookie(response);

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}

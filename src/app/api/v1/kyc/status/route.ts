import type { NextRequest } from 'next/server';

import { requireBearerToken } from '@/server/auth/http';
import { handleApiError, jsonOk } from '@/server/http';
import { getKycStatus } from '@/server/services/account';

export async function GET(request: NextRequest) {
  try {
    const accessToken = requireBearerToken(request);
    const status = await getKycStatus(accessToken);

    return jsonOk(status);
  } catch (error) {
    return handleApiError(error);
  }
}

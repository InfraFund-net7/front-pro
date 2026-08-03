import type { NextRequest } from 'next/server';

import { requireBearerToken } from '@/server/auth/http';
import { handleApiError, jsonOk } from '@/server/http';
import { checkPrivyUser } from '@/server/services/auth';

export async function GET(request: NextRequest) {
  try {
    const accessToken = requireBearerToken(request);
    const response = await checkPrivyUser(accessToken);

    return jsonOk(response);
  } catch (error) {
    return handleApiError(error);
  }
}

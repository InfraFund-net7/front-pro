import type { NextRequest } from 'next/server';

import { requireServerEnv } from '@/server/env';
import { ApiError, handleApiError, jsonOk } from '@/server/http';
import { runCleanupJobs } from '@/server/services/cleanup';

export async function GET(request: NextRequest) {
  try {
    const { cron } = requireServerEnv(['cron', 'database']);
    const authorization = request.headers.get('authorization') ?? '';

    if (authorization !== `Bearer ${cron.secret}`) {
      throw new ApiError('UNAUTHORIZED', 'Invalid cron secret.');
    }

    return jsonOk(await runCleanupJobs());
  } catch (error) {
    return handleApiError(error);
  }
}

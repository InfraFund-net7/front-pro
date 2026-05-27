import { NextRequest, NextResponse } from 'next/server';

import { requireBearerToken } from '@/server/auth/http';
import { ApiError, handleApiError } from '@/server/http';
import { logger } from '@/server/logger';
import {
  createOpenfortEncryptionSession,
  OpenfortEncryptionSessionError,
  verifyOpenfortAccessToken,
} from '@/server/openfort/session';

export async function POST(request: NextRequest) {
  try {
    const accessToken = requireBearerToken(request);
    const body = await request.json().catch(() => ({}));
    const requestedUserId =
      body && typeof body === 'object' && 'user_id' in body
        ? body.user_id
        : undefined;

    if (typeof requestedUserId !== 'string' || !requestedUserId.trim()) {
      throw new ApiError('BAD_REQUEST', 'Openfort user ID is required.');
    }

    const session = await verifyOpenfortAccessToken(accessToken);

    if (session.user.id !== requestedUserId) {
      throw new ApiError(
        'FORBIDDEN',
        'Openfort user mismatch for encryption session.'
      );
    }

    const encryptionSession = await createOpenfortEncryptionSession();

    return NextResponse.json({ session: encryptionSession });
  } catch (err) {
    if (err instanceof OpenfortEncryptionSessionError) {
      logger.error(
        {
          err,
          code: err.code,
          hint: err.hint,
          service: err.service,
          envVars: err.envVars,
        },
        'Encryption session configuration error'
      );
      return NextResponse.json(
        {
          code: err.code,
          message: err.message,
          detail: err.hint,
          fields: {
            service: err.service,
            envVars: err.envVars.join(', '),
          },
        },
        { status: err.status }
      );
    }

    logger.error({ err }, 'Encryption session error');
    return handleApiError(err);
  }
}

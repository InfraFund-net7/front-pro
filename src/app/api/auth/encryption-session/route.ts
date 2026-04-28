import { NextRequest, NextResponse } from 'next/server';

import { requireServerEnv } from '@/server/env';
import { handleApiError } from '@/server/http';
import { logger } from '@/server/logger';

export async function POST(request: NextRequest) {
  try {
    const { shield } = requireServerEnv(['shield']);
    const publishableKey = shield.publishableKey!;
    const secretKey = shield.secretKey!;
    const encryptionShare = shield.encryptionShare!;

    const body = await request.json();

    const response = await fetch(`${shield.url}/project/encryption-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': publishableKey,
        'x-api-secret': secretKey,
      },
      body: JSON.stringify({
        encryption_part: encryptionShare,
        user_id: body.user_id,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.warn(
        { status: response.status, error },
        'Shield encryption session request failed'
      );
      return NextResponse.json(
        { message: 'Failed to create encryption session' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ session: data.session_id });
  } catch (err) {
    logger.error({ err }, 'Encryption session error');
    return handleApiError(err);
  }
}

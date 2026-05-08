// cspell:words remoteip
import 'server-only';

import type { NextRequest } from 'next/server';

import { getServerEnv } from '@/server/env';
import { logger } from '@/server/logger';

import { ApiError } from './api-error';
import { getRequestMetadata } from './request-metadata';

const captchaHeaderName = 'x-captcha-token';
const googleVerifyUrl = 'https://www.google.com/recaptcha/api/siteverify';

interface GoogleCaptchaResponse {
  success: boolean;
  score?: number;
  action?: string;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
}

export interface CaptchaVerificationResult {
  success: boolean;
  skipped: boolean;
  score?: number;
  action?: string;
}

export function readCaptchaToken(request: NextRequest) {
  return request.headers.get(captchaHeaderName)?.trim() || undefined;
}

export async function verifyCaptchaToken(
  token: string | undefined,
  remoteIp?: string
): Promise<CaptchaVerificationResult> {
  const secret = getServerEnv().captcha.googleSecret;

  if (!secret) {
    return { success: true, skipped: true };
  }

  if (!token) {
    throw new ApiError('BAD_REQUEST', 'Missing captcha challenge token');
  }

  const body = new URLSearchParams({
    secret,
    response: token,
  });

  if (remoteIp) {
    body.set('remoteip', remoteIp);
  }

  const response = await fetch(googleVerifyUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!response.ok) {
    throw new ApiError('SERVICE_UNAVAILABLE', 'Failed to verify captcha');
  }

  const data = (await response.json()) as GoogleCaptchaResponse;

  if (!data.success) {
    const errorCodes = data['error-codes'] ?? [];
    // Always log Google's error codes — they're how we tell apart bad keys vs
    // domain mismatch vs expired token vs duplicate use, which are otherwise
    // indistinguishable from the client.
    logger.warn(
      { errorCodes, hostname: data.hostname },
      'reCAPTCHA verification failed'
    );
    // Surface them in non-production so the developer running locally sees
    // exactly what Google said without having to grep server logs.
    const detail =
      process.env.NODE_ENV !== 'production' && errorCodes.length > 0
        ? `Google reCAPTCHA returned: ${errorCodes.join(', ')}`
        : undefined;
    throw new ApiError('UNAUTHORIZED', 'Captcha verification failed', {
      detail,
    });
  }

  return {
    success: true,
    skipped: false,
    score: data.score,
    action: data.action,
  };
}

export async function verifyRequestCaptcha(request: NextRequest) {
  const metadata = getRequestMetadata(request);
  return verifyCaptchaToken(readCaptchaToken(request), metadata.ipAddress);
}

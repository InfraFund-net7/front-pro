import 'server-only';

import type { NextRequest } from 'next/server';

export interface RequestMetadata {
  ipAddress?: string;
  userAgent?: string;
  platform?: string;
  browser?: string;
  device?: string;
}

function firstHeaderValue(value: string | null) {
  return value?.split(',')[0]?.trim() || undefined;
}

function parseBrowser(userAgent: string | undefined) {
  if (!userAgent) return undefined;
  if (/Edg\//.test(userAgent)) return 'edge';
  if (/OPR\//.test(userAgent)) return 'opera';
  if (/Chrome\//.test(userAgent)) return 'chrome';
  if (/Safari\//.test(userAgent)) return 'safari';
  if (/Firefox\//.test(userAgent)) return 'firefox';
  return 'unknown';
}

function parseDevice(userAgent: string | undefined) {
  if (!userAgent) return undefined;
  if (/tablet|ipad/i.test(userAgent)) return 'tablet';
  if (/mobile|iphone|android/i.test(userAgent)) return 'mobile';
  return 'desktop';
}

function parsePlatform(
  userAgent: string | undefined,
  clientHintPlatform: string | undefined
): string | undefined {
  const platform = clientHintPlatform?.replace(/^"|"$/g, '').toLowerCase();
  if (platform) return platform;
  if (!userAgent) return undefined;
  if (/windows/i.test(userAgent)) return 'windows';
  if (/mac os|macintosh/i.test(userAgent)) return 'macos';
  if (/android/i.test(userAgent)) return 'android';
  if (/iphone|ipad|ios/i.test(userAgent)) return 'ios';
  if (/linux/i.test(userAgent)) return 'linux';
  return 'unknown';
}

export function getRequestMetadata(request: NextRequest): RequestMetadata {
  const userAgent = request.headers.get('user-agent') ?? undefined;
  const platform = parsePlatform(
    userAgent,
    request.headers.get('sec-ch-ua-platform') ?? undefined
  );

  return {
    ipAddress:
      firstHeaderValue(request.headers.get('cf-connecting-ip')) ??
      firstHeaderValue(request.headers.get('x-real-ip')) ??
      firstHeaderValue(request.headers.get('x-forwarded-for')),
    userAgent,
    platform,
    browser: parseBrowser(userAgent),
    device: parseDevice(userAgent),
  };
}

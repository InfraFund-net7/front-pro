'use client';

import * as Sentry from '@sentry/nextjs';

type Severity = 'fatal' | 'error' | 'warning' | 'info';

interface ReportOptions {
  area: 'auth' | 'wallet' | 'openfort' | 'telemetry' | 'unknown';
  severity?: Severity;
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  fingerprint?: string[];
}

export function isNoisyNetworkError(message: string | undefined | null) {
  if (!message) return false;
  return /failed to fetch|networkerror|load failed|analytics sdk/i.test(
    message
  );
}

export function reportError(error: unknown, options: ReportOptions) {
  const severity = options.severity ?? 'error';

  if (error instanceof Error && isNoisyNetworkError(error.message)) {
    Sentry.addBreadcrumb({
      category: options.area,
      message: error.message,
      level: 'warning',
      data: { ...options.extra },
    });
    return;
  }

  Sentry.captureException(error, {
    level: severity,
    tags: {
      area: options.area,
      ...options.tags,
    },
    extra: options.extra,
    fingerprint: options.fingerprint,
  });
}

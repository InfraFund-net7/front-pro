import * as Sentry from '@sentry/nextjs';
import { isNoisyNetworkError } from '@/lib/error-reporting';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment:
    process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
  release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
  tracesSampleRate: 0.1,
  beforeSend(event, hint) {
    const err = hint?.originalException;
    const message =
      err instanceof Error
        ? err.message
        : typeof err === 'string'
          ? err
          : (event.message ?? '');

    if (isNoisyNetworkError(message)) {
      return null;
    }

    return event;
  },
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

import 'server-only';

import pino from 'pino';

const redactionPaths = [
  'authorization',
  'headers.authorization',
  'headers.cookie',
  'cookie',
  'token',
  'accessToken',
  'refreshToken',
  'refreshTokenHash',
  'captchaToken',
  'secret',
  '*.authorization',
  '*.cookie',
  '*.token',
  '*.secret',
];

export const logger = pino({
  level:
    process.env.LOG_LEVEL ??
    (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  redact: {
    paths: redactionPaths,
    censor: '[redacted]',
  },
  base: {
    service: 'front-pro',
    environment:
      process.env.NEXT_PUBLIC_ENVIRONMENT ??
      process.env.NODE_ENV ??
      'development',
  },
});

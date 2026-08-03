import 'server-only';

type ServerEnvFeature =
  | 'database'
  | 'auth'
  | 'privy'
  | 'captcha'
  | 'email'
  | 'cron';

interface ServerEnv {
  app: {
    environment: string;
    isProduction: boolean;
  };
  database: {
    url?: string;
  };
  auth: {
    jwtSecret?: string;
    jwtIssuer?: string;
    jwtAudience: string;
  };
  privy: {
    appId?: string;
    appSecret?: string;
  };
  captcha: {
    googleSecret?: string;
  };
  email: {
    enabled: boolean;
    smtpHost?: string;
    smtpPort?: string;
    smtpUser?: string;
    smtpPassword?: string;
    smtpSender?: string;
    receiver?: string;
  };
  cron: {
    secret?: string;
  };
}

const requiredEnvByFeature: Record<ServerEnvFeature, string[]> = {
  database: ['DATABASE_URL'],
  auth: ['APP_JWT_SECRET'],
  privy: ['NEXT_PUBLIC_PRIVY_APP_ID', 'PRIVY_APP_SECRET'],
  captcha: ['RECAPTCHA_SECRET_KEY'],
  email: [
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_PASSWORD',
    'SMTP_SENDER',
    'CONTACT_FORM_RECEIVER',
  ],
  cron: ['CRON_SECRET'],
};

let cachedEnv: ServerEnv | undefined;

function readOptionalString(name: string) {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function readBoolean(name: string, fallback = false) {
  const value = readOptionalString(name);

  if (!value) return fallback;

  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

export function getServerEnv() {
  if (cachedEnv) return cachedEnv;

  cachedEnv = {
    app: {
      environment:
        readOptionalString('NEXT_PUBLIC_ENVIRONMENT') ??
        readOptionalString('NODE_ENV') ??
        'development',
      isProduction: process.env.NODE_ENV === 'production',
    },
    database: {
      url: readOptionalString('DATABASE_URL'),
    },
    auth: {
      jwtSecret: readOptionalString('APP_JWT_SECRET'),
      jwtIssuer: readOptionalString('APP_JWT_ISSUER'),
      jwtAudience: readOptionalString('APP_JWT_AUDIENCE') ?? 'infrafund',
    },
    privy: {
      appId: readOptionalString('NEXT_PUBLIC_PRIVY_APP_ID'),
      appSecret: readOptionalString('PRIVY_APP_SECRET'),
    },
    captcha: {
      googleSecret: readOptionalString('RECAPTCHA_SECRET_KEY'),
    },
    email: {
      enabled: readBoolean('CONTACT_FORM_EMAIL_ENABLED'),
      smtpHost: readOptionalString('SMTP_HOST'),
      smtpPort: readOptionalString('SMTP_PORT'),
      smtpUser: readOptionalString('SMTP_USER'),
      smtpPassword: readOptionalString('SMTP_PASSWORD'),
      smtpSender: readOptionalString('SMTP_SENDER'),
      receiver: readOptionalString('CONTACT_FORM_RECEIVER'),
    },
    cron: {
      secret: readOptionalString('CRON_SECRET'),
    },
  };

  return cachedEnv;
}

function findMissingServerEnv(features: ServerEnvFeature[]) {
  const env = getServerEnv();

  return features.flatMap((feature) => {
    if (feature === 'auth') {
      return env.auth.jwtSecret ? [] : requiredEnvByFeature.auth;
    }

    if (feature === 'privy') {
      return [
        ...(env.privy.appId ? [] : [requiredEnvByFeature.privy[0]]),
        ...(env.privy.appSecret ? [] : [requiredEnvByFeature.privy[1]]),
      ];
    }

    if (feature === 'cron') {
      return env.cron.secret ? [] : requiredEnvByFeature.cron;
    }

    return requiredEnvByFeature[feature].filter(
      (name) => !readOptionalString(name)
    );
  });
}

export function requireServerEnv(features: ServerEnvFeature[]) {
  const missing = findMissingServerEnv(features);

  if (missing.length > 0) {
    throw new Error(
      `Missing server environment variables: ${missing.join(', ')}`
    );
  }

  return getServerEnv();
}

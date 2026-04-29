import 'server-only';

type ServerEnvFeature =
  | 'database'
  | 'auth'
  | 'openfort'
  | 'captcha'
  | 'email'
  | 'shield'
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
  openfort: {
    secretKey?: string;
    publishableKey?: string;
    baseUrl: string;
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
  shield: {
    url: string;
    publishableKey?: string;
    secretKey?: string;
    encryptionShare?: string;
  };
  cron: {
    secret?: string;
  };
}

const requiredEnvByFeature: Record<ServerEnvFeature, string[]> = {
  database: ['DATABASE_URL'],
  auth: ['APP_JWT_SECRET'],
  openfort: ['OPENFORT_SECRET_KEY', 'OPENFORT_PUBLISHABLE_KEY'],
  captcha: ['RECAPTCHA_SECRET_KEY'],
  email: [
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_PASSWORD',
    'SMTP_SENDER',
    'CONTACT_FORM_RECEIVER',
  ],
  shield: [
    'NEXT_PUBLIC_SHIELD_API_KEY',
    'SHIELD_SECRET_KEY',
    'SHIELD_ENCRYPTION_SHARE',
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
    openfort: {
      secretKey: readOptionalString('OPENFORT_SECRET_KEY'),
      publishableKey: readOptionalString('OPENFORT_PUBLISHABLE_KEY'),
      baseUrl:
        readOptionalString('OPENFORT_BASE_URL') ?? 'https://api.openfort.io',
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
    shield: {
      url: readOptionalString('SHIELD_URL') ?? 'https://shield.openfort.io',
      publishableKey: readOptionalString('NEXT_PUBLIC_SHIELD_API_KEY'),
      secretKey: readOptionalString('SHIELD_SECRET_KEY'),
      encryptionShare: readOptionalString('SHIELD_ENCRYPTION_SHARE'),
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

    if (feature === 'openfort') {
      return [
        ...(env.openfort.secretKey ? [] : [requiredEnvByFeature.openfort[0]]),
        ...(env.openfort.publishableKey
          ? []
          : [requiredEnvByFeature.openfort[1]]),
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

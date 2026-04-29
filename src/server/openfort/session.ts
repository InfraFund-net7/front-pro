import 'server-only';

import Openfort from '@openfort/openfort-node';

import { ApiError } from '@/server/http';
import { logger } from '@/server/logger';
import { requireServerEnv } from '@/server/env';

export interface VerifiedOpenfortSession {
  user: {
    id: string;
    email?: string | null;
    name?: string | null;
    phoneNumber?: string | null;
  };
  session: {
    id?: string | null;
    expiresAt?: string | null;
  };
}

let cachedClient: Openfort | undefined;

function getOpenfortClient() {
  if (cachedClient) return cachedClient;

  const { openfort } = requireServerEnv(['openfort']);
  cachedClient = new Openfort(openfort.secretKey!, {
    basePath: openfort.baseUrl,
    publishableKey: openfort.publishableKey,
  });

  return cachedClient;
}

function normalizeOpenfortSession(session: unknown): VerifiedOpenfortSession {
  if (!session || typeof session !== 'object') {
    throw new ApiError('UNAUTHORIZED', 'Invalid Openfort access token.');
  }

  const value = session as {
    user?: {
      id?: unknown;
      email?: unknown;
      name?: unknown;
      phoneNumber?: unknown;
    };
    session?: {
      id?: unknown;
      expiresAt?: unknown;
    };
  };
  const userId = value.user?.id;

  if (typeof userId !== 'string' || !userId.trim()) {
    throw new ApiError('UNAUTHORIZED', 'Invalid Openfort access token.');
  }

  return {
    user: {
      id: userId,
      email:
        typeof value.user?.email === 'string' ? value.user.email : undefined,
      name: typeof value.user?.name === 'string' ? value.user.name : undefined,
      phoneNumber:
        typeof value.user?.phoneNumber === 'string'
          ? value.user.phoneNumber
          : undefined,
    },
    session: {
      id: typeof value.session?.id === 'string' ? value.session.id : undefined,
      expiresAt:
        typeof value.session?.expiresAt === 'string'
          ? value.session.expiresAt
          : undefined,
    },
  };
}

export async function verifyOpenfortAccessToken(accessToken: string) {
  try {
    const session = await getOpenfortClient().iam.getSession({ accessToken });
    return normalizeOpenfortSession(session);
  } catch (error) {
    if (error instanceof ApiError) throw error;

    logger.warn({ err: error }, 'Openfort session verification failed');
    throw new ApiError('UNAUTHORIZED', 'Invalid Openfort access token.');
  }
}

export function deleteOpenfortUser(openfortUserId: string) {
  return getOpenfortClient().iam.users.delete(openfortUserId);
}

export function createOpenfortEncryptionSession() {
  const { shield } = requireServerEnv(['shield']);

  return getOpenfortClient().createEncryptionSession(
    shield.publishableKey!,
    shield.secretKey!,
    shield.encryptionShare!,
    shield.url
  );
}

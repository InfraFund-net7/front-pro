import 'server-only';

import { PrivyClient } from '@privy-io/server-auth';
import { ApiError } from '@/server/http';
import { requireServerEnv } from '@/server/env';
import { logger } from '@/server/logger';

export interface VerifiedPrivySession {
  user: {
    id: string;
    email?: string | null;
    name?: string | null;
    phoneNumber?: string | null;
  };
}

let cachedClient: PrivyClient | undefined;

function getPrivyClient() {
  if (cachedClient) return cachedClient;

  // requireServerEnv throws a plain Error for missing/misconfigured env
  // vars. Let that propagate as an unhandled error (-> 500) instead of
  // being relabeled "Invalid Privy access token" below, so a server
  // misconfiguration doesn't masquerade as an expired user session.
  const env = requireServerEnv(['privy']);

  cachedClient = new PrivyClient(env.privy.appId!, env.privy.appSecret!);
  return cachedClient;
}

export async function verifyPrivyAccessToken(
  accessToken: string
): Promise<VerifiedPrivySession> {
  const client = getPrivyClient();

  try {
    const claims = await client.verifyAuthToken(accessToken);

    return {
      user: {
        id: claims.userId,
        email: null,
        name: null,
        phoneNumber: null,
      },
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;

    logger.warn({ err: error }, 'Privy session verification failed');
    throw new ApiError('UNAUTHORIZED', 'Invalid Privy access token.');
  }
}

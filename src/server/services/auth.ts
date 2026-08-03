import 'server-only';

import type { RequestMetadata } from '@/server/http';
import { ApiError } from '@/server/http';
import { getAuthConfig } from '@/server/auth/config';
import { signAppAccessToken, verifyAppAccessToken } from '@/server/auth/jwt';
import { createOpaqueToken, hashOpaqueToken } from '@/server/auth/tokens';
import { assertUserNotLocked } from '@/server/auth/lockout';
import {
  createSession,
  findSessionById,
  findSessionByRefreshTokenHash,
  revokeSession,
  updateSessionActivity,
} from '@/server/repositories/sessions';
import {
  attachPrivyUserId,
  createUser,
  findUserByEmail,
  findUserByPrivyId,
  isUserUniqueConstraintError,
  type CreateUserRecord,
} from '@/server/repositories/users';
import {
  verifyPrivyAccessToken,
  type VerifiedPrivySession,
} from '@/server/privy/session';

interface PrivyExchangeInput {
  accessToken: string;
  firstName?: string;
  lastName?: string;
  organizationName?: string;
  phoneNumber?: string;
  email?: string;
  type?: string;
  role?: string;
  metadata: RequestMetadata;
}

type SessionWithUser = NonNullable<
  Awaited<ReturnType<typeof findSessionByRefreshTokenHash>>
>;
type ActiveSession = SessionWithUser & {
  user: NonNullable<SessionWithUser['user']>;
};

function emptyToNull(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function splitName(name: string | undefined | null) {
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? [];

  if (parts.length === 0) return { firstName: null, lastName: null };
  if (parts.length === 1) return { firstName: parts[0], lastName: null };

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  };
}

function normalizeUserType(type: string | undefined): CreateUserRecord['type'] {
  return type === 'organization' ? 'organization' : 'individual';
}

function normalizeUserRole(role: string | undefined): CreateUserRecord['role'] {
  switch (role) {
    case 'project_owner':
    case 'investor':
    case 'contractor':
    case 'governance':
    case 'auditor':
      return role;
    case 'client':
      return 'project_owner';
    case 'dao':
      return 'governance';
    default:
      return 'investor';
  }
}

function assertNewUserPayload(input: PrivyExchangeInput) {
  if (!input.type) {
    throw new ApiError('BAD_REQUEST', 'User type is required for new users.');
  }

  if (!input.role) {
    throw new ApiError('BAD_REQUEST', 'User role is required for new users.');
  }

  if (input.type === 'organization' && !emptyToNull(input.organizationName)) {
    throw new ApiError('BAD_REQUEST', 'Organization name is required.');
  }
}

function buildUserRecord(
  input: PrivyExchangeInput,
  session: VerifiedPrivySession
): CreateUserRecord {
  const sessionName = splitName(session.user.name);

  return {
    privyUserId: session.user.id,
    email: emptyToNull(input.email) ?? emptyToNull(session.user.email),
    firstName: emptyToNull(input.firstName) ?? sessionName.firstName,
    lastName: emptyToNull(input.lastName) ?? sessionName.lastName,
    phoneNumber:
      emptyToNull(input.phoneNumber) ?? emptyToNull(session.user.phoneNumber),
    companyName:
      input.type === 'individual'
        ? 'INDIVIDUAL'
        : emptyToNull(input.organizationName),
    type: normalizeUserType(input.type),
    role: normalizeUserRole(input.role),
  };
}

async function findLinkedUserByEmail(session: VerifiedPrivySession) {
  const email = emptyToNull(session.user.email);

  if (!email) {
    return null;
  }

  return findUserByEmail(email);
}

async function linkExistingUserToPrivy(
  userId: string,
  session: VerifiedPrivySession
) {
  try {
    return await attachPrivyUserId(userId, session.user.id);
  } catch (error) {
    if (isUserUniqueConstraintError(error)) {
      const existingUser = await findUserByPrivyId(session.user.id);

      if (existingUser) {
        return existingUser;
      }
    }

    throw error;
  }
}

async function resolveExistingUser(session: VerifiedPrivySession) {
  const existingUser = await findUserByPrivyId(session.user.id);

  if (existingUser) {
    return existingUser;
  }

  const emailMatchedUser = await findLinkedUserByEmail(session);

  if (!emailMatchedUser) {
    return null;
  }

  return linkExistingUserToPrivy(emailMatchedUser.id, session);
}

async function findOrCreateUser(
  input: PrivyExchangeInput,
  session: VerifiedPrivySession
) {
  const existingUser = await resolveExistingUser(session);

  if (existingUser) {
    return { user: existingUser, created: false };
  }

  assertNewUserPayload(input);

  try {
    return {
      user: await createUser(buildUserRecord(input, session)),
      created: true,
    };
  } catch (error) {
    if (isUserUniqueConstraintError(error)) {
      const recoveredUser = await resolveExistingUser(session);

      if (recoveredUser) {
        return { user: recoveredUser, created: false };
      }

      throw new ApiError('CONFLICT', 'User already exists.', {
        detail:
          'This email is already linked to another account and could not be recovered automatically. Please contact support.',
      });
    }

    throw error;
  }
}

function assertActiveSession(
  session: SessionWithUser | null
): asserts session is ActiveSession {
  if (!session || !session.user || session.user.deletedAt) {
    throw new ApiError(
      'UNAUTHORIZED',
      'Invalid refresh token or revoked token.'
    );
  }

  if (session.revokedAt) {
    throw new ApiError(
      'UNAUTHORIZED',
      'Your session was terminated, try to login.'
    );
  }

  const now = new Date();

  if (session.absoluteExpiresAt <= now) {
    throw new ApiError(
      'UNAUTHORIZED',
      'Your session has expired. Please login again.'
    );
  }

  if (session.activityTimeoutAt <= now) {
    throw new ApiError(
      'UNAUTHORIZED',
      'Your session expired due to inactivity. Please login again.'
    );
  }
}

async function createAccessTokenForSession(session: ActiveSession) {
  const authConfig = getAuthConfig();
  const accessTokenExpiresAt = new Date(
    Date.now() + authConfig.accessTokenTtlMs
  );
  const accessToken = await signAppAccessToken(
    {
      userId: session.user.id,
      sessionId: session.id,
      kycVerified: Boolean(session.user.kycVerified),
      kybVerified: Boolean(session.user.kybVerified),
      type: session.user.type,
      role: session.user.role,
    },
    accessTokenExpiresAt
  );

  return {
    userId: session.user.id,
    accessToken,
    accessTokenExpiresAt,
  };
}

export async function checkPrivyUser(accessToken: string) {
  const session = await verifyPrivyAccessToken(accessToken);
  const existingUser = await resolveExistingUser(session);

  return {
    exists: Boolean(existingUser),
  };
}

export async function exchangePrivySession(input: PrivyExchangeInput) {
  const privySession = await verifyPrivyAccessToken(input.accessToken);
  const { user, created } = await findOrCreateUser(input, privySession);

  if (!created) {
    await assertUserNotLocked(user.id);
  }

  const refreshToken = createOpaqueToken();
  const authConfig = getAuthConfig();
  const now = Date.now();
  const accessTokenExpiresAt = new Date(now + authConfig.accessTokenTtlMs);
  const session = await createSession({
    userId: user.id,
    refreshTokenHash: hashOpaqueToken(refreshToken),
    metadata: input.metadata,
    activityTimeoutAt: new Date(now + authConfig.activityTimeoutMs),
    absoluteExpiresAt: new Date(now + authConfig.absoluteSessionTtlMs),
  });
  const accessToken = await signAppAccessToken(
    {
      userId: user.id,
      sessionId: session.id,
      kycVerified: Boolean(user.kycVerified),
      kybVerified: Boolean(user.kybVerified),
      type: user.type,
      role: user.role,
    },
    accessTokenExpiresAt
  );

  return {
    userId: user.id,
    accessToken,
    accessTokenExpiresAt,
    refreshToken,
    refreshTokenExpiresAt: new Date(now + authConfig.absoluteSessionTtlMs),
  };
}

export async function refreshBackendSession(refreshToken: string) {
  const authConfig = getAuthConfig();
  const session = await findSessionByRefreshTokenHash(
    hashOpaqueToken(refreshToken)
  );

  assertActiveSession(session);

  const refreshedToken = await createAccessTokenForSession(session);

  await updateSessionActivity(
    session.id,
    new Date(Date.now() + authConfig.activityTimeoutMs)
  );

  return refreshedToken;
}

export async function logoutBackendSession(refreshToken: string) {
  const session = await findSessionByRefreshTokenHash(
    hashOpaqueToken(refreshToken)
  );

  if (!session || session.revokedAt) {
    return;
  }

  await revokeSession(session.id, 'logout');
}

export async function authenticateAppRequest(accessToken: string) {
  const claims = await verifyAppAccessToken(accessToken).catch(() => {
    throw new ApiError('UNAUTHORIZED', 'Invalid access token.');
  });
  const session = await findSessionById(claims.sessionId);

  assertActiveSession(session);

  if (session.user.id !== claims.userId) {
    throw new ApiError('UNAUTHORIZED', 'Invalid access token.');
  }

  return {
    user: session.user,
    session,
  };
}

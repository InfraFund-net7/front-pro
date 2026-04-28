import 'server-only';

import type { UserRole, UserType } from '@prisma/client';
import { jwtVerify, SignJWT } from 'jose';

import { requireServerEnv } from '@/server/env';

interface AppAccessTokenClaims {
  userId: string;
  sessionId: string;
  kycVerified: boolean;
  kybVerified: boolean;
  type: UserType;
  role: UserRole;
}

function getJwtSecret() {
  const env = requireServerEnv(['auth']);
  return new TextEncoder().encode(env.auth.jwtSecret!);
}

export async function signAppAccessToken(
  claims: AppAccessTokenClaims,
  expiresAt: Date
) {
  const env = requireServerEnv(['auth']);
  const jwt = new SignJWT({
    session_id: claims.sessionId,
    kyc_verified: claims.kycVerified,
    kyb_verified: claims.kybVerified,
    type: claims.type,
    role: claims.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(claims.userId)
    .setAudience(env.auth.jwtAudience)
    .setIssuedAt()
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000));

  if (env.auth.jwtIssuer) {
    jwt.setIssuer(env.auth.jwtIssuer);
  }

  return jwt.sign(getJwtSecret());
}

export async function verifyAppAccessToken(token: string) {
  const env = requireServerEnv(['auth']);
  const result = await jwtVerify(token, getJwtSecret(), {
    audience: env.auth.jwtAudience,
    issuer: env.auth.jwtIssuer,
  });

  if (!result.payload.sub || typeof result.payload.session_id !== 'string') {
    throw new Error('Invalid app access token claims');
  }

  return {
    userId: result.payload.sub,
    sessionId: result.payload.session_id,
  };
}

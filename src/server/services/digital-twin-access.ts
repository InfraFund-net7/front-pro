import 'server-only';

import { cookies } from 'next/headers';

import { refreshTokenCookieName } from '@/server/auth/config';
import { ApiError } from '@/server/http';
import { findProjectForOwner } from '@/server/repositories/projects';
import {
  authenticateAppRequest,
  resolveActiveSessionByRefreshToken,
} from '@/server/services/auth';

function assertProjectOwnerRole(role: string) {
  if (role !== 'project_owner') {
    throw new ApiError('FORBIDDEN', 'Project owner account required.');
  }
}

async function assertOwnsProject(projectId: string, userId: string) {
  const project = await findProjectForOwner(projectId, userId);

  if (!project) {
    throw new ApiError('NOT_FOUND', 'Project not found.');
  }

  return project;
}

// Used by the two digital-twin PATCH routes, which have a bearer token.
export async function requireDigitalTwinAccessFromBearer(
  accessToken: string,
  projectId: string
) {
  const { user } = await authenticateAppRequest(accessToken);

  assertProjectOwnerRole(user.role);

  return assertOwnsProject(projectId, user.id);
}

// Used by the digital-twin RSC page, which renders server-side with no
// bearer token available (the app JWT lives only in client React state) --
// the httpOnly refresh cookie is the only credential an RSC render has.
export async function requireDigitalTwinAccessFromCookies(projectId: string) {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(refreshTokenCookieName)?.value;

  if (!refreshToken) {
    throw new ApiError(
      'UNAUTHORIZED',
      'Invalid refresh token or revoked token.'
    );
  }

  const { user } = await resolveActiveSessionByRefreshToken(refreshToken);

  assertProjectOwnerRole(user.role);

  return assertOwnsProject(projectId, user.id);
}

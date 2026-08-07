import 'server-only';

import { authenticateAppRequest } from '@/server/services/auth';
import { ApiError } from '@/server/http';
import {
  findActiveUserById,
  softDeleteUserAccount,
} from '@/server/repositories/users';
// Privy user deletion is handled client-side via Privy's dashboard/API.

async function getAuthenticatedUser(accessToken: string) {
  const { user: sessionUser } = await authenticateAppRequest(accessToken);
  const user = await findActiveUserById(sessionUser.id);

  if (!user) {
    throw new ApiError('UNAUTHORIZED', 'Invalid access token.');
  }

  return user;
}

export async function getCurrentUser(accessToken: string) {
  const user = await getAuthenticatedUser(accessToken);

  return {
    user_id: user.id,
    privy_user_id: user.privyUserId,
    email: user.email,
    first_name: user.firstName,
    last_name: user.lastName,
    company_name: user.organization?.name ?? null,
    phone_number: user.phoneNumber,
    type: user.type,
    role: user.role,
    status: user.status,
    kyc_verified: Boolean(user.kycVerified),
    kyb_verified: Boolean(user.kybVerified),
  };
}

export async function deleteCurrentAccount(accessToken: string) {
  const user = await getAuthenticatedUser(accessToken);
  await softDeleteUserAccount(user.id);
}

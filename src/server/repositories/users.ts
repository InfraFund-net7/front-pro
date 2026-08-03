import 'server-only';

import { Prisma, type UserRole, type UserType } from '@prisma/client';

import { getDb } from '@/server/db';

export interface CreateUserRecord {
  // Stored in the openfort_user_id column (DB rename deferred to a future migration)
  privyUserId: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phoneNumber?: string | null;
  companyName?: string | null;
  type: UserType;
  role: UserRole;
}

export type UserWithOrganization = Prisma.UserGetPayload<{
  include: { organization: true };
}>;

export function findActiveUserById(userId: string) {
  return getDb().user.findFirst({
    where: { id: userId, deletedAt: null },
    include: { organization: true },
  });
}

export function findUserByPrivyId(privyUserId: string) {
  return getDb().user.findFirst({
    where: {
      openfortUserId: privyUserId,
      deletedAt: null,
    },
  });
}

export function findUserByEmail(email: string) {
  return getDb().user.findFirst({
    where: {
      email,
      deletedAt: null,
    },
  });
}

export function attachPrivyUserId(userId: string, privyUserId: string) {
  return getDb().user.update({
    where: { id: userId },
    data: { openfortUserId: privyUserId },
  });
}

export async function createUser(record: CreateUserRecord) {
  return getDb().$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        openfortUserId: record.privyUserId,
        email: record.email,
        firstName: record.firstName,
        lastName: record.lastName,
        phoneNumber: record.phoneNumber,
        type: record.type,
        role: record.role,
        status: 'pending_kyc',
      },
    });

    if (record.type === 'organization' && record.companyName) {
      await tx.userOrganization.create({
        data: {
          userId: user.id,
          name: record.companyName,
        },
      });
    }

    return user;
  });
}

export async function softDeleteUserAccount(userId: string) {
  const db = getDb();
  const now = new Date();

  await db.$transaction(async (tx) => {
    const user = await tx.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { dataDeletionRequestedAt: true },
    });

    if (!user) return;

    await tx.session.updateMany({
      where: { userId, revokedAt: null },
      data: {
        revokedAt: now,
        revokedReason: 'user_terminated',
        revokedByUserId: null,
      },
    });

    await tx.user.update({
      where: { id: userId },
      data: {
        email: null,
        phoneNumber: null,
        openfortUserId: `deleted:${userId}`, // column rename deferred to future migration
        dataDeletionRequestedAt: user.dataDeletionRequestedAt ?? now,
        deletedAt: now,
        updatedAt: now,
      },
    });
  });
}

export function isUserUniqueConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}

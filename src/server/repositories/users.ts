import 'server-only';

import { Prisma, type UserRole, type UserType } from '@prisma/client';

import { getDb } from '@/server/db';

export interface CreateUserRecord {
  openfortUserId: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phoneNumber?: string | null;
  companyName?: string | null;
  type: UserType;
  role: UserRole;
}

export function findUserByOpenfortId(openfortUserId: string) {
  return getDb().user.findFirst({
    where: {
      openfortUserId,
      deletedAt: null,
    },
  });
}

export async function openfortUserExists(openfortUserId: string) {
  const count = await getDb().user.count({
    where: {
      openfortUserId,
      deletedAt: null,
    },
  });

  return count > 0;
}

export async function createUser(record: CreateUserRecord) {
  return getDb().$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        openfortUserId: record.openfortUserId,
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

export function isUserUniqueConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}

import 'server-only';

import { Prisma } from '@prisma/client';

export function isUniqueConstraintError(error: unknown, field?: string) {
  if (
    !(error instanceof Prisma.PrismaClientKnownRequestError) ||
    error.code !== 'P2002'
  ) {
    return false;
  }

  if (!field) return true;

  return Array.isArray(error.meta?.target) && error.meta.target.includes(field);
}

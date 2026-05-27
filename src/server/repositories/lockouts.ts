import 'server-only';

import { getDb } from '@/server/db';

export function findLockoutByUserId(userId: string) {
  return getDb().accountLockout.findUnique({
    where: {
      userId,
    },
  });
}

export function resetLockout(userId: string) {
  return getDb().accountLockout.update({
    where: {
      userId,
    },
    data: {
      failedAttempts: 0,
      lockedAt: null,
      lockedUntil: null,
      lockedReason: null,
      updatedAt: new Date(),
    },
  });
}

export function deleteExpiredLockouts(now = new Date()) {
  return getDb().accountLockout.deleteMany({
    where: {
      lockedUntil: {
        not: null,
        lt: now,
      },
    },
  });
}

export function deleteOldLockoutAuditLogs(cutoff: Date) {
  return getDb().lockoutAuditLog.deleteMany({
    where: {
      createdAt: {
        lt: cutoff,
      },
    },
  });
}

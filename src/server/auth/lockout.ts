import 'server-only';

import { ApiError } from '@/server/http';
import {
  findLockoutByUserId,
  resetLockout,
} from '@/server/repositories/lockouts';
import { logger } from '@/server/logger';

const attemptResetWindowMs = 24 * 60 * 60 * 1000;

function remainingSeconds(until: Date, now: Date) {
  return Math.max(1, Math.ceil((until.getTime() - now.getTime()) / 1000));
}

export async function assertUserNotLocked(userId: string) {
  const lockout = await findLockoutByUserId(userId);

  if (!lockout) return;

  const now = new Date();

  if (lockout.lockedUntil && lockout.lockedUntil > now) {
    const remaining = remainingSeconds(lockout.lockedUntil, now);

    logger.warn(
      {
        userId,
        remainingLockSeconds: remaining,
        lockedReason: lockout.lockedReason,
      },
      'Openfort exchange attempt blocked by account lockout'
    );

    throw new ApiError(
      'TOO_MANY_REQUESTS',
      'Account locked. Try again later.',
      {
        detail: `remaining_lock_seconds=${remaining}`,
      }
    );
  }

  if (
    lockout.lockedUntil ||
    lockout.failedAttempts > 0 ||
    now.getTime() - lockout.lastFailedAttemptAt.getTime() > attemptResetWindowMs
  ) {
    await resetLockout(userId).catch((error) => {
      logger.warn({ err: error, userId }, 'Failed to reset stale lockout');
    });
  }
}

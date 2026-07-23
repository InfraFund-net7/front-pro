import 'server-only';

import {
  deleteExpiredLockouts,
  deleteOldLockoutAuditLogs,
} from '@/server/repositories/lockouts';
import { deleteOldSessions } from '@/server/repositories/sessions';

const retentionMs = 90 * 24 * 60 * 60 * 1000;

export async function runCleanupJobs(now = new Date()) {
  const cutoff = new Date(now.getTime() - retentionMs);
  const [expiredLockouts, oldLockoutAuditLogs, oldSessions] = await Promise.all(
    [
      deleteExpiredLockouts(now),
      deleteOldLockoutAuditLogs(cutoff),
      deleteOldSessions(cutoff),
    ]
  );

  return {
    expired_lockouts: expiredLockouts.count,
    old_lockout_audit_logs: oldLockoutAuditLogs.count,
    old_sessions: oldSessions.count,
  };
}

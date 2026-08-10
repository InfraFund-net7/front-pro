import 'server-only';

import { deleteOldSessions } from '@/server/repositories/sessions';

const retentionMs = 90 * 24 * 60 * 60 * 1000;

export async function runCleanupJobs(now = new Date()) {
  const cutoff = new Date(now.getTime() - retentionMs);
  const oldSessions = await deleteOldSessions(cutoff);

  return {
    old_sessions: oldSessions.count,
  };
}

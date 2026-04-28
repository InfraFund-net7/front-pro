import 'server-only';

import type { RequestMetadata } from '@/server/http';
import { getDb } from '@/server/db';

interface CreateSessionRecord {
  userId: string;
  refreshTokenHash: Uint8Array<ArrayBuffer>;
  metadata: RequestMetadata;
  activityTimeoutAt: Date;
  absoluteExpiresAt: Date;
}

export function createSession(record: CreateSessionRecord) {
  const now = new Date();

  return getDb().session.create({
    data: {
      userId: record.userId,
      refreshTokenHash: record.refreshTokenHash,
      userAgent: record.metadata.userAgent,
      ipAddress: record.metadata.ipAddress,
      platform: record.metadata.platform,
      browser: record.metadata.browser,
      device: record.metadata.device,
      createdAt: now,
      lastActivityAt: now,
      activityTimeoutAt: record.activityTimeoutAt,
      absoluteExpiresAt: record.absoluteExpiresAt,
    },
  });
}

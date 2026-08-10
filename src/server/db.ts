import 'server-only';

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

import { requireServerEnv } from '@/server/env';

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

let prisma = globalForPrisma.prisma;

function createPrismaClient() {
  const env = requireServerEnv(['database']);
  const adapter = new PrismaPg(env.database.url!);

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });
}

export function getDb() {
  prisma ??= createPrismaClient();

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
  }

  return prisma;
}

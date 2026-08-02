import { PrismaClient } from '@prisma/client';

/**
 * Single Prisma client over the standard Postgres driver. Works against a LOCAL
 * Postgres (postgresql://...@localhost:5432/orchardads) and against a hosted
 * Postgres / Neon pooled URL alike - no serverless adapter required.
 *
 * Immutable module-scope const (not mutable state), which the concurrency lint
 * rule (ARCHITECTURE.md sec 2.4) permits. Reused across hot-reloads in dev.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ log: process.env.PRISMA_LOG ? ['query', 'error'] : ['error'] });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export type { Prisma } from '@prisma/client';
export { PrismaClient } from '@prisma/client';

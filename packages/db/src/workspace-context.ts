import type { Platform, Role } from '@adsos/core';
import { Prisma } from '@prisma/client';
import { prisma } from './client';

/**
 * Every repository function takes a WorkspaceContext as its first argument.
 * There is no exported query that omits it. ARCHITECTURE.md sec 3.
 */
export type WorkspaceContext = {
  workspaceId: string;
  userId: string;
  role: Role;
};

/** A Prisma transaction client with the RLS session variable pinned. */
export type TxClient = Omit<
  typeof prisma,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

/**
 * Run `fn` inside a transaction that has `app.workspace_id` set for the
 * duration, so Postgres Row Level Security scopes every query to the tenant.
 * Belt-and-braces with the repository layer (ARCHITECTURE.md sec 3).
 */
export async function withWorkspace<T>(
  ctx: WorkspaceContext,
  fn: (tx: TxClient) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    // `true` = transaction-local; reset automatically at commit/rollback.
    await tx.$executeRaw(
      Prisma.sql`SELECT set_config('app.workspace_id', ${ctx.workspaceId}, true)`,
    );
    return fn(tx as unknown as TxClient);
  });
}

export type { Platform };

import type { Platform } from '@adsos/core';
import { prisma } from '../client';
import type { WorkspaceContext } from '../workspace-context';
import { withWorkspace } from '../workspace-context';

/** Config-sync planner reads which connections are due (ARCHITECTURE.md sec 4.2). */
export async function findDueForConfigSync(olderThanMinutes = 30) {
  const cutoff = new Date(Date.now() - olderThanMinutes * 60_000);
  return prisma.platformConnection.findMany({
    where: {
      status: 'ACTIVE',
      syncState: {
        some: { kind: 'CONFIG', OR: [{ lastSuccessAt: null }, { lastSuccessAt: { lt: cutoff } }] },
      },
    },
    select: { id: true, platform: true, workspaceId: true },
  });
}

export async function listConnections(ctx: WorkspaceContext) {
  return withWorkspace(ctx, (tx) =>
    tx.platformConnection.findMany({
      where: { workspaceId: ctx.workspaceId },
      include: { syncState: true, accounts: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'asc' },
    }),
  );
}

export async function getConnection(ctx: WorkspaceContext, platform: Platform) {
  return withWorkspace(ctx, (tx) =>
    tx.platformConnection.findUnique({
      where: { workspaceId_platform: { workspaceId: ctx.workspaceId, platform } },
    }),
  );
}

/** Atomically persist rotated tokens after a refresh (ARCHITECTURE.md sec 10.2). */
export async function updateTokens(
  ctx: WorkspaceContext,
  connectionId: string,
  tokens: {
    accessTokenCipher: Uint8Array<ArrayBuffer>;
    accessTokenIv: Uint8Array<ArrayBuffer>;
    accessTokenTag: Uint8Array<ArrayBuffer>;
    refreshTokenCipher?: Uint8Array<ArrayBuffer> | null;
    refreshTokenIv?: Uint8Array<ArrayBuffer> | null;
    refreshTokenTag?: Uint8Array<ArrayBuffer> | null;
    accessTokenExpires: Date;
  },
) {
  return withWorkspace(ctx, (tx) =>
    tx.platformConnection.update({ where: { id: connectionId }, data: { ...tokens, status: 'ACTIVE' } }),
  );
}

export async function markStatus(
  ctx: WorkspaceContext,
  connectionId: string,
  status: 'ACTIVE' | 'NEEDS_REAUTH' | 'SUSPENDED' | 'REVOKED',
  reason?: string,
) {
  return withWorkspace(ctx, (tx) =>
    tx.platformConnection.update({ where: { id: connectionId }, data: { status, statusReason: reason } }),
  );
}

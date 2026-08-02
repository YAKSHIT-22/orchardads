import 'server-only';
import type { Platform } from '@adsos/core';
import { type WorkspaceContext, prisma, withWorkspace } from '@adsos/db';
import type { Tokens } from './oauth/config';
import { getWorkspaceContext, setWorkspaceSession } from './session';
import { encryptToken } from './token';

/** Resolve the current workspace or bootstrap a first-run one (partial Task 8). */
export async function ensureWorkspace(): Promise<WorkspaceContext> {
  const existing = await getWorkspaceContext();
  if (existing) return existing;

  const email = process.env.BOOTSTRAP_EMAIL ?? 'owner@localhost';
  const org = await prisma.organization.create({ data: { name: 'My Organization' } });
  const workspace = await prisma.workspace.create({
    data: { organizationId: org.id, name: 'Default', slug: `ws-${org.id.slice(0, 8)}` },
  });
  const user = await prisma.user.upsert({ where: { email }, update: {}, create: { email, name: 'Owner' } });
  const ctx: WorkspaceContext = { workspaceId: workspace.id, userId: user.id, role: 'OWNER' };
  await withWorkspace(ctx, (tx) =>
    tx.member.create({ data: { workspaceId: workspace.id, userId: user.id, role: 'OWNER' } }),
  );
  await setWorkspaceSession(ctx);
  return ctx;
}

/** Persist an encrypted platform connection (works for any platform). */
export async function saveConnection(
  ctx: WorkspaceContext,
  platform: Platform,
  scopes: string[],
  apiVersion: string,
  tokens: Tokens,
): Promise<void> {
  const a = encryptToken(tokens.accessToken);
  const r = tokens.refreshToken ? encryptToken(tokens.refreshToken) : null;
  const expires = new Date(Date.now() + tokens.expiresIn * 1000);
  await withWorkspace(ctx, (tx) =>
    tx.platformConnection.upsert({
      where: { workspaceId_platform: { workspaceId: ctx.workspaceId, platform } },
      create: {
        workspaceId: ctx.workspaceId,
        platform,
        accessTokenCipher: a.cipher,
        accessTokenIv: a.iv,
        accessTokenTag: a.tag,
        refreshTokenCipher: r?.cipher ?? null,
        refreshTokenIv: r?.iv ?? null,
        refreshTokenTag: r?.tag ?? null,
        accessTokenExpires: expires,
        apiVersion,
        scopes,
        status: 'ACTIVE',
      },
      update: {
        accessTokenCipher: a.cipher,
        accessTokenIv: a.iv,
        accessTokenTag: a.tag,
        refreshTokenCipher: r?.cipher ?? undefined,
        refreshTokenIv: r?.iv ?? undefined,
        refreshTokenTag: r?.tag ?? undefined,
        accessTokenExpires: expires,
        apiVersion,
        scopes,
        status: 'ACTIVE',
      },
    }),
  );
}

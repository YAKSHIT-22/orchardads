'use server';

import type { Platform } from '@adsos/core';
import { repositories } from '@adsos/db';
import { z } from 'zod';
import { getAdapter } from '../adapters';
import { authedAction } from '../safe-action';

const platformSchema = z.object({ platform: z.enum(['TIKTOK']) });

/** Load the ad accounts available on a connected login (hand-pick step). */
export const listPlatformAccounts = authedAction.inputSchema(platformSchema).action(async ({ parsedInput, ctx }) => {
  const platform = parsedInput.platform as Platform;
  const conn = await repositories.connections.getConnection(ctx.workspace, platform);
  if (!conn) return { connected: false as const, accounts: [] };
  const adapter = getAdapter(platform, ctx.workspace);
  const accounts = await adapter.listAccounts(conn.id);
  return {
    connected: true as const,
    accounts: accounts.map((a) => ({
      externalId: a.externalId,
      name: a.name,
      currency: a.currency,
      timezone: a.timezone,
    })),
  };
});

const saveSchema = z.object({
  platform: z.enum(['TIKTOK']),
  accounts: z
    .array(z.object({ externalId: z.string(), name: z.string(), currency: z.string(), timezone: z.string() }))
    .min(1),
});

/** Persist the picked accounts for a platform. */
export const saveSelectedAccounts = authedAction.inputSchema(saveSchema).action(async ({ parsedInput, ctx }) => {
  const platform = parsedInput.platform as Platform;
  const conn = await repositories.connections.getConnection(ctx.workspace, platform);
  if (!conn) return { ok: false as const, error: 'Connection not found.' };
  const count = await repositories.sync.upsertAccounts(ctx.workspace, platform, conn.id, parsedInput.accounts);
  return { ok: true as const, count };
});

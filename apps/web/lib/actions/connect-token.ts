'use server';

import { repositories } from '@adsos/db';
import { z } from 'zod';
import { ensureWorkspace, saveConnection } from '../bootstrap';
import { actionClient } from '../safe-action';

const LONG_LIVED = 60 * 60 * 24 * 365;

const schema = z.object({
  accessToken: z.string().min(8),
  advertiserId: z.string().min(1),
  advertiserName: z.string().optional(),
  currency: z.string().optional(),
});

/**
 * Connect a TikTok sandbox (or long-lived) access token directly, bypassing OAuth.
 * TikTok's sandbox hands you an access_token + advertiser_id in the developer
 * portal - this is the fastest path to run the full loop with real sandbox data,
 * with no redirect URI, https, or public URLs required.
 */
export const connectWithToken = actionClient.inputSchema(schema).action(async ({ parsedInput }) => {
  const ctx = await ensureWorkspace();
  await saveConnection(ctx, 'TIKTOK', ['ads.management', 'ads.reporting'], 'v1.3', {
    accessToken: parsedInput.accessToken.trim(),
    refreshToken: null,
    expiresIn: LONG_LIVED,
  });
  const conn = await repositories.connections.getConnection(ctx, 'TIKTOK');
  if (conn) {
    await repositories.sync.upsertAccounts(ctx, 'TIKTOK', conn.id, [
      {
        externalId: parsedInput.advertiserId.trim(),
        name: parsedInput.advertiserName?.trim() || `Advertiser ${parsedInput.advertiserId.trim()}`,
        currency: parsedInput.currency?.trim() || 'USD',
        timezone: 'UTC',
      },
    ]);
  }
  return { ok: true as const };
});

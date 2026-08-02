'use server';

import type { Platform } from '@adsos/core';
import { repositories } from '@adsos/db';
import { breakdownHash } from '@adsos/metrics';
import { z } from 'zod';
import { getAdapter } from '../adapters';
import { deterministicUuid } from '../data/uuid';
import { throttle } from '../rate-limit';
import { redis } from '../redis';
import { authedAction } from '../safe-action';

const WINDOW_DAYS = 30;
const PROXY_CACHE_TTL = 900; // 15 min - Pinterest storage rule: short-lived only

const schema = z.object({ platform: z.enum(['TIKTOK']) });

/**
 * Generic platform sync: accounts -> campaigns -> ad groups -> ads -> report facts.
 * The adapter interface is uniform, so one implementation serves every platform.
 * PERSIST platforms store entities in the normalized store; PROXY_ONLY platforms
 * (Pinterest) persist ONLY metric_fact analytics and cache entities briefly in Redis
 * (ARCHITECTURE.md sec 5.4). Hobby-friendly: one invocation stays under 60s.
 */
export const syncPlatform = authedAction.inputSchema(schema).action(async ({ parsedInput, ctx }) => {
  const platform = parsedInput.platform as Platform;
  const wsCtx = ctx.workspace;
  const conn = await repositories.connections.getConnection(wsCtx, platform);
  if (!conn) return { ok: false as const, error: `No ${platform} connection.` };
  if (conn.status !== 'ACTIVE') return { ok: false as const, error: `${platform} connection needs re-authorization.` };

  const accounts = await repositories.sync.listAccountRecords(wsCtx, platform);
  if (accounts.length === 0) return { ok: false as const, error: 'No ad accounts selected. Finish onboarding first.' };

  const adapter = getAdapter(platform, wsCtx);
  const persistEntities = adapter.getRetentionPolicy('CAMPAIGN') === 'PERSIST';
  const sinceIso = new Date(Date.now() - WINDOW_DAYS * 86_400_000).toISOString();
  const sinceDate = sinceIso.slice(0, 10);
  const untilIso = new Date().toISOString();
  const bucket = `${platform}:${conn.id}`;

  let campaigns = 0;
  let adGroups = 0;
  let facts = 0;

  for (const acct of accounts) {
    const ext = acct.externalId;
    // externalId -> internal entity id for attaching metric facts.
    let externalToInternal = new Map<string, string>();

    if (persistEntities) {
      const campItems: Parameters<typeof repositories.sync.upsertCampaigns>[3] = [];
      let cursor: string | null = null;
      do {
        await throttle(bucket, 90, 60);
        const page = await adapter.syncCampaigns({ connectionId: conn.id, accountExternalId: ext, cursor });
        for (const c of page.rows)
          campItems.push({
            externalId: c.externalId,
            name: c.name,
            normalizedStatus: c.normalizedStatus,
            rawStatus: c.rawStatus,
            normalizedObjective: c.normalizedObjective,
            rawObjective: c.rawObjective,
            budgetMinor: c.budget?.amountMinor ?? null,
            budgetType: c.budgetType,
            currency: c.budget?.currency ?? acct.currency,
          });
        cursor = page.nextCursor;
      } while (cursor);
      const campMap = await repositories.sync.upsertCampaigns(wsCtx, acct.id, adapter.apiVersion, campItems);
      campaigns += campMap.size;

      const agItems: Parameters<typeof repositories.sync.upsertAdGroups>[3] = [];
      cursor = null;
      do {
        await throttle(bucket, 90, 60);
        const page = await adapter.syncAdGroups({ connectionId: conn.id, accountExternalId: ext, cursor });
        for (const g of page.rows)
          agItems.push({
            externalId: g.externalId,
            campaignExternalId: g.campaignExternalId,
            name: g.name,
            normalizedStatus: g.normalizedStatus,
            rawStatus: g.rawStatus,
            budgetMinor: g.budget?.amountMinor ?? null,
            budgetType: g.budgetType,
            bidMinor: g.bid?.amountMinor ?? null,
            bidStrategy: g.bidStrategy,
            conversionPixelId: g.conversionSourceExternalId,
            targeting: g.targeting,
            currency: g.budget?.currency ?? acct.currency,
          });
        cursor = page.nextCursor;
      } while (cursor);
      const agMap = await repositories.sync.upsertAdGroups(wsCtx, campMap, adapter.apiVersion, agItems);
      adGroups += agMap.size;

      const adItems: Parameters<typeof repositories.sync.upsertAds>[3] = [];
      cursor = null;
      do {
        await throttle(bucket, 90, 60);
        const page = await adapter.syncAds({ connectionId: conn.id, accountExternalId: ext, cursor });
        for (const ad of page.rows)
          adItems.push({
            externalId: ad.externalId,
            adGroupExternalId: ad.adGroupExternalId,
            name: ad.name,
            normalizedStatus: ad.normalizedStatus,
            rawStatus: ad.rawStatus,
          });
        cursor = page.nextCursor;
      } while (cursor);
      await repositories.sync.upsertAds(wsCtx, agMap, adapter.apiVersion, adItems);

      externalToInternal = await repositories.sync.adGroupIdMap(wsCtx, acct.id);
    } else {
      // PROXY_ONLY (Pinterest): do NOT persist entities. Fetch ad groups live and
      // cache {name,budget} in Redis (short TTL) for the engine; metric_fact uses a
      // deterministic id derived from the external id.
      const proxy: Record<string, { name: string; externalId: string; budgetMinor: string | null; budgetType: string | null }> = {};
      let cursor: string | null = null;
      do {
        await throttle(bucket, 90, 60);
        const page = await adapter.syncAdGroups({ connectionId: conn.id, accountExternalId: ext, cursor });
        for (const g of page.rows) {
          const internal = deterministicUuid(wsCtx.workspaceId, platform, g.externalId);
          externalToInternal.set(g.externalId, internal);
          proxy[internal] = {
            name: g.name,
            externalId: g.externalId,
            budgetMinor: g.budget?.amountMinor != null ? g.budget.amountMinor.toString() : null,
            budgetType: g.budgetType,
          };
          adGroups++;
        }
        cursor = page.nextCursor;
      } while (cursor);
      await redis.set(`proxy:${platform}:${acct.id}`, JSON.stringify(proxy), PROXY_CACHE_TTL);
    }

    await throttle(bucket, 90, 60);
    const report = await adapter.fetchReport({
      connectionId: conn.id,
      accountExternalId: ext,
      entityType: 'AD_GROUP',
      grain: 'DAY',
      since: sinceIso,
      until: untilIso,
      cursor: null,
    });
    const factRows = report.rows
      .map((m) => {
        const entityId = externalToInternal.get(m.entityExternalId);
        if (!entityId) return null;
        return {
          platform,
          accountId: acct.id,
          entityType: 'AD_GROUP',
          entityId,
          grain: 'DAY' as const,
          bucketAt: m.bucketAt,
          breakdownHash: breakdownHash(m.breakdown),
          breakdown: m.breakdown,
          schemaVersion: m.schemaVersion,
          impressions: m.impressions,
          clicks: m.clicks,
          spendMinor: m.spend.amountMinor,
          currency: m.spend.currency,
          conversions: m.conversions,
          convValueMinor: m.convValue.amountMinor,
          native: m.native,
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);
    facts += await repositories.metrics.upsertMetricFacts(wsCtx, factRows);

    await repositories.metrics.refreshRollups(wsCtx, acct.id, sinceDate);
    await repositories.sync.markAccountSynced(wsCtx, acct.id);
  }

  return { ok: true as const, campaigns, adGroups, facts };
});

import type { TrackingHealth } from '@adsos/core';
import type { MetricRow } from '@adsos/metrics';
import { Prisma } from '@prisma/client';
import { prisma } from '../client';
import type { WorkspaceContext } from '../workspace-context';
import { withWorkspace } from '../workspace-context';

export type MetricFactInput = {
  platform: string;
  accountId: string;
  entityType: string;
  entityId: string;
  grain: 'HOUR' | 'DAY';
  bucketAt: string;
  breakdownHash: string;
  breakdown: Record<string, string> | null;
  schemaVersion: number;
  impressions: bigint;
  clicks: bigint;
  spendMinor: bigint;
  currency: string;
  conversions: bigint;
  convValueMinor: bigint;
  native?: Record<string, number>;
};

/** Upsert metric facts. The PK is the idempotency key: re-syncing is a no-op. */
export async function upsertMetricFacts(ctx: WorkspaceContext, rows: MetricFactInput[]): Promise<number> {
  if (rows.length === 0) return 0;
  return withWorkspace(ctx, async (tx) => {
    let n = 0;
    for (const r of rows) {
      await tx.$executeRaw(Prisma.sql`
        INSERT INTO metric_fact (
          workspace_id, platform, account_id, entity_type, entity_id, grain, bucket_at,
          breakdown_hash, breakdown, schema_version, impressions, clicks, spend_minor,
          currency, conversions, conv_value_minor, native
        ) VALUES (
          ${ctx.workspaceId}::uuid, ${r.platform}, ${r.accountId}::uuid, ${r.entityType}, ${r.entityId}::uuid,
          ${r.grain}, ${r.bucketAt}::timestamptz, ${r.breakdownHash}, ${JSON.stringify(r.breakdown ?? null)}::jsonb,
          ${r.schemaVersion}, ${r.impressions}, ${r.clicks}, ${r.spendMinor}, ${r.currency},
          ${r.conversions}, ${r.convValueMinor}, ${JSON.stringify(r.native ?? {})}::jsonb
        )
        ON CONFLICT (workspace_id, platform, entity_id, grain, bucket_at, breakdown_hash, schema_version)
        DO UPDATE SET impressions = EXCLUDED.impressions, clicks = EXCLUDED.clicks,
          spend_minor = EXCLUDED.spend_minor, conversions = EXCLUDED.conversions,
          conv_value_minor = EXCLUDED.conv_value_minor, native = EXCLUDED.native
      `);
      n++;
    }
    return n;
  });
}

type FactRow = {
  platform: string;
  entity_id: string;
  entity_type: string;
  bucket_at: Date;
  impressions: bigint;
  clicks: bigint;
  spend_minor: bigint;
  conversions: bigint;
  conv_value_minor: bigint;
  currency: string;
};

/** Load DAY-grain metric rows for an account over a trailing window. */
export async function loadAccountMetricRows(
  ctx: WorkspaceContext,
  accountId: string,
  sinceIso: string,
): Promise<MetricRow[]> {
  return withWorkspace(ctx, async (tx) => {
    const rows = await tx.$queryRaw<FactRow[]>(Prisma.sql`
      SELECT platform, entity_id, entity_type, bucket_at, impressions, clicks, spend_minor,
             conversions, conv_value_minor, currency
      FROM metric_fact
      WHERE workspace_id = ${ctx.workspaceId}::uuid AND account_id = ${accountId}::uuid
        AND grain = 'DAY' AND bucket_at >= ${sinceIso}::timestamptz
      ORDER BY entity_id, bucket_at ASC
    `);
    return rows.map((r) => ({
      platform: r.platform as MetricRow['platform'],
      entityType: r.entity_type as MetricRow['entityType'],
      entityId: r.entity_id,
      grain: 'DAY' as const,
      bucketAt: r.bucket_at.toISOString(),
      impressions: r.impressions,
      clicks: r.clicks,
      spendMinor: r.spend_minor,
      conversions: r.conversions,
      convValueMinor: r.conv_value_minor,
      currency: r.currency,
    }));
  });
}

/** Refresh the pre-rolled daily aggregate after a metric sync (ARCHITECTURE.md sec 5.3). */
export async function refreshRollups(ctx: WorkspaceContext, accountId: string, sinceDate: string): Promise<void> {
  await withWorkspace(ctx, (tx) =>
    tx.$executeRaw(
      Prisma.sql`SELECT refresh_metric_rollup_daily(${ctx.workspaceId}::uuid, ${accountId}::uuid, ${sinceDate}::date)`,
    ),
  );
}

export async function accountTrackingHealth(
  ctx: WorkspaceContext,
  platform: string,
): Promise<TrackingHealth> {
  return withWorkspace(ctx, async (tx) => {
    const sources = await tx.conversionSource.findMany({
      where: { workspaceId: ctx.workspaceId, platform: platform as 'TIKTOK' },
      select: { health: true },
    });
    if (sources.length === 0) return 'UNKNOWN';
    if (sources.some((s) => s.health === 'BROKEN')) return 'BROKEN';
    if (sources.some((s) => s.health === 'DEGRADED')) return 'DEGRADED';
    return 'HEALTHY';
  });
}

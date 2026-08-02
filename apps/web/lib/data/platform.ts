import 'server-only';
import { type Platform, formatMoney } from '@adsos/core';
import { type WorkspaceContext, repositories } from '@adsos/db';
import { type EntityMetrics, type MetricRow, aggregate, cpaMinor, ctr, cvr } from '@adsos/metrics';
import { type AccountContext, type EntityBudget, runRecommendations } from '@adsos/recommendations';
import { retentionFor } from '@adsos/platform-core';
import { type LedgerRec, draftToLedger } from './ledger';
import { redis } from '../redis';

export type Kpi = {
  label: string;
  value: string;
  delta?: { value: string; direction: 'up' | 'down' | 'flat'; desirable: boolean };
  sub?: string;
};

export type PlatformDashboard = {
  platform: Platform;
  connected: boolean;
  kpis: Kpi[];
  recs: LedgerRec[];
  trackingHealth: 'HEALTHY' | 'DEGRADED' | 'BROKEN' | 'UNKNOWN';
};

const WINDOW_DAYS = 30;

type ProxyEntry = { name: string; externalId: string; budgetMinor: string | null; budgetType: string | null };

function groupByEntity(rows: MetricRow[], names: Map<string, string>, platform: Platform): EntityMetrics[] {
  const byId = new Map<string, MetricRow[]>();
  for (const r of rows) {
    const list = byId.get(r.entityId) ?? [];
    list.push(r);
    byId.set(r.entityId, list);
  }
  const out: EntityMetrics[] = [];
  for (const [entityId, list] of byId) {
    const first = list[0];
    if (!first) continue;
    out.push({
      platform,
      entityType: first.entityType,
      entityId,
      entityName: names.get(entityId) ?? entityId,
      totals: aggregate(list),
      daily: list,
    });
  }
  return out;
}

function halfDelta(
  rows: MetricRow[],
  metric: (t: ReturnType<typeof aggregate>) => number | null,
  lowerIsBetter: boolean,
): Kpi['delta'] {
  const days = [...new Set(rows.map((r) => r.bucketAt.slice(0, 10)))].sort();
  if (days.length < 4) return undefined;
  const mid = days[Math.floor(days.length / 2)] as string;
  const a = metric(aggregate(rows.filter((r) => r.bucketAt.slice(0, 10) < mid)));
  const b = metric(aggregate(rows.filter((r) => r.bucketAt.slice(0, 10) >= mid)));
  if (a == null || b == null || a === 0) return undefined;
  const pct = ((b - a) / a) * 100;
  const direction = Math.abs(pct) < 1 ? 'flat' : pct > 0 ? 'up' : 'down';
  const rising = direction === 'up';
  return { value: `${Math.abs(pct).toFixed(1)}%`, direction, desirable: lowerIsBetter ? !rising : rising };
}

/** Build the normalized AccountContext for a platform from the synced store.
 *  Returns null when nothing is connected. Shared by the dashboard and the
 *  per-tool data provider so every tool reads the same numbers. */
export async function loadAccountContext(
  platform: Platform,
  ctx: WorkspaceContext,
): Promise<{ accountContext: AccountContext; externalIds: Map<string, string> } | null> {
  const accounts = await repositories.sync.listAccountRecords(ctx, platform);
  if (accounts.length === 0) return null;

  const persist = retentionFor(platform, 'CAMPAIGN') === 'PERSIST';
  const since = new Date(Date.now() - WINDOW_DAYS * 86_400_000).toISOString();

  const allRows: MetricRow[] = [];
  const names = new Map<string, string>();
  const externalIds = new Map<string, string>();
  const budgetMap = new Map<string, EntityBudget>();

  for (const acct of accounts) {
    const rows = await repositories.metrics.loadAccountMetricRows(ctx, acct.id, since);
    allRows.push(...rows);

    if (persist) {
      const budgets = await repositories.sync.loadBudgets(ctx, acct.id);
      for (const [id, b] of budgets) {
        names.set(id, b.name);
        externalIds.set(id, b.externalId);
        budgetMap.set(id, { entityId: id, dailyBudgetMinor: b.dailyBudgetMinor, budgetType: b.budgetType });
      }
    } else {
      const cached = await redis.get(`proxy:${platform}:${acct.id}`);
      const proxy = cached ? (JSON.parse(cached) as Record<string, ProxyEntry>) : {};
      for (const [id, e] of Object.entries(proxy)) {
        names.set(id, e.name);
        externalIds.set(id, e.externalId);
        budgetMap.set(id, {
          entityId: id,
          dailyBudgetMinor: e.budgetMinor != null ? BigInt(e.budgetMinor) : null,
          budgetType: (e.budgetType as 'DAILY' | 'LIFETIME' | null) ?? null,
        });
      }
    }
  }

  const trackingHealth = await repositories.metrics.accountTrackingHealth(ctx, platform);
  const missing = platform === 'TIKTOK'
    ? (await Promise.all(accounts.map((a) => repositories.sync.missingPixelAdGroupIds(ctx, a.id)))).flat()
    : [];

  const accountContext: AccountContext = {
    platform,
    currency: allRows[0]?.currency ?? 'USD',
    entities: groupByEntity(allRows, names, platform),
    budgets: budgetMap,
    trackingHealth,
    missingPixelEntityIds: missing,
  };
  return { accountContext, externalIds };
}

/** One platform's dashboard: engine output over synced facts. */
export async function getPlatformDashboard(platform: Platform, ctx: WorkspaceContext): Promise<PlatformDashboard> {
  const loaded = await loadAccountContext(platform, ctx);
  if (!loaded) return { platform, connected: false, kpis: [], recs: [], trackingHealth: 'UNKNOWN' };
  const { accountContext, externalIds } = loaded;
  const trackingHealth = accountContext.trackingHealth;
  const allRows = accountContext.entities.flatMap((e) => e.daily);

  const recs = runRecommendations(accountContext).map((d) =>
    draftToLedger(d, { externalId: externalIds.get(d.entityId) ?? d.entityId }),
  );

  const total = aggregate(allRows);
  const currency = total.currency;
  const kpis: Kpi[] = [
    { label: `Spend (${WINDOW_DAYS} d)`, value: formatMoney({ amountMinor: total.spendMinor, currency }), delta: halfDelta(allRows, (t) => Number(t.spendMinor), false) },
    { label: 'CPA', value: cpaMinor(total) != null ? formatMoney({ amountMinor: BigInt(Math.round(cpaMinor(total) as number)), currency }) : '-', delta: halfDelta(allRows, cpaMinor, true), sub: 'lower is better' },
    { label: 'CTR', value: `${(ctr(total) * 100).toFixed(2)}%`, delta: halfDelta(allRows, (t) => ctr(t), true) },
    { label: 'CVR', value: `${(cvr(total) * 100).toFixed(2)}%`, delta: halfDelta(allRows, (t) => cvr(t), true) },
  ];

  return { platform, connected: true, kpis, recs, trackingHealth };
}

export type WorkspaceDashboard = {
  anyConnected: boolean;
  connectedPlatforms: Platform[];
  platforms: PlatformDashboard[];
  recs: LedgerRec[];
};

/** The cross-platform Morning Brief: every connected platform merged, ranked. */
export async function getWorkspaceDashboard(ctx: WorkspaceContext): Promise<WorkspaceDashboard> {
  const conns = await repositories.connections.listConnections(ctx);
  const active = conns.filter((c) => c.status === 'ACTIVE' && c.accounts.length > 0);
  const platforms: PlatformDashboard[] = [];
  for (const c of active) {
    const d = await getPlatformDashboard(c.platform, ctx);
    if (d.connected) platforms.push(d);
  }
  const recs = platforms.flatMap((p) => p.recs).sort((a, b) => b.urgency - a.urgency);
  return {
    anyConnected: platforms.length > 0,
    connectedPlatforms: platforms.map((p) => p.platform),
    platforms,
    recs,
  };
}

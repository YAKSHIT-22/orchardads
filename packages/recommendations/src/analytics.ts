import { formatMoney } from '@adsos/core';
import { type EntityMetrics, aggregate, avgDailySpendMinor, cpaMinor, ctr, cvr, roas } from '@adsos/metrics';
import type { AccountContext } from './types';

/** A computed metric row for an entity, ready for a tool table. */
export type EntityRowStat = {
  entityId: string;
  entityName: string;
  impressions: number;
  clicks: number;
  spend: number; // minor units
  conversions: number;
  cpa: number | null; // minor units
  cpc: number | null; // minor units
  ctr: number; // 0..1
  cvr: number; // 0..1
  roas: number | null;
  avgDailySpend: number; // minor units
};

export function entityRowStats(ctx: AccountContext): EntityRowStat[] {
  return ctx.entities.map((e) => {
    const t = e.totals;
    return {
      entityId: e.entityId,
      entityName: e.entityName,
      impressions: Number(t.impressions),
      clicks: Number(t.clicks),
      spend: Number(t.spendMinor),
      conversions: Number(t.conversions),
      cpa: cpaMinor(t),
      cpc: t.clicks > 0n ? Number(t.spendMinor) / Number(t.clicks) : null,
      ctr: ctr(t),
      cvr: cvr(t),
      roas: roas(t),
      avgDailySpend: avgDailySpendMinor(t),
    };
  });
}

/** Account-level rollup for headline stat tiles. */
export type AccountTotals = {
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  cpa: number | null;
  ctr: number;
  cvr: number;
  roas: number | null;
  currency: string;
  entityCount: number;
};

export function accountTotals(ctx: AccountContext): AccountTotals {
  const all = ctx.entities.flatMap((e) => e.daily);
  const t = aggregate(all);
  return {
    spend: Number(t.spendMinor),
    impressions: Number(t.impressions),
    clicks: Number(t.clicks),
    conversions: Number(t.conversions),
    cpa: cpaMinor(t),
    ctr: ctr(t),
    cvr: cvr(t),
    roas: roas(t),
    currency: t.currency,
    entityCount: ctx.entities.length,
  };
}

function median(nums: number[]): number | null {
  if (nums.length === 0) return null;
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? (s[m] as number) : ((s[m - 1] as number) + (s[m] as number)) / 2;
}

/** First-vs-second-half change of a chosen metric across the daily window. */
export function halfChange(e: EntityMetrics, pick: (r: ReturnType<typeof aggregate>) => number | null): number | null {
  const days = [...new Set(e.daily.map((r) => r.bucketAt.slice(0, 10)))].sort();
  if (days.length < 4) return null;
  const mid = days[Math.floor(days.length / 2)] as string;
  const a = pick(aggregate(e.daily.filter((r) => r.bucketAt.slice(0, 10) < mid)));
  const b = pick(aggregate(e.daily.filter((r) => r.bucketAt.slice(0, 10) >= mid)));
  if (a == null || b == null || a === 0) return null;
  return ((b - a) / a) * 100;
}

/** Composite 0-100 account health score from spend/delivery/tracking/structure. */
export function healthScore(ctx: AccountContext): { score: number; factors: { label: string; points: number; note: string }[] } {
  const factors: { label: string; points: number; note: string }[] = [];
  const totals = accountTotals(ctx);

  // Tracking (30)
  const trackPts = ctx.trackingHealth === 'HEALTHY' ? 30 : ctx.trackingHealth === 'DEGRADED' ? 12 : 0;
  factors.push({ label: 'Conversion tracking', points: trackPts, note: ctx.trackingHealth.toLowerCase() });

  // Waste (25): share of spend on zero-conversion entities
  const wasteSpend = ctx.entities.filter((e) => e.totals.conversions === 0n).reduce((s, e) => s + Number(e.totals.spendMinor), 0);
  const wasteShare = totals.spend > 0 ? wasteSpend / totals.spend : 0;
  factors.push({ label: 'Spend efficiency', points: Math.round(25 * (1 - wasteShare)), note: `${Math.round(wasteShare * 100)}% on zero-conversion` });

  // CPA consistency (25): lower variance = better
  const cpas = entityRowStats(ctx).map((r) => r.cpa).filter((c): c is number => c != null);
  const med = median(cpas);
  const spread = med && cpas.length ? cpas.filter((c) => c > med * 2).length / cpas.length : 0;
  factors.push({ label: 'CPA consistency', points: Math.round(25 * (1 - spread)), note: cpas.length ? `${Math.round(spread * 100)}% far above median` : 'no conversions yet' });

  // Structure (20): penalize very low-volume fragmentation
  const lowVol = ctx.entities.filter((e) => e.totals.impressions < 1000n).length;
  const fragShare = ctx.entities.length ? lowVol / ctx.entities.length : 0;
  factors.push({ label: 'Account structure', points: Math.round(20 * (1 - fragShare)), note: `${lowVol} low-volume ad groups` });

  const score = factors.reduce((s, f) => s + f.points, 0);
  return { score: Math.max(0, Math.min(100, score)), factors };
}

/** Format a minor-units amount for display in a given currency. */
export function money(minor: number, currency: string): string {
  return formatMoney({ amountMinor: BigInt(Math.round(minor)), currency });
}

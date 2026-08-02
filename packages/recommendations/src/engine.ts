import { formatMoney } from '@adsos/core';
import { aggregate, avgDailySpendMinor, cpaMinor, ctr } from '@adsos/metrics';
import type { EntityMetrics } from '@adsos/metrics';
import {
  type AccountContext,
  DEFAULT_CONFIG,
  type EntityBudget,
  type RecConfig,
  type RecommendationDraft,
} from './types';

const money = (minor: number | bigint, currency: string) =>
  formatMoney({ amountMinor: BigInt(Math.round(Number(minor))), currency });

const pct = (n: number) => `${(n * 100).toFixed(2)}%`;

function median(nums: number[]): number | null {
  if (nums.length === 0) return null;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? (s[mid] as number) : ((s[mid - 1] as number) + (s[mid] as number)) / 2;
}

/** Is the entity spending at (near) its daily budget ceiling? */
function isCapped(e: EntityMetrics, budget: EntityBudget | undefined, cfg: RecConfig): boolean {
  if (!budget?.dailyBudgetMinor || budget.budgetType !== 'DAILY') return false;
  const avg = avgDailySpendMinor(e.totals);
  return avg / Number(budget.dailyBudgetMinor) >= cfg.capUtilization;
}

/** First-half vs second-half CTR change over the daily series. */
function ctrTrend(e: EntityMetrics): { first: number; second: number; dropPct: number } | null {
  const days = e.daily.filter((r) => r.grain === 'DAY');
  if (days.length < 6) return null;
  const mid = Math.floor(days.length / 2);
  const first = ctr(aggregate(days.slice(0, mid)));
  const second = ctr(aggregate(days.slice(mid)));
  if (first === 0) return null;
  return { first, second, dropPct: ((first - second) / first) * 100 };
}

function clampPct(p: number, cfg: RecConfig): number {
  return Math.max(-cfg.maxBudgetChangePct, Math.min(cfg.maxBudgetChangePct, p));
}

/**
 * The recommendation engine. Pure: metrics in, drafts out. All arithmetic here;
 * the AI only explains these drafts later (ARCHITECTURE.md sec 8, sec 12).
 */
export function runRecommendations(
  ctx: AccountContext,
  config: RecConfig = DEFAULT_CONFIG,
): RecommendationDraft[] {
  const out: RecommendationDraft[] = [];
  const cfg = config;

  // Account-median CPA over entities with enough conversions.
  const cpas = ctx.entities
    .map((e) => cpaMinor(e.totals))
    .filter((c): c is number => c != null);
  const medianCpa = median(cpas);

  //  Tracking fix - top priority, blocks conversion-optimizing actions. 
  const missing = new Set(ctx.missingPixelEntityIds ?? []);
  if (ctx.trackingHealth === 'BROKEN' || ctx.trackingHealth === 'DEGRADED' || missing.size > 0) {
    for (const e of ctx.entities) {
      if (missing.has(e.entityId)) {
        out.push({
          kind: 'TRACKING_FIX',
          platform: ctx.platform,
          entityType: e.entityType,
          entityId: e.entityId,
          entityName: e.entityName,
          diff: [{ field: 'conversion_pixel_id', from: 'missing', to: 'required' }],
          evidence: [
            'No conversion_pixel_id set (required on ad groups and CBO campaigns from 13 Jul 2026)',
            'Conversion-optimizing actions are blocked until this is fixed',
          ],
          confidence: 'HIGH',
          riskBand: 'HIGH',
          reversible: false,
          proposedAction: { kind: 'RENAME', payload: { note: 'set_conversion_pixel_id' } },
          urgency: 100,
        });
      }
    }
  }

  const trackingOk = ctx.trackingHealth === 'HEALTHY';

  for (const e of ctx.entities) {
    const t = e.totals;
    if (t.impressions < cfg.minImpressions || t.days < cfg.minDays) continue;
    const budget = ctx.budgets.get(e.entityId);
    const capped = isCapped(e, budget, cfg);
    const cpa = cpaMinor(t);

    //  Waste finder - spend, zero conversions. 
    if (t.conversions === 0n && t.spendMinor > 0n) {
      out.push({
        kind: 'WASTE',
        platform: ctx.platform,
        entityType: e.entityType,
        entityId: e.entityId,
        entityName: e.entityName,
        diff: [{ field: 'status', from: 'ACTIVE', to: 'PAUSED' }],
        evidence: [
          `${money(t.spendMinor, t.currency)} spent over ${t.days} d, 0 conversions`,
          `CTR ${pct(ctr(t))}`,
        ],
        confidence: 'HIGH',
        estimatedImpact: {
          metric: 'recovered_spend',
          deltaMin: Number(t.spendMinor),
          deltaMax: Number(t.spendMinor),
          unit: t.currency,
          basis: `zero-conversion window exceeds ${cfg.minImpressions} impressions and ${cfg.minDays} days`,
        },
        riskBand: 'LOW',
        reversible: true,
        proposedAction: { kind: 'PAUSE', payload: {} },
        urgency: 80,
      });
      continue;
    }

    // Below need CPA + healthy tracking to act.
    if (cpa == null || medianCpa == null || !trackingOk || t.conversions < cfg.minConversionsForCpa) {
      continue;
    }

    //  Underfunded winner - strong CPA + budget-capped => scale up. 
    if (cpa <= medianCpa * cfg.cpaWinnerFactor && capped && budget?.dailyBudgetMinor) {
      const changePct = clampPct(cfg.maxBudgetChangePct, cfg);
      const from = budget.dailyBudgetMinor;
      const to = BigInt(Math.round(Number(from) * (1 + changePct / 100)));
      out.push({
        kind: 'UNDERFUNDED_WINNER',
        platform: ctx.platform,
        entityType: e.entityType,
        entityId: e.entityId,
        entityName: e.entityName,
        diff: [{ field: 'daily_budget', from: money(from, t.currency), to: money(to, t.currency) }],
        evidence: [
          `CPA ${money(cpa, t.currency)} vs account median ${money(medianCpa, t.currency)}`,
          `Budget-capped: avg daily spend at ${pct(avgDailySpendMinor(t) / Number(from))} of budget`,
        ],
        confidence: 'MEDIUM',
        estimatedImpact: {
          metric: 'conversions_per_week',
          deltaMin: Math.round((Number(to - from) / Math.max(cpa, 1)) * 7 * 0.7),
          deltaMax: Math.round((Number(to - from) / Math.max(cpa, 1)) * 7),
          unit: 'conv/wk',
          basis: 'trailing CVR held constant',
        },
        riskBand: changePct <= 10 ? 'LOW' : 'MEDIUM',
        reversible: true,
        proposedAction: { kind: 'SET_BUDGET', payload: { dailyBudgetMinor: to.toString() } },
        urgency: 88,
      });
      continue;
    }

    //  Overspending loser - weak CPA + real spend => trim. 
    if (cpa >= medianCpa * cfg.cpaLoserFactor && budget?.dailyBudgetMinor) {
      const changePct = clampPct(-cfg.maxBudgetChangePct, cfg);
      const from = budget.dailyBudgetMinor;
      const to = BigInt(Math.round(Number(from) * (1 + changePct / 100)));
      out.push({
        kind: 'OVERSPENDING_LOSER',
        platform: ctx.platform,
        entityType: e.entityType,
        entityId: e.entityId,
        entityName: e.entityName,
        diff: [{ field: 'daily_budget', from: money(from, t.currency), to: money(to, t.currency) }],
        evidence: [
          `CPA ${money(cpa, t.currency)} is ${(cpa / medianCpa).toFixed(1)}x the account median`,
          `${money(t.spendMinor, t.currency)} spent over ${t.days} d, ${t.conversions} conv`,
        ],
        confidence: 'MEDIUM',
        estimatedImpact: {
          metric: 'saved_spend',
          deltaMin: Number(from - to),
          deltaMax: Number(from - to),
          unit: t.currency,
          basis: `budget cut of ${Math.abs(changePct)}% within the 25% guardrail`,
        },
        riskBand: 'MEDIUM',
        reversible: true,
        proposedAction: { kind: 'SET_BUDGET', payload: { dailyBudgetMinor: to.toString() } },
        urgency: 76,
      });
      continue;
    }

    //  Creative fatigue - CTR decay across the window. 
    const trend = ctrTrend(e);
    if (trend && trend.dropPct >= cfg.fatigueCtrDropPct) {
      out.push({
        kind: 'CREATIVE_FATIGUE',
        platform: ctx.platform,
        entityType: e.entityType,
        entityId: e.entityId,
        entityName: e.entityName,
        diff: [{ field: 'status', from: 'ACTIVE', to: 'PAUSED' }],
        evidence: [
          `CTR decayed ${trend.dropPct.toFixed(0)}% (${pct(trend.first)} -> ${pct(trend.second)})`,
          'Second-half of the window vs first-half',
        ],
        confidence: 'MEDIUM',
        estimatedImpact: {
          metric: 'cpa_protection',
          deltaMin: 0,
          deltaMax: 0,
          unit: 'refresh',
          basis: 'decay curve vs account fatigue threshold',
        },
        riskBand: 'LOW',
        reversible: true,
        proposedAction: { kind: 'PAUSE', payload: {} },
        urgency: 64,
      });
    }
  }

  return out.sort((a, b) => b.urgency - a.urgency);
}

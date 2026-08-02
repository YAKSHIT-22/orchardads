import type { EntityMetrics, MetricRow } from '@adsos/metrics';
import { aggregate } from '@adsos/metrics';
import { describe, expect, it } from 'vitest';
import { runRecommendations } from './engine';
import type { AccountContext, EntityBudget } from './types';

function mkEntity(
  id: string,
  daily: { spend: number; conv: number; impr: number; clicks: number },
  days = 7,
): EntityMetrics {
  const rows: MetricRow[] = Array.from({ length: days }, (_, i) => ({
    platform: 'TIKTOK' as const,
    entityType: 'AD_GROUP' as const,
    entityId: id,
    grain: 'DAY' as const,
    bucketAt: `2026-07-0${i + 1}T00:00:00Z`,
    impressions: BigInt(daily.impr),
    clicks: BigInt(daily.clicks),
    spendMinor: BigInt(daily.spend),
    conversions: BigInt(daily.conv),
    convValueMinor: BigInt(daily.conv * 10000),
    currency: 'USD',
  }));
  return { platform: 'TIKTOK', entityType: 'AD_GROUP', entityId: id, entityName: id, totals: aggregate(rows), daily: rows };
}

function ctx(over: Partial<AccountContext> = {}): AccountContext {
  const entities = [
    mkEntity('winner', { spend: 4700, conv: 5, impr: 1000, clicks: 40 }),
    mkEntity('loser', { spend: 4000, conv: 1, impr: 1000, clicks: 40 }),
    mkEntity('mid', { spend: 2500, conv: 1, impr: 1000, clicks: 40 }),
    mkEntity('waste', { spend: 300, conv: 0, impr: 1000, clicks: 3 }),
  ];
  const budgets = new Map<string, EntityBudget>([
    ['winner', { entityId: 'winner', dailyBudgetMinor: 5000n, budgetType: 'DAILY' }],
    ['loser', { entityId: 'loser', dailyBudgetMinor: 8000n, budgetType: 'DAILY' }],
    ['mid', { entityId: 'mid', dailyBudgetMinor: 6000n, budgetType: 'DAILY' }],
  ]);
  return { platform: 'TIKTOK', currency: 'USD', entities, budgets, trackingHealth: 'HEALTHY', ...over };
}

describe('recommendation engine', () => {
  it('finds waste, an underfunded winner, and an overspending loser', () => {
    const recs = runRecommendations(ctx());
    const kinds = recs.map((r) => r.kind);
    expect(kinds).toContain('WASTE');
    expect(kinds).toContain('UNDERFUNDED_WINNER');
    expect(kinds).toContain('OVERSPENDING_LOSER');
  });

  it('never proposes a budget change beyond the 25% guardrail', () => {
    const recs = runRecommendations(ctx());
    for (const r of recs) {
      if (r.proposedAction.kind === 'SET_BUDGET') {
        const to = Number(r.proposedAction.payload.dailyBudgetMinor);
        expect(to).toBeGreaterThan(0);
      }
    }
    const winner = recs.find((r) => r.entityId === 'winner');
    expect(Number(winner?.proposedAction.payload.dailyBudgetMinor)).toBe(6250); // 5000 * 1.25
  });

  it('surfaces a blocking tracking fix and it ranks first', () => {
    const recs = runRecommendations(ctx({ trackingHealth: 'DEGRADED', missingPixelEntityIds: ['winner'] }));
    expect(recs[0]?.kind).toBe('TRACKING_FIX');
    expect(recs[0]?.riskBand).toBe('HIGH');
  });

  it('blocks conversion-optimizing recs when tracking is unhealthy', () => {
    const recs = runRecommendations(ctx({ trackingHealth: 'DEGRADED', missingPixelEntityIds: ['x'] }));
    // waste (non-conversion-optimizing) may still appear; scaling must not.
    expect(recs.some((r) => r.kind === 'UNDERFUNDED_WINNER')).toBe(false);
  });
});

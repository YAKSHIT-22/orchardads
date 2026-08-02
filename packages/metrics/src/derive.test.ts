import { describe, expect, it } from 'vitest';
import { aggregate, avgDailySpendMinor, cpaMinor, ctr, cvr, roas } from './derive';
import { breakdownHash } from './idempotency';
import type { MetricRow } from './types';

const row = (over: Partial<MetricRow>): MetricRow => ({
  platform: 'TIKTOK',
  entityType: 'AD_GROUP',
  entityId: 'e1',
  grain: 'DAY',
  bucketAt: '2026-07-01T00:00:00Z',
  impressions: 0n,
  clicks: 0n,
  spendMinor: 0n,
  conversions: 0n,
  convValueMinor: 0n,
  currency: 'USD',
  ...over,
});

describe('metrics derive', () => {
  const rows = [
    row({ bucketAt: '2026-07-01T00:00:00Z', impressions: 1000n, clicks: 10n, spendMinor: 5000n, conversions: 2n, convValueMinor: 20000n }),
    row({ bucketAt: '2026-07-02T00:00:00Z', impressions: 1000n, clicks: 10n, spendMinor: 5000n, conversions: 3n, convValueMinor: 30000n }),
  ];
  const t = aggregate(rows);

  it('sums totals and counts distinct days', () => {
    expect(t.spendMinor).toBe(10000n);
    expect(t.conversions).toBe(5n);
    expect(t.days).toBe(2);
  });

  it('derives CPA, ROAS, CTR, CVR', () => {
    expect(cpaMinor(t)).toBe(2000); // 10000 / 5
    expect(roas(t)).toBe(5); // 50000 / 10000
    expect(ctr(t)).toBeCloseTo(0.01);
    expect(cvr(t)).toBeCloseTo(0.25); // 5 / 20
  });

  it('guards divide-by-zero', () => {
    expect(cpaMinor(aggregate([row({})]))).toBeNull();
    expect(roas(aggregate([row({})]))).toBeNull();
  });

  it('avg daily spend', () => {
    expect(avgDailySpendMinor(t)).toBe(5000);
  });

  it('breakdown hash is stable and order-independent', () => {
    expect(breakdownHash({ geo: 'US', device: 'ios' })).toBe(breakdownHash({ device: 'ios', geo: 'US' }));
    expect(breakdownHash(null)).toBe('');
  });
});

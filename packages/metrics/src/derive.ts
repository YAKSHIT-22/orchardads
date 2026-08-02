import type { MetricRow, Totals } from './types';

const EMPTY = (currency: string): Totals => ({
  impressions: 0n,
  clicks: 0n,
  spendMinor: 0n,
  conversions: 0n,
  convValueMinor: 0n,
  currency,
  days: 0,
});

/** Sum rows into window totals. Assumes one currency; caller groups by currency. */
export function aggregate(rows: MetricRow[]): Totals {
  const currency = rows[0]?.currency ?? 'USD';
  const days = new Set(rows.filter((r) => r.grain === 'DAY').map((r) => r.bucketAt.slice(0, 10)));
  const t = EMPTY(currency);
  for (const r of rows) {
    t.impressions += r.impressions;
    t.clicks += r.clicks;
    t.spendMinor += r.spendMinor;
    t.conversions += r.conversions;
    t.convValueMinor += r.convValueMinor;
  }
  t.days = days.size;
  return t;
}

//  Derived rates. All arithmetic here in TypeScript, never in the model (sec 8). 

/** Cost per acquisition, minor units. null when no conversions. */
export function cpaMinor(t: Totals): number | null {
  if (t.conversions === 0n) return null;
  return Number(t.spendMinor) / Number(t.conversions);
}

/** Return on ad spend as a ratio (conv value / spend). null when no spend. */
export function roas(t: Totals): number | null {
  if (t.spendMinor === 0n) return null;
  return Number(t.convValueMinor) / Number(t.spendMinor);
}

/** Click-through rate 0..1. */
export function ctr(t: Totals): number {
  if (t.impressions === 0n) return 0;
  return Number(t.clicks) / Number(t.impressions);
}

/** Conversion rate 0..1. */
export function cvr(t: Totals): number {
  if (t.clicks === 0n) return 0;
  return Number(t.conversions) / Number(t.clicks);
}

/** Average daily spend in minor units. */
export function avgDailySpendMinor(t: Totals): number {
  if (t.days === 0) return 0;
  return Number(t.spendMinor) / t.days;
}

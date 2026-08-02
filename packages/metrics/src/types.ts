import type { EntityType, Platform } from '@adsos/core';

/** One normalized metric fact row (day or hour grain). Money in minor units. */
export type MetricRow = {
  platform: Platform;
  entityType: EntityType;
  entityId: string;
  grain: 'HOUR' | 'DAY';
  bucketAt: string; // ISO
  impressions: bigint;
  clicks: bigint;
  spendMinor: bigint;
  conversions: bigint;
  convValueMinor: bigint;
  currency: string;
};

/** Aggregated totals over a window for one entity (or an account). */
export type Totals = {
  impressions: bigint;
  clicks: bigint;
  spendMinor: bigint;
  conversions: bigint;
  convValueMinor: bigint;
  currency: string;
  days: number;
};

/** An entity plus its window totals and daily series - the unit engines consume. */
export type EntityMetrics = {
  platform: Platform;
  entityType: EntityType;
  entityId: string;
  entityName: string;
  totals: Totals;
  daily: MetricRow[]; // DAY grain, ascending
};

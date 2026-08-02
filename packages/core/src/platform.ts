/**
 * Normalized domain enums. These are OUR vocabulary, not any platform's -
 * platform enums live only in each platform package's generated dir (CAMPAIGN_FLOWS.md sec 2).
 */

export const PLATFORMS = ['TIKTOK'] as const;
export type Platform = (typeof PLATFORMS)[number];

export const ENTITY_TYPES = [
  'ACCOUNT',
  'CAMPAIGN',
  'AD_GROUP',
  'AD',
  'CREATIVE',
  'AUDIENCE',
  'CONVERSION_SOURCE',
  'METRIC_FACT',
  'CATALOG_ITEM',
  'TREND',
] as const;
export type EntityType = (typeof ENTITY_TYPES)[number];

/** Reddit Ad Group  Spotify Ad Set  Snap Ad Squad  Pinterest Ad Group. */
export const AD_GROUP_LABEL: Record<Platform, string> = {
  TIKTOK: 'Ad Group',
};

export const NORMALIZED_STATUSES = [
  'ACTIVE',
  'PAUSED',
  'ARCHIVED',
  'PENDING_REVIEW',
  'REJECTED',
  'ENDED',
  'UNKNOWN',
] as const;
export type NormalizedStatus = (typeof NORMALIZED_STATUSES)[number];

/** Governs whether a synced entity may be persisted. ARCHITECTURE.md sec 5.4. */
export type RetentionPolicy = 'PERSIST' | 'ANALYTICS_ONLY' | 'PROXY_ONLY';

export type RiskBand = 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH';
export type Confidence = 'LOW' | 'MEDIUM' | 'HIGH';
export type TrackingHealth = 'HEALTHY' | 'DEGRADED' | 'BROKEN' | 'UNKNOWN';
export type Role = 'OWNER' | 'ADMIN' | 'OPERATOR' | 'ANALYST' | 'VIEWER';

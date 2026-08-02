/**
 * GENERATED placeholder for TikTok Marketing API v1.3. In production this is
 * emitted by scripts/schema-sync/tiktok.ts and committed; its diff is the
 * changelog. Values marked [U] are unverified pending a live schema-sync run.
 */
export const TIKTOK_API_BASE = 'https://business-api.tiktok.com/open_api/v1.3';
export const TIKTOK_API_VERSION = 'v1.3';

// Campaign objective_type [U]
export const TIKTOK_OBJECTIVES = [
  'REACH',
  'TRAFFIC',
  'VIDEO_VIEWS',
  'ENGAGEMENT',
  'APP_PROMOTION',
  'LEAD_GENERATION',
  'WEB_CONVERSIONS',
  'PRODUCT_SALES',
] as const;
export type TikTokObjective = (typeof TIKTOK_OBJECTIVES)[number];

// Ad group optimization_goal [U]
export const TIKTOK_OPTIMIZATION_GOALS = ['CLICK', 'CONVERT', 'INSTALL', 'REACH', 'VIDEO_VIEW', 'LEAD_GENERATION'] as const;

// bid strategy / bid_type [U]
export const TIKTOK_BID_STRATEGIES = ['BID_TYPE_NO_BID', 'BID_TYPE_CUSTOM', 'BID_TYPE_MAX_CONVERSION'] as const;

// budget_mode [V]
export const TIKTOK_BUDGET_MODES = ['BUDGET_MODE_DAY', 'BUDGET_MODE_TOTAL', 'BUDGET_MODE_INFINITE'] as const;

// operation_status [V]
export const TIKTOK_OPERATION_STATUSES = ['ENABLE', 'DISABLE', 'DELETE'] as const;

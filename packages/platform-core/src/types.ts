import type {
  Confidence,
  EntityType,
  Money,
  NormalizedStatus,
  Platform,
  RetentionPolicy,
  RiskBand,
} from '@adsos/core';

export type EntityRef = {
  platform: Platform;
  entityType: EntityType;
  externalId: string;
  workspaceId: string;
  /** The external ad-account id the entity belongs to. Some platforms (TikTok)
   *  require it on every write/read of a child entity. */
  accountExternalId?: string;
};

export type RateLimitSnapshot = {
  bucket: string;
  remaining: number | null;
  limit: number | null;
  resetAt: string | null; // ISO
};

export type SyncQuery = {
  connectionId: string;
  accountExternalId: string;
  cursor: string | null;
};

export type SyncPage<T> = {
  rows: T[];
  nextCursor: string | null;
  rateLimit: RateLimitSnapshot;
};

//  Normalized synced shapes (adapter output) 
type NormalizedBase = {
  externalId: string;
  name: string;
  normalizedStatus: NormalizedStatus;
  rawStatus: string;
  retentionPolicy: RetentionPolicy;
  apiVersion: string;
  extension: Record<string, unknown>;
  rawSnapshot: Record<string, unknown> | null;
};

export type ExternalAccount = {
  externalId: string;
  name: string;
  currency: string;
  timezone: string;
  rawStatus: string;
};
export type NormalizedCampaign = NormalizedBase & {
  accountExternalId: string;
  normalizedObjective: string | null;
  rawObjective: string | null;
  budget: Money | null;
  budgetType: 'DAILY' | 'LIFETIME' | null;
};
export type NormalizedAdGroup = NormalizedBase & {
  campaignExternalId: string;
  budget: Money | null;
  budgetType: 'DAILY' | 'LIFETIME' | null;
  bid: Money | null;
  bidStrategy: string | null;
  conversionSourceExternalId: string | null;
  targeting: Record<string, unknown>;
};
export type NormalizedAd = NormalizedBase & {
  adGroupExternalId: string;
  creativeExternalId: string | null;
};
export type NormalizedCreative = NormalizedBase & {
  assetType: string | null;
  aspectRatio: string | null;
};
export type NormalizedAudience = {
  externalId: string;
  name: string;
  kind: string | null;
  sizeEstimate: bigint | null;
  retentionPolicy: RetentionPolicy;
  extension: Record<string, unknown>;
};

export type NormalizedMetricRow = {
  entityType: EntityType;
  entityExternalId: string;
  grain: 'HOUR' | 'DAY';
  bucketAt: string; // ISO
  breakdownHash: string;
  breakdown: Record<string, string> | null;
  schemaVersion: number;
  impressions: bigint;
  clicks: bigint;
  spend: Money;
  conversions: bigint;
  convValue: Money;
  native: Record<string, number>;
};

export type PlatformReportQuery = {
  connectionId: string;
  accountExternalId: string;
  entityType: EntityType;
  grain: 'HOUR' | 'DAY';
  since: string; // ISO date
  until: string; // ISO date
  cursor: string | null;
};

//  Action engine surface (ARCHITECTURE.md sec 7, sec 12) 
export type ActionKind =
  | 'PAUSE'
  | 'RESUME'
  | 'SET_BUDGET'
  | 'SET_BID'
  | 'RENAME'
  | 'UPDATE'
  | 'DELETE'
  | 'CREATE_CAMPAIGN'
  | 'CREATE_AD_GROUP'
  | 'CREATE_AD';

export type ProposedAction = {
  workspaceId: string;
  platform: Platform;
  kind: ActionKind;
  entityRef: EntityRef;
  proposedPayload: Record<string, unknown>;
  riskBand: RiskBand;
};

export type ApprovedAction = ProposedAction & {
  actionId: string;
  idempotencyKey: string;
};
export type AppliedAction = ApprovedAction & { previousState: EntitySnapshot };

export type ValidationResult = {
  valid: boolean;
  violations: { field: string; because: string }[];
};
export type ActionPreview = {
  humanDiff: { field: string; from: unknown; to: unknown; changed: boolean }[];
  estimatedImpact?: { metric: string; deltaMin: number; deltaMax: number; confidence: Confidence; basis: string };
};
export type ActionResult = {
  ok: boolean;
  apiResponse: Record<string, unknown>;
  rateLimit: RateLimitSnapshot;
  error?: string;
};
export type EntitySnapshot = { ref: EntityRef; state: Record<string, unknown>; capturedAt: string };

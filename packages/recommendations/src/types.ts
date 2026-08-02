import type { Confidence, Platform, RiskBand, TrackingHealth } from '@adsos/core';
import type { EntityMetrics } from '@adsos/metrics';
import type { ActionKind } from '@adsos/platform-core';

export type RecKind =
  | 'WASTE'
  | 'BUDGET_REALLOCATE'
  | 'UNDERFUNDED_WINNER'
  | 'OVERSPENDING_LOSER'
  | 'CREATIVE_FATIGUE'
  | 'PACING_DRIFT'
  | 'TRACKING_FIX';

export type EstimatedImpact = {
  metric: string;
  deltaMin: number;
  deltaMax: number;
  unit: string;
  /** Mandatory stated assumption (DESIGN_SYSTEM sec 4). */
  basis: string;
};

export type ProposedActionDraft = {
  kind: ActionKind;
  payload: Record<string, unknown>;
};

export type RecommendationDraft = {
  kind: RecKind;
  platform: Platform;
  entityType: string;
  entityId: string;
  entityName: string;
  /** Field-level diff the Action Ledger renders. */
  diff: { field: string; from: string; to: string }[];
  /** Facts from the metric store only - never model-authored numbers. */
  evidence: string[];
  confidence: Confidence;
  estimatedImpact?: EstimatedImpact;
  riskBand: RiskBand;
  reversible: boolean;
  proposedAction: ProposedActionDraft;
  /** Higher = more urgent; drives Morning Brief ordering. */
  urgency: number;
};

export type EntityBudget = {
  entityId: string;
  dailyBudgetMinor: bigint | null;
  budgetType: 'DAILY' | 'LIFETIME' | null;
};

export type AccountContext = {
  platform: Platform;
  currency: string;
  entities: EntityMetrics[];
  budgets: Map<string, EntityBudget>;
  trackingHealth: TrackingHealth;
  /** Reddit: ad groups / CBO campaigns missing conversion_pixel_id (blocking). */
  missingPixelEntityIds?: string[];
};

export type RecConfig = {
  minImpressions: bigint;
  minDays: number;
  minConversionsForCpa: bigint;
  maxBudgetChangePct: number; // guardrail-aligned ceiling on proposals
  cpaLoserFactor: number; // CPA above median * this => loser
  cpaWinnerFactor: number; // CPA below median * this => winner
  capUtilization: number; // avgDailySpend / dailyBudget >= this => budget-capped
  fatigueCtrDropPct: number; // second-half CTR down by this vs first half
};

export const DEFAULT_CONFIG: RecConfig = {
  minImpressions: 1000n,
  minDays: 7,
  minConversionsForCpa: 1n,
  maxBudgetChangePct: 25,
  cpaLoserFactor: 1.5,
  cpaWinnerFactor: 0.75,
  capUtilization: 0.92,
  fatigueCtrDropPct: 30,
};

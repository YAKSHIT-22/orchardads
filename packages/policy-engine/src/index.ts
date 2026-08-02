import type { Role, RiskBand, TrackingHealth } from '@adsos/core';
import type { ActionKind } from '@adsos/platform-core';

/** Default guardrails (ARCHITECTURE.md sec 7.3). Overridable per workspace. */
export type Guardrails = {
  maxBudgetChangePct: number;
  allowObjectiveChange: boolean;
  allowCreativePublishWithoutApproval: boolean;
  requireHealthyTrackingForConversionActions: boolean;
  cooldownH: number;
  absoluteDailyBudgetIncreaseCapMinor: bigint | null;
};

export const DEFAULT_GUARDRAILS: Guardrails = {
  maxBudgetChangePct: 25,
  allowObjectiveChange: false,
  allowCreativePublishWithoutApproval: false,
  requireHealthyTrackingForConversionActions: true,
  cooldownH: 48,
  absoluteDailyBudgetIncreaseCapMinor: null,
};

export type PolicyInput = {
  kind: ActionKind;
  previousMinor?: bigint | null;
  proposedMinor?: bigint | null;
  /** True when the action optimizes toward conversions (needs healthy tracking). */
  conversionOptimizing: boolean;
  trackingHealth: TrackingHealth;
  killSwitch: boolean;
  /** ms since epoch of the last same-kind action on this entity, if any. */
  lastActionAt?: number | null;
  now?: number;
  bulkCount?: number;
};

export type Violation = { code: string; message: string };

export type PolicyResult = {
  allowed: boolean;
  violations: Violation[];
  riskBand: RiskBand;
  approval: { minRole: Role; typedConfirmation: boolean; autoApplyEligible: boolean };
};

const ROLE_RANK: Record<Role, number> = { VIEWER: 0, ANALYST: 1, OPERATOR: 2, ADMIN: 3, OWNER: 4 };

export function canApprove(role: Role, minRole: Role): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minRole];
}

function budgetChangePct(prev?: bigint | null, next?: bigint | null): number | null {
  if (prev == null || next == null || prev === 0n) return null;
  return (Number(next - prev) / Number(prev)) * 100;
}

function riskBandFor(input: PolicyInput): RiskBand {
  if (input.kind === 'CREATE_CAMPAIGN' || input.kind === 'CREATE_AD_GROUP' || input.kind === 'CREATE_AD') {
    return 'HIGH';
  }
  if ((input.bulkCount ?? 0) > 10) return 'HIGH';
  if (input.kind === 'RENAME') return 'SAFE';
  if (input.kind === 'PAUSE' || input.kind === 'RESUME') return 'LOW';
  if (input.kind === 'SET_BUDGET' || input.kind === 'SET_BID') {
    const p = Math.abs(budgetChangePct(input.previousMinor, input.proposedMinor) ?? 0);
    return p <= 10 ? 'LOW' : 'MEDIUM';
  }
  return 'MEDIUM';
}

function approvalForRisk(band: RiskBand): PolicyResult['approval'] {
  switch (band) {
    case 'SAFE':
      return { minRole: 'OPERATOR', typedConfirmation: false, autoApplyEligible: true };
    case 'LOW':
      return { minRole: 'OPERATOR', typedConfirmation: false, autoApplyEligible: false };
    case 'MEDIUM':
      return { minRole: 'ADMIN', typedConfirmation: false, autoApplyEligible: false };
    case 'HIGH':
      return { minRole: 'ADMIN', typedConfirmation: true, autoApplyEligible: false };
  }
}

/**
 * Central guardrail evaluation. A proposing tool cannot opt out of this
 * (ARCHITECTURE.md sec 7.3). Returns blocking violations, plus risk + approval.
 */
export function evaluatePolicy(
  input: PolicyInput,
  guardrails: Guardrails = DEFAULT_GUARDRAILS,
): PolicyResult {
  const violations: Violation[] = [];
  const band = riskBandFor(input);

  if (input.killSwitch) {
    violations.push({ code: 'KILL_SWITCH', message: 'Workspace kill switch is engaged; all actions are halted.' });
  }

  const pct = budgetChangePct(input.previousMinor, input.proposedMinor);
  if (pct != null && Math.abs(pct) > guardrails.maxBudgetChangePct) {
    violations.push({
      code: 'BUDGET_CAP',
      message: `Budget change of ${pct.toFixed(0)}% exceeds the ${guardrails.maxBudgetChangePct}% cap.`,
    });
  }

  if (
    guardrails.absoluteDailyBudgetIncreaseCapMinor != null &&
    input.previousMinor != null &&
    input.proposedMinor != null &&
    input.proposedMinor - input.previousMinor > guardrails.absoluteDailyBudgetIncreaseCapMinor
  ) {
    violations.push({ code: 'ABS_BUDGET_CAP', message: 'Increase exceeds the absolute daily budget cap.' });
  }

  if (
    guardrails.requireHealthyTrackingForConversionActions &&
    input.conversionOptimizing &&
    input.trackingHealth !== 'HEALTHY'
  ) {
    violations.push({
      code: 'TRACKING_DEGRADED',
      message: 'Conversion-optimizing actions are blocked while conversion tracking is not healthy.',
    });
  }

  if (input.lastActionAt != null) {
    const now = input.now ?? Date.now();
    const elapsedH = (now - input.lastActionAt) / 3_600_000;
    if (elapsedH < guardrails.cooldownH) {
      violations.push({
        code: 'COOLDOWN',
        message: `In cooldown: ${Math.ceil(guardrails.cooldownH - elapsedH)}h remaining for this entity and action.`,
      });
    }
  }

  return { allowed: violations.length === 0, violations, riskBand: band, approval: approvalForRisk(band) };
}

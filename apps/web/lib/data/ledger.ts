import { type Platform, formatMoney } from '@adsos/core';
import type { EstimatedImpact, RecKind, RecommendationDraft } from '@adsos/recommendations';
import type { ActionLedgerProps } from '@adsos/ui';

/** Action kinds the recommendation engine can propose (a subset of ActionKind). */
export type ApplyKind = 'PAUSE' | 'RESUME' | 'SET_BUDGET' | 'SET_BID' | 'RENAME';

/** The minimal, real payload the apply server action needs to route a write. */
export type ApplyInput = {
  platform: Platform;
  kind: ApplyKind;
  entityType: 'CAMPAIGN' | 'AD_GROUP' | 'AD';
  entityId: string; // internal uuid
  externalId: string;
  proposedPayload: Record<string, unknown>;
};

/** Recommendation-draft -> Action Ledger props, with identity + apply metadata. */
export type LedgerRec = ActionLedgerProps & {
  id: string;
  kind: RecKind;
  tool: string;
  urgency: number;
  /** Advisory recs (e.g. tracking fixes) are not one-click applies - they route
   *  the user to a tool instead of writing to the platform. */
  advisory: boolean;
  advisoryHref?: string;
  applyInput: ApplyInput;
};

const KIND_TO_TOOL: Record<RecKind, string> = {
  WASTE: 'waste-finder',
  BUDGET_REALLOCATE: 'budget-reallocator',
  UNDERFUNDED_WINNER: 'underfunded-winner',
  OVERSPENDING_LOSER: 'overspending-loser',
  CREATIVE_FATIGUE: 'creative-fatigue',
  PACING_DRIFT: 'budget-pacing',
  TRACKING_FIX: 'tracking-doctor',
};

function impactHeadline(i: EstimatedImpact): string {
  if (i.unit === 'USD') return formatMoney({ amountMinor: BigInt(Math.round(i.deltaMin)), currency: 'USD' });
  if (i.deltaMin === i.deltaMax) return `${i.deltaMin} ${i.unit}`;
  return `+${i.deltaMin} to +${i.deltaMax} ${i.unit}`;
}

export function draftToLedger(d: RecommendationDraft, meta: { externalId: string }): LedgerRec {
  const kind = d.proposedAction.kind;
  const advisory = d.kind === 'TRACKING_FIX';
  return {
    id: `${d.kind}:${d.entityId}`,
    kind: d.kind,
    tool: KIND_TO_TOOL[d.kind],
    urgency: d.urgency,
    advisory,
    advisoryHref: advisory ? '/tools/tracking-doctor' : undefined,
    platform: d.platform,
    entityType: d.entityType.replace('_', ' '),
    entityLabel: d.entityName,
    diff: d.diff,
    evidence: d.evidence,
    estimate: d.estimatedImpact
      ? { headline: impactHeadline(d.estimatedImpact), confidence: d.confidence, basis: d.estimatedImpact.basis }
      : undefined,
    risk: d.riskBand,
    reversible: d.reversible,
    cooldownH: d.reversible ? 48 : undefined,
    density: 'card',
    applyInput: {
      platform: d.platform,
      kind: kind as ApplyKind,
      entityType: d.entityType as 'CAMPAIGN' | 'AD_GROUP' | 'AD',
      entityId: d.entityId,
      externalId: meta.externalId,
      proposedPayload: d.proposedAction.payload,
    },
  };
}

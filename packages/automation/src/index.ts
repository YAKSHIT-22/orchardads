import type { Platform, RiskBand } from '@adsos/core';
import type { Totals } from '@adsos/metrics';
import { cpaMinor, ctr, cvr, roas } from '@adsos/metrics';

export type RuleMetric = 'CPA' | 'ROAS' | 'CTR' | 'CVR' | 'SPEND' | 'CONVERSIONS';
export type Comparator = 'GT' | 'GTE' | 'LT' | 'LTE';
export type RuleActionKind = 'PAUSE' | 'DECREASE_BUDGET' | 'INCREASE_BUDGET';

export type AutomationRule = {
  id: string;
  name: string;
  platform: Platform | null;
  metric: RuleMetric;
  comparator: Comparator;
  threshold: number; // CPA/SPEND in minor units; rates as 0..1
  actionKind: RuleActionKind;
  changePct?: number;
  cooldownH: number;
  maxRiskBand: RiskBand; // a rule may never escalate beyond this
  enabled: boolean;
  lastFiredAt?: number | null;
};

function metricValue(metric: RuleMetric, t: Totals): number | null {
  switch (metric) {
    case 'CPA':
      return cpaMinor(t);
    case 'ROAS':
      return roas(t);
    case 'CTR':
      return ctr(t);
    case 'CVR':
      return cvr(t);
    case 'SPEND':
      return Number(t.spendMinor);
    case 'CONVERSIONS':
      return Number(t.conversions);
  }
}

function compare(v: number, cmp: Comparator, threshold: number): boolean {
  switch (cmp) {
    case 'GT':
      return v > threshold;
    case 'GTE':
      return v >= threshold;
    case 'LT':
      return v < threshold;
    case 'LTE':
      return v <= threshold;
  }
}

export type RuleEvaluation = { fires: boolean; reason: string; inCooldown: boolean };

/**
 * Evaluate a rule against an entity window. Rules PROPOSE; the proposal still
 * passes through the policy engine (ARCHITECTURE.md sec 7). A rule firing inside
 * its cooldown does not fire (idempotent), and cannot exceed maxRiskBand.
 */
export function evaluateRule(rule: AutomationRule, totals: Totals, now = Date.now()): RuleEvaluation {
  if (!rule.enabled) return { fires: false, reason: 'rule disabled', inCooldown: false };

  const inCooldown = rule.lastFiredAt != null && (now - rule.lastFiredAt) / 3_600_000 < rule.cooldownH;
  if (inCooldown) return { fires: false, reason: 'in cooldown', inCooldown: true };

  const v = metricValue(rule.metric, totals);
  if (v == null) return { fires: false, reason: `${rule.metric} not computable`, inCooldown: false };

  const hit = compare(v, rule.comparator, rule.threshold);
  return {
    fires: hit,
    reason: hit
      ? `${rule.metric} ${v.toFixed(2)} ${rule.comparator} ${rule.threshold}`
      : `${rule.metric} ${v.toFixed(2)} does not meet ${rule.comparator} ${rule.threshold}`,
    inCooldown: false,
  };
}

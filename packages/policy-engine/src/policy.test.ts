import { describe, expect, it } from 'vitest';
import { canApprove, evaluatePolicy } from './index';

const base = {
  conversionOptimizing: false,
  trackingHealth: 'HEALTHY' as const,
  killSwitch: false,
};

describe('policy engine', () => {
  it('blocks a 40% budget increase by the 25% cap', () => {
    const r = evaluatePolicy({ ...base, kind: 'SET_BUDGET', previousMinor: 1000n, proposedMinor: 1400n });
    expect(r.allowed).toBe(false);
    expect(r.violations.map((v) => v.code)).toContain('BUDGET_CAP');
  });

  it('allows a 20% budget change and bands it MEDIUM', () => {
    const r = evaluatePolicy({ ...base, kind: 'SET_BUDGET', previousMinor: 1000n, proposedMinor: 1200n });
    expect(r.allowed).toBe(true);
    expect(r.riskBand).toBe('MEDIUM');
  });

  it('blocks conversion-optimizing actions when tracking is degraded', () => {
    const r = evaluatePolicy({
      ...base,
      kind: 'SET_BID',
      conversionOptimizing: true,
      trackingHealth: 'DEGRADED',
    });
    expect(r.allowed).toBe(false);
    expect(r.violations.map((v) => v.code)).toContain('TRACKING_DEGRADED');
  });

  it('kill switch halts everything', () => {
    const r = evaluatePolicy({ ...base, kind: 'PAUSE', killSwitch: true });
    expect(r.allowed).toBe(false);
  });

  it('cooldown blocks a repeat within the window', () => {
    const now = Date.now();
    const r = evaluatePolicy({ ...base, kind: 'PAUSE', lastActionAt: now - 3_600_000, now });
    expect(r.violations.map((v) => v.code)).toContain('COOLDOWN');
  });

  it('bands creation HIGH with typed confirmation', () => {
    const r = evaluatePolicy({ ...base, kind: 'CREATE_CAMPAIGN' });
    expect(r.riskBand).toBe('HIGH');
    expect(r.approval.typedConfirmation).toBe(true);
  });

  it('role ranking gates approval', () => {
    expect(canApprove('OPERATOR', 'ADMIN')).toBe(false);
    expect(canApprove('ADMIN', 'OPERATOR')).toBe(true);
  });
});

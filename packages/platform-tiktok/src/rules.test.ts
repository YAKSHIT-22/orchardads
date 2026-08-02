import { evaluateDraft } from '@adsos/platform-core';
import { describe, expect, it } from 'vitest';
import { TIKTOK_AD_GROUP_RULES, TIKTOK_CAMPAIGN_RULES } from './rules';

describe('tiktok rules', () => {
  it('requires objective on a campaign', () => {
    const r = evaluateDraft({ campaign_name: 'c' }, TIKTOK_CAMPAIGN_RULES);
    expect(r.valid).toBe(false);
    expect(r.violations.some((v) => v.field === 'objective_type')).toBe(true);
  });

  it('requires pixel_id for CONVERT optimization', () => {
    const r = evaluateDraft({ adgroup_name: 'g', optimization_goal: 'CONVERT' }, TIKTOK_AD_GROUP_RULES);
    expect(r.violations.some((v) => v.field === 'pixel_id')).toBe(true);
  });

  it('requires app_id for INSTALL optimization', () => {
    const r = evaluateDraft({ adgroup_name: 'g', optimization_goal: 'INSTALL' }, TIKTOK_AD_GROUP_RULES);
    expect(r.violations.some((v) => v.field === 'app_id')).toBe(true);
  });

  it('passes a well-formed TRAFFIC/CLICK ad group', () => {
    const r = evaluateDraft(
      { adgroup_name: 'g', objective_type: 'TRAFFIC', optimization_goal: 'CLICK', budget_mode: 'BUDGET_MODE_DAY', budget: 50, bid_type: 'BID_TYPE_NO_BID' },
      TIKTOK_AD_GROUP_RULES,
    );
    expect(r.valid).toBe(true);
  });

  it('blocks an objective/goal mismatch (WEB_CONVERSIONS + REACH)', () => {
    const r = evaluateDraft(
      { adgroup_name: 'g', objective_type: 'WEB_CONVERSIONS', optimization_goal: 'REACH', budget_mode: 'BUDGET_MODE_DAY', budget: 50, pixel_id: 'px', optimization_event: 'PURCHASE' },
      TIKTOK_AD_GROUP_RULES,
    );
    expect(r.valid).toBe(false);
    expect(r.violations.some((v) => v.because.includes('optimization goal must match'))).toBe(true);
  });

  it('requires bid_price for a custom bid, forbids it for no-bid', () => {
    const custom = evaluateDraft(
      { adgroup_name: 'g', objective_type: 'TRAFFIC', optimization_goal: 'CLICK', budget_mode: 'BUDGET_MODE_DAY', budget: 50, bid_type: 'BID_TYPE_CUSTOM' },
      TIKTOK_AD_GROUP_RULES,
    );
    expect(custom.violations.some((v) => v.field === 'bid_price')).toBe(true);
    const nobid = evaluateDraft(
      { adgroup_name: 'g', objective_type: 'TRAFFIC', optimization_goal: 'CLICK', budget_mode: 'BUDGET_MODE_DAY', budget: 50, bid_type: 'BID_TYPE_NO_BID', bid_price: 5 },
      TIKTOK_AD_GROUP_RULES,
    );
    expect(nobid.violations.some((v) => v.field === 'bid_price')).toBe(true);
  });

  it('requires optimization_event for CONVERT', () => {
    const r = evaluateDraft(
      { adgroup_name: 'g', objective_type: 'WEB_CONVERSIONS', optimization_goal: 'CONVERT', budget_mode: 'BUDGET_MODE_DAY', budget: 50, pixel_id: 'px' },
      TIKTOK_AD_GROUP_RULES,
    );
    expect(r.violations.some((v) => v.field === 'optimization_event')).toBe(true);
  });

  it('enforces minimum daily campaign budget', () => {
    const r = evaluateDraft({ campaign_name: 'c', objective_type: 'TRAFFIC', budget_mode: 'BUDGET_MODE_DAY', budget: 10 }, TIKTOK_CAMPAIGN_RULES);
    expect(r.violations.some((v) => v.field === 'budget')).toBe(true);
  });
});

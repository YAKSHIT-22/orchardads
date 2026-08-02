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

  it('passes a well-formed CLICK ad group', () => {
    const r = evaluateDraft({ adgroup_name: 'g', optimization_goal: 'CLICK', budget_mode: 'BUDGET_MODE_DAY', budget: 50 }, TIKTOK_AD_GROUP_RULES);
    expect(r.valid).toBe(true);
  });
});

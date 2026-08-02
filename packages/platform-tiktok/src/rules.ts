import { type FieldRule, eq, oneOf } from '@adsos/platform-core';

/**
 * TikTok conditional rules (Marketing API v1.3). Every rule carries a user-facing
 * `because`. Reconciled against generated/ once schema-sync runs.
 */
export const TIKTOK_CAMPAIGN_RULES: FieldRule[] = [
  { kind: 'requiredWhen', field: 'campaign_name', when: () => true, because: 'Every campaign needs a name.' },
  { kind: 'requiredWhen', field: 'objective_type', when: () => true, because: 'TikTok requires a campaign objective.' },
  {
    kind: 'immutableAfterCreate',
    field: 'objective_type',
    because: 'TikTok does not allow changing a campaign objective after creation.',
  },
  {
    kind: 'requiredWhen',
    field: 'budget',
    when: eq('budget_mode', 'BUDGET_MODE_DAY'),
    because: 'A daily budget mode requires a budget amount.',
  },
];

export const TIKTOK_AD_GROUP_RULES: FieldRule[] = [
  { kind: 'requiredWhen', field: 'adgroup_name', when: () => true, because: 'Every ad group needs a name.' },
  { kind: 'requiredWhen', field: 'optimization_goal', when: () => true, because: 'TikTok requires an optimization goal.' },
  {
    kind: 'requiredWhen',
    field: 'budget',
    when: oneOf('budget_mode', ['BUDGET_MODE_DAY', 'BUDGET_MODE_TOTAL']),
    because: 'A daily or lifetime budget mode requires a budget amount.',
  },
  {
    kind: 'requiredWhen',
    field: 'app_id',
    when: eq('optimization_goal', 'INSTALL'),
    because: 'App-install optimization requires the promoted app id.',
  },
  {
    kind: 'requiredWhen',
    field: 'pixel_id',
    when: eq('optimization_goal', 'CONVERT'),
    because: 'Conversion optimization requires a TikTok Pixel or Events API source.',
  },
  {
    kind: 'range',
    field: 'budget',
    when: eq('budget_mode', 'BUDGET_MODE_DAY'),
    min: 20,
    because: 'TikTok enforces a minimum daily ad group budget (about 20 in account currency).',
  },
];

export const TIKTOK_AD_RULES: FieldRule[] = [
  { kind: 'requiredWhen', field: 'ad_name', when: () => true, because: 'Every ad needs a name.' },
  { kind: 'requiredWhen', field: 'creative_id', when: () => true, because: 'An ad must reference a creative.' },
];

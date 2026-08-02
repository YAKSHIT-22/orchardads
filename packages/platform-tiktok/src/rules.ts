import { type Draft, type FieldRule, eq, oneOf } from '@adsos/platform-core';

/**
 * TikTok conditional rules (Marketing API v1.3). Every rule carries a user-facing
 * `because`. Encodes the objective -> optimization_goal -> bid_type combination
 * matrix and the create/edit edge cases. Reconciled against generated/ once
 * schema-sync runs.
 */

// Objectives that require a conversion source (pixel/app) to optimize toward.
const CONVERSION_OBJECTIVES = ['WEB_CONVERSIONS', 'PRODUCT_SALES', 'LEAD_GENERATION'];
const APP_OBJECTIVES = ['APP_PROMOTION'];
// Which optimization goals each objective allows (combination matrix).
const GOALS_BY_OBJECTIVE: Record<string, string[]> = {
  REACH: ['REACH'],
  TRAFFIC: ['CLICK'],
  VIDEO_VIEWS: ['VIDEO_VIEW'],
  ENGAGEMENT: ['CLICK', 'REACH'],
  APP_PROMOTION: ['INSTALL', 'CONVERT', 'CLICK'],
  LEAD_GENERATION: ['LEAD_GENERATION', 'CONVERT'],
  WEB_CONVERSIONS: ['CONVERT', 'CLICK'],
  PRODUCT_SALES: ['CONVERT'],
};

const objectiveIn = (list: string[]) => (d: Draft) => list.includes(String(d.objective_type));
const hasObjectiveWithGoals = (d: Draft) => GOALS_BY_OBJECTIVE[String(d.objective_type)] != null;

export const TIKTOK_CAMPAIGN_RULES: FieldRule[] = [
  { kind: 'requiredWhen', field: 'campaign_name', when: () => true, because: 'Every campaign needs a name.' },
  { kind: 'requiredWhen', field: 'objective_type', when: () => true, because: 'TikTok requires a campaign objective.' },
  {
    kind: 'immutableAfterCreate',
    field: 'objective_type',
    because: 'TikTok does not allow changing a campaign objective after creation.',
  },
  {
    kind: 'immutableAfterCreate',
    field: 'budget_mode',
    because: 'Budget mode is fixed once the campaign is created.',
  },
  {
    kind: 'requiredWhen',
    field: 'budget',
    when: oneOf('budget_mode', ['BUDGET_MODE_DAY', 'BUDGET_MODE_TOTAL']),
    because: 'A daily or lifetime budget mode requires a budget amount.',
  },
  {
    kind: 'range',
    field: 'budget',
    when: eq('budget_mode', 'BUDGET_MODE_DAY'),
    min: 50,
    because: 'TikTok enforces a minimum daily campaign budget (about 50 in account currency).',
  },
];

export const TIKTOK_AD_GROUP_RULES: FieldRule[] = [
  { kind: 'requiredWhen', field: 'adgroup_name', when: () => true, because: 'Every ad group needs a name.' },
  { kind: 'requiredWhen', field: 'optimization_goal', when: () => true, because: 'TikTok requires an optimization goal.' },
  // Objective -> optimization_goal combination matrix.
  {
    kind: 'allowedValues',
    field: 'optimization_goal',
    when: hasObjectiveWithGoals,
    values: Object.values(GOALS_BY_OBJECTIVE).flat(),
    because: 'This optimization goal is not valid for the selected campaign objective.',
  },
  {
    kind: 'crossField',
    fields: ['objective_type', 'optimization_goal'],
    assert: (d) => {
      const allowed = GOALS_BY_OBJECTIVE[String(d.objective_type)];
      return !allowed || allowed.includes(String(d.optimization_goal));
    },
    because: 'The optimization goal must match the campaign objective (e.g. WEB_CONVERSIONS pairs with CONVERT, not REACH).',
  },
  {
    kind: 'requiredWhen',
    field: 'budget',
    when: oneOf('budget_mode', ['BUDGET_MODE_DAY', 'BUDGET_MODE_TOTAL']),
    because: 'A daily or lifetime budget mode requires a budget amount.',
  },
  {
    kind: 'range',
    field: 'budget',
    when: eq('budget_mode', 'BUDGET_MODE_DAY'),
    min: 20,
    because: 'TikTok enforces a minimum daily ad group budget (about 20 in account currency).',
  },
  // Conversion / app sources.
  {
    kind: 'requiredWhen',
    field: 'app_id',
    when: (d) => APP_OBJECTIVES.includes(String(d.objective_type)) || String(d.optimization_goal) === 'INSTALL',
    because: 'App-promotion objectives require the promoted app id.',
  },
  {
    kind: 'requiredWhen',
    field: 'pixel_id',
    when: (d) => objectiveIn(CONVERSION_OBJECTIVES)(d) || String(d.optimization_goal) === 'CONVERT',
    because: 'Conversion optimization requires a TikTok Pixel or Events API source.',
  },
  {
    kind: 'requiredWhen',
    field: 'optimization_event',
    when: (d) => String(d.optimization_goal) === 'CONVERT',
    because: 'A conversion goal needs a specific optimization event to optimize toward.',
  },
  // Bidding edge cases.
  {
    kind: 'requiredWhen',
    field: 'bid_price',
    when: eq('bid_type', 'BID_TYPE_CUSTOM'),
    because: 'A custom bid strategy requires a bid amount.',
  },
  {
    kind: 'forbiddenWhen',
    field: 'bid_price',
    when: eq('bid_type', 'BID_TYPE_NO_BID'),
    because: 'Lowest-cost (no-bid) delivery does not take a manual bid.',
  },
  // Scheduling.
  {
    kind: 'requiredWhen',
    field: 'schedule_end_time',
    when: eq('schedule_type', 'SCHEDULE_START_END'),
    because: 'A fixed schedule needs an end time.',
  },
];

export const TIKTOK_AD_RULES: FieldRule[] = [
  { kind: 'requiredWhen', field: 'ad_name', when: () => true, because: 'Every ad needs a name.' },
  {
    kind: 'requiredWhen',
    field: 'video_id',
    when: (d) => String(d.ad_format) === 'SINGLE_VIDEO' && !d.image_ids,
    because: 'A single-video ad needs a video.',
  },
  {
    kind: 'requiredWhen',
    field: 'identity_id',
    when: (d) => String(d.ad_format) === 'SPARK_AD',
    because: 'A Spark Ad needs an authorized creator/business identity.',
  },
  {
    kind: 'requiredWhen',
    field: 'landing_page_url',
    when: (d) => oneOf('call_to_action', ['SHOP_NOW', 'LEARN_MORE', 'SIGN_UP', 'DOWNLOAD'])(d),
    because: 'This call to action needs a destination URL.',
  },
];

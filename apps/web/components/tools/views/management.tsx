'use client';

/**
 * Cluster: management. TikTok campaign-build and structure-management tool
 * views. No live data source is wired yet: Campaign Studio and Bulk Editor
 * are interactive control shells (local state only, no submit / no apply),
 * and the rest render stats + a table with a single explained empty row,
 * per DESIGN_SYSTEM.md.
 */

import { StudioSubmit } from '@/components/tools/studio-submit';
import { useMemo, useState, type ReactNode } from 'react';
import {
  Button,
  StatTile,
  StatGrid,
  InsightBanner,
  DataGrid,
  THead,
  TR,
  TH,
  TD,
  EmptyRow,
  cn,
} from '@adsos/ui';
import {
  FlaskConical,
  ListChecks,
  Target,
  ClipboardCheck,
  BadgeDollarSign,
  ChevronRight,
  ChevronLeft,
  Check,
  Search,
  Globe,
  Compass,
  Tag,
  Users,
  MapPin,
  Layers,
  DollarSign,
  TrendingUp,
  Percent,
  Rocket,
  Eye,
  EyeOff,
  SquareCheckBig,
  Square,
  Ban,
  RefreshCw,
  CircleDot,
  type LucideIcon,
} from 'lucide-react';
import type { ToolViewMap, ToolViewProps } from './_registry';

// -- Local shell atoms (file-scoped; analytics.tsx keeps its own copy) --

type RangeValue = '7d' | '30d' | '90d';
const RANGE_OPTIONS: RangeValue[] = ['7d', '30d', '90d'];

function RangeTabs({ value, onChange }: { value: RangeValue; onChange: (v: RangeValue) => void }) {
  return (
    <div className="inline-flex rounded-md border border-rule p-0.5" role="tablist" aria-label="Date range">
      {RANGE_OPTIONS.map((o) => (
        <button
          key={o}
          type="button"
          role="tab"
          aria-selected={value === o}
          onClick={() => onChange(o)}
          className={cn(
            'rounded-sm px-3 py-1 font-ui text-[12px] font-medium transition-colors',
            value === o ? 'bg-iris text-white' : 'text-ink-muted hover:text-ink',
          )}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

function Segmented<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  ariaLabel: string;
}) {
  return (
    <div className="inline-flex rounded-md border border-rule p-0.5" role="tablist" aria-label={ariaLabel}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'rounded-sm px-3 py-1 font-ui text-[12px] font-medium transition-colors',
            value === o.value ? 'bg-iris text-white' : 'text-ink-muted hover:text-ink',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function ContextLine({ children }: { children: ReactNode }) {
  return <p className="max-w-2xl font-ui text-[13px] text-ink-muted">{children}</p>;
}

function ScopesLine({ tool }: { tool: ToolViewProps['tool'] }) {
  if (!tool.scopes || tool.scopes.length === 0) return null;
  return <p className="font-ui text-[11px] text-ink-faint">TikTok scopes: {tool.scopes.join(', ')}</p>;
}

type Stat = { icon: LucideIcon; label: string; sub?: string };

function PlaceholderStats({ stats }: { stats: Stat[] }) {
  return (
    <StatGrid>
      {stats.map((s) => (
        <StatTile key={s.label} icon={s.icon} label={s.label} value="-" sub={s.sub} tone="neutral" />
      ))}
    </StatGrid>
  );
}

type Col = { label: string; numeric?: boolean };

function ToolTable({ columns, emptyMessage }: { columns: Col[]; emptyMessage: string }) {
  return (
    <DataGrid>
      <THead>
        <TR>
          {columns.map((c) => (
            <TH key={c.label} numeric={c.numeric}>
              {c.label}
            </TH>
          ))}
        </TR>
      </THead>
      <tbody>
        <EmptyRow cols={columns.length}>{emptyMessage}</EmptyRow>
      </tbody>
    </DataGrid>
  );
}

function FieldShell({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-label text-ink-muted">{label}</span>
      {children}
      {hint && <span className="font-ui text-[11px] text-ink-faint">{hint}</span>}
    </div>
  );
}

const selectCls = 'h-[38px] w-full rounded-md border border-rule bg-paper px-2 font-ui text-[13px] text-ink';
const inputCls = 'h-[38px] w-full rounded-md border border-rule bg-paper px-2 font-data text-[13px] text-ink';

const NO_DATA = 'Connect a TikTok ad account to see live results here.';

// -- Campaign Studio: Objective -> Settings -> Targeting -> Creative -> Review --

const STUDIO_STEPS = ['Objective', 'Settings', 'Targeting', 'Creative', 'Review'] as const;
type StudioStep = (typeof STUDIO_STEPS)[number];

const OBJECTIVES = [
  { value: 'REACH', label: 'Reach' },
  { value: 'TRAFFIC', label: 'Traffic' },
  { value: 'VIDEO_VIEWS', label: 'Video views' },
  { value: 'ENGAGEMENT', label: 'Engagement' },
  { value: 'LEAD_GENERATION', label: 'Lead generation' },
  { value: 'APP_PROMOTION', label: 'App promotion' },
  { value: 'CONVERSIONS', label: 'Conversions' },
  { value: 'PRODUCT_SALES', label: 'Product sales' },
] as const;

function CampaignStudioView({ tool }: ToolViewProps) {
  const [step, setStep] = useState<StudioStep>('Objective');
  const stepIndex = STUDIO_STEPS.indexOf(step);

  const [objectiveType, setObjectiveType] = useState<string>('CONVERSIONS');
  const [optimizationGoal, setOptimizationGoal] = useState('CONVERT');
  const [budgetMode, setBudgetMode] = useState<'BUDGET_MODE_DAY' | 'BUDGET_MODE_TOTAL'>('BUDGET_MODE_DAY');
  const [budgetAmount, setBudgetAmount] = useState('50.00');
  const [bidType, setBidType] = useState<'BID_TYPE_NO_BID' | 'BID_TYPE_CUSTOM'>('BID_TYPE_NO_BID');

  const [locations, setLocations] = useState<string[]>(['US']);
  const [ageRanges, setAgeRanges] = useState<string[]>(['AGE_25_34', 'AGE_35_44']);
  const [gender, setGender] = useState<'GENDER_UNLIMITED' | 'GENDER_MALE' | 'GENDER_FEMALE'>('GENDER_UNLIMITED');
  const [placementType, setPlacementType] = useState<'PLACEMENT_TYPE_AUTOMATIC' | 'PLACEMENT_TYPE_NORMAL'>(
    'PLACEMENT_TYPE_AUTOMATIC',
  );

  const [adFormat, setAdFormat] = useState<'SINGLE_VIDEO' | 'SPARK_AD' | 'CAROUSEL'>('SINGLE_VIDEO');
  const [callToAction, setCallToAction] = useState('SHOP_NOW');
  const [destinationUrl, setDestinationUrl] = useState('');

  const [payloadOpen, setPayloadOpen] = useState(false);

  const toggleIn = (list: string[], value: string, setList: (v: string[]) => void) => {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  const payload = useMemo(
    () => ({
      objective_type: objectiveType,
      optimization_goal: optimizationGoal,
      budget_mode: budgetMode,
      budget: budgetAmount,
      bid_type: bidType,
      targeting: {
        location_ids: locations,
        age_groups: ageRanges,
        gender,
        placement_type: placementType,
      },
      creative: {
        ad_format: adFormat,
        call_to_action: callToAction,
        landing_page_url: destinationUrl || null,
      },
    }),
    [objectiveType, optimizationGoal, budgetMode, budgetAmount, bidType, locations, ageRanges, gender, placementType, adFormat, callToAction, destinationUrl],
  );

  // Campaign-level draft (what TikTok's campaign/create takes + what the rules validate).
  const campaignDraft = useMemo(
    () => ({
      campaign_name: `${objectiveType} campaign`,
      objective_type: objectiveType,
      budget_mode: budgetMode,
      budget: budgetAmount,
    }),
    [objectiveType, budgetMode, budgetAmount],
  );

  return (
    <div className="flex flex-col gap-5">
      <ContextLine>
        Builds a TikTok campaign step by step with the platform&apos;s real field names, so an
        invalid combination of objective, optimization goal and budget mode never reaches Review.
      </ContextLine>
      <ScopesLine tool={tool} />

      <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Campaign Studio steps">
        {STUDIO_STEPS.map((s, i) => (
          <button
            key={s}
            type="button"
            role="tab"
            aria-selected={step === s}
            onClick={() => setStep(s)}
            className={cn(
              'inline-flex items-center gap-2 rounded-md border px-3 py-1.5 font-ui text-[12px] font-medium transition-colors',
              step === s
                ? 'border-iris bg-iris-wash text-iris'
                : i < stepIndex
                  ? 'border-rule bg-paper-sunk text-ink-muted'
                  : 'border-rule text-ink-faint',
            )}
          >
            <span
              className={cn(
                'flex h-4 w-4 items-center justify-center rounded-full text-[10px]',
                step === s ? 'bg-iris text-white' : i < stepIndex ? 'bg-ink-faint text-white' : 'bg-paper-sunk text-ink-faint',
              )}
            >
              {i < stepIndex ? <Check className="h-2.5 w-2.5" /> : i + 1}
            </span>
            {s}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4 rounded-md border border-rule bg-paper p-4">
        {step === 'Objective' && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {OBJECTIVES.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => setObjectiveType(o.value)}
                className={cn(
                  'rounded-md border px-3 py-3 text-left font-ui text-[13px] font-medium transition-colors',
                  objectiveType === o.value
                    ? 'border-iris bg-iris-wash text-iris'
                    : 'border-rule text-ink hover:border-rule-strong',
                )}
              >
                {o.label}
                <span className="mt-1 block font-data text-[11px] font-normal text-ink-faint">{o.value}</span>
              </button>
            ))}
          </div>
        )}

        {step === 'Settings' && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FieldShell label="optimization_goal">
              <select value={optimizationGoal} onChange={(e) => setOptimizationGoal(e.target.value)} className={selectCls}>
                <option value="CLICK">CLICK</option>
                <option value="CONVERT">CONVERT</option>
                <option value="VALUE">VALUE</option>
                <option value="REACH">REACH</option>
                <option value="IN_APP_EVENT">IN_APP_EVENT</option>
              </select>
            </FieldShell>
            <FieldShell label="budget_mode">
              <select
                value={budgetMode}
                onChange={(e) => setBudgetMode(e.target.value as typeof budgetMode)}
                className={selectCls}
              >
                <option value="BUDGET_MODE_DAY">BUDGET_MODE_DAY</option>
                <option value="BUDGET_MODE_TOTAL">BUDGET_MODE_TOTAL</option>
              </select>
            </FieldShell>
            <FieldShell label="budget" hint="USD, ad-group level">
              <input value={budgetAmount} onChange={(e) => setBudgetAmount(e.target.value)} className={inputCls} />
            </FieldShell>
            <FieldShell label="bid_type">
              <select value={bidType} onChange={(e) => setBidType(e.target.value as typeof bidType)} className={selectCls}>
                <option value="BID_TYPE_NO_BID">BID_TYPE_NO_BID</option>
                <option value="BID_TYPE_CUSTOM">BID_TYPE_CUSTOM</option>
              </select>
            </FieldShell>
          </div>
        )}

        {step === 'Targeting' && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <FieldShell label="Locations">
              <div className="flex flex-wrap gap-1.5">
                {['US', 'GB', 'CA', 'AU', 'DE'].map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => toggleIn(locations, loc, setLocations)}
                    className={cn(
                      'rounded-sm border px-2 py-1 font-data text-[11px]',
                      locations.includes(loc) ? 'border-iris bg-iris-wash text-iris' : 'border-rule text-ink-muted',
                    )}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </FieldShell>
            <FieldShell label="Age groups">
              <div className="flex flex-wrap gap-1.5">
                {['AGE_13_17', 'AGE_18_24', 'AGE_25_34', 'AGE_35_44', 'AGE_45_54', 'AGE_55_100'].map((age) => (
                  <button
                    key={age}
                    type="button"
                    onClick={() => toggleIn(ageRanges, age, setAgeRanges)}
                    className={cn(
                      'rounded-sm border px-2 py-1 font-data text-[11px]',
                      ageRanges.includes(age) ? 'border-iris bg-iris-wash text-iris' : 'border-rule text-ink-muted',
                    )}
                  >
                    {age.replace('AGE_', '').replace('_', '-')}
                  </button>
                ))}
              </div>
            </FieldShell>
            <FieldShell label="gender">
              <select value={gender} onChange={(e) => setGender(e.target.value as typeof gender)} className={selectCls}>
                <option value="GENDER_UNLIMITED">GENDER_UNLIMITED</option>
                <option value="GENDER_MALE">GENDER_MALE</option>
                <option value="GENDER_FEMALE">GENDER_FEMALE</option>
              </select>
            </FieldShell>
            <FieldShell label="placement_type">
              <select
                value={placementType}
                onChange={(e) => setPlacementType(e.target.value as typeof placementType)}
                className={selectCls}
              >
                <option value="PLACEMENT_TYPE_AUTOMATIC">PLACEMENT_TYPE_AUTOMATIC</option>
                <option value="PLACEMENT_TYPE_NORMAL">PLACEMENT_TYPE_NORMAL (select placements)</option>
              </select>
            </FieldShell>
          </div>
        )}

        {step === 'Creative' && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FieldShell label="Ad format">
              <select value={adFormat} onChange={(e) => setAdFormat(e.target.value as typeof adFormat)} className={selectCls}>
                <option value="SINGLE_VIDEO">Single video</option>
                <option value="SPARK_AD">Spark Ad</option>
                <option value="CAROUSEL">Carousel</option>
              </select>
            </FieldShell>
            <FieldShell label="call_to_action">
              <select value={callToAction} onChange={(e) => setCallToAction(e.target.value)} className={selectCls}>
                <option value="SHOP_NOW">SHOP_NOW</option>
                <option value="LEARN_MORE">LEARN_MORE</option>
                <option value="SIGN_UP">SIGN_UP</option>
                <option value="DOWNLOAD_NOW">DOWNLOAD_NOW</option>
                <option value="CONTACT_US">CONTACT_US</option>
              </select>
            </FieldShell>
            <FieldShell label="Landing page URL" hint="required for non-Spark formats">
              <input
                value={destinationUrl}
                onChange={(e) => setDestinationUrl(e.target.value)}
                placeholder="https://"
                className={inputCls}
              />
            </FieldShell>
          </div>
        )}

        {step === 'Review' && (
          <div className="flex flex-col gap-3">
            <p className="font-ui text-[13px] text-ink-muted">
              Every field combination is validated against TikTok live below. Submit is only enabled
              when the combination is valid; creation routes through the approval + audit pipeline.
            </p>
            <Button variant="secondary" size="sm" className="w-fit gap-1.5" onClick={() => setPayloadOpen((o) => !o)}>
              {payloadOpen ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              {payloadOpen ? 'Hide payload' : 'Show payload'}
            </Button>
            {payloadOpen && (
              <pre className="overflow-x-auto rounded-md border border-rule bg-paper-sunk p-3 font-data text-[11px] leading-5 text-ink">
                {JSON.stringify(payload, null, 2)}
              </pre>
            )}
            <StudioSubmit campaignDraft={campaignDraft} />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5"
          disabled={stepIndex === 0}
          onClick={() => setStep(STUDIO_STEPS[Math.max(0, stepIndex - 1)] as StudioStep)}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Back
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="gap-1.5"
          disabled={stepIndex === STUDIO_STEPS.length - 1}
          onClick={() => setStep(STUDIO_STEPS[Math.min(STUDIO_STEPS.length - 1, stepIndex + 1)] as StudioStep)}
        >
          Next
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>

      <InsightBanner icon={FlaskConical} tone="info">
        Campaign Studio mirrors TikTok&apos;s objective_type, optimization_goal and budget_mode
        fields directly, and flags an invalid combination - like CONVERSIONS paired with a REACH
        optimization goal - the moment you select it, before Review ever sees it.
      </InsightBanner>
    </div>
  );
}

// -- Bulk Editor: multi-select table + bulk action bar --

function BulkEditorView({ tool }: ToolViewProps) {
  const [level, setLevel] = useState<'campaign' | 'ad_group' | 'ad'>('ad_group');
  const [selected] = useState<Set<string>>(new Set());

  return (
    <div className="flex flex-col gap-5">
      <ContextLine>
        Edit budget, bid or status across many campaigns, ad groups or ads at once, with an
        aggregate impact and risk preview before anything applies.
      </ContextLine>
      <ScopesLine tool={tool} />
      <PlaceholderStats
        stats={[
          { icon: Layers, label: 'Entities in scope' },
          { icon: SquareCheckBig, label: 'Selected' },
          { icon: DollarSign, label: 'Selected spend' },
          { icon: BadgeDollarSign, label: 'Selected budget' },
        ]}
      />
      <div className="flex items-center justify-between gap-3">
        <Segmented
          ariaLabel="Entity level"
          value={level}
          onChange={setLevel}
          options={[
            { value: 'campaign', label: 'Campaigns' },
            { value: 'ad_group', label: 'Ad groups' },
            { value: 'ad', label: 'Ads' },
          ]}
        />
      </div>

      <DataGrid>
        <THead>
          <TR>
            <TH>
              <Square className="h-3.5 w-3.5 text-ink-faint" aria-label="Select all" />
            </TH>
            <TH>Name</TH>
            <TH>Campaign</TH>
            <TH>Status</TH>
            <TH numeric>Budget</TH>
            <TH numeric>Bid</TH>
            <TH>Delivery</TH>
            <TH numeric>Spend</TH>
            <TH numeric>CPA</TH>
          </TR>
        </THead>
        <tbody>
          <EmptyRow cols={9}>
            {`Connect a TikTok ad account to load ${level === 'campaign' ? 'campaigns' : level === 'ad_group' ? 'ad groups' : 'ads'} for bulk editing.`}
          </EmptyRow>
        </tbody>
      </DataGrid>

      <div className="flex flex-wrap items-center gap-3 rounded-md border border-rule bg-paper-sunk p-3">
        <p className="font-ui text-[12px] font-medium text-ink-muted">{selected.size} selected</p>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" disabled className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" />
            Enable
          </Button>
          <Button variant="secondary" size="sm" disabled className="gap-1.5">
            <Ban className="h-3.5 w-3.5" />
            Pause
          </Button>
          <Button variant="secondary" size="sm" disabled>
            Edit budget
          </Button>
          <Button variant="secondary" size="sm" disabled>
            Edit bid
          </Button>
        </div>
      </div>

      <InsightBanner icon={ListChecks} tone="info">
        The bulk action bar activates once rows are selected and always shows the aggregate spend,
        budget and risk of the change before you apply it - never a silent bulk update.
      </InsightBanner>
    </div>
  );
}

// -- Targeting Explorer: interest / behavior / geo browser --

type ExplorerTab = 'interests' | 'behaviors' | 'geo';

function TargetingExplorerView({ tool }: ToolViewProps) {
  const [tab, setTab] = useState<ExplorerTab>('interests');
  const [query, setQuery] = useState('');

  const columns: Col[] =
    tab === 'geo'
      ? [
          { label: 'Region' },
          { label: 'Country' },
          { label: 'City-level targeting' },
          { label: 'Audience size', numeric: true },
        ]
      : [
          { label: 'Category' },
          { label: tab === 'interests' ? 'Interest' : 'Behavior' },
          { label: 'Audience size', numeric: true },
          { label: 'Reach index', numeric: true },
        ];

  return (
    <div className="flex flex-col gap-5">
      <ContextLine>
        Browses TikTok&apos;s interest, behavior and geo targeting catalog with live audience-size
        estimates, so Campaign Studio&apos;s Targeting step is never guesswork.
      </ContextLine>
      <ScopesLine tool={tool} />
      <PlaceholderStats
        stats={[
          { icon: Tag, label: 'Interest categories' },
          { icon: Compass, label: 'Behavior categories' },
          { icon: Globe, label: 'Countries covered' },
          { icon: Users, label: 'Estimated audience' },
        ]}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented
          ariaLabel="Targeting category"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'interests', label: 'Interests' },
            { value: 'behaviors', label: 'Behaviors' },
            { value: 'geo', label: 'Geo' },
          ]}
        />
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={tab === 'geo' ? 'Search countries...' : 'Search targeting options...'}
            className="h-8 w-56 rounded-sm border border-rule bg-paper py-1 pl-8 pr-2 font-ui text-[12px] text-ink"
          />
        </div>
      </div>
      <ToolTable
        columns={columns}
        emptyMessage="Connect a TikTok ad account to browse the live targeting catalog and audience-size estimates."
      />
      <InsightBanner icon={Target} tone="info">
        Every row here is a targeting option Campaign Studio and Bulk Editor can apply directly -
        the audience-size estimate updates as you combine interests, behaviors and geos, the same
        way TikTok Ads Manager&apos;s estimator does.
      </InsightBanner>
    </div>
  );
}

// -- Launch QA: pre-launch checklist --

function LaunchQaView({ tool }: ToolViewProps) {
  return (
    <div className="flex flex-col gap-5">
      <ContextLine>
        A pre-submit checklist across tracking, budget, targeting, creative and naming, so a
        campaign that would fail or under-perform never reaches Review clean.
      </ContextLine>
      <ScopesLine tool={tool} />
      <PlaceholderStats
        stats={[
          { icon: Check, label: 'Checks passed' },
          { icon: Ban, label: 'Checks failed' },
          { icon: CircleDot, label: 'Warnings' },
          { icon: Rocket, label: 'Ready to launch' },
        ]}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <select disabled className={cn(selectCls, 'w-64 opacity-60')}>
          <option>Select a campaign to check...</option>
        </select>
        <Button variant="primary" size="sm" disabled className="gap-1.5">
          <ClipboardCheck className="h-3.5 w-3.5" />
          Run checklist
        </Button>
      </div>
      <ToolTable
        columns={[{ label: 'Check' }, { label: 'Category' }, { label: 'Status' }, { label: 'Detail' }]}
        emptyMessage="Select a campaign above to run the pre-launch checklist. Checks cover pixel firing, budget validity, targeting reach, creative specs and naming convention."
      />
      <InsightBanner icon={ClipboardCheck} tone="info">
        Launch QA checks the TikTok Pixel is firing, the budget clears the platform minimum,
        targeting reach is not too narrow, creative specs match the ad format, and naming follows
        your convention - every check names the exact platform constraint it is checking against.
      </InsightBanner>
    </div>
  );
}

// -- Smart+ Comparator: Smart+ vs manual --

function SmartPlusView({ tool }: ToolViewProps) {
  const [range, setRange] = useState<RangeValue>('30d');
  return (
    <div className="flex flex-col gap-5">
      <ContextLine>
        Compares TikTok Smart+ automated campaigns against your manually-structured campaigns on
        the same metrics, so automation earns its budget rather than assuming it.
      </ContextLine>
      <ScopesLine tool={tool} />
      <PlaceholderStats
        stats={[
          { icon: BadgeDollarSign, label: 'Smart+ campaigns', sub: `last ${range}` },
          { icon: Layers, label: 'Manual campaigns' },
          { icon: Percent, label: 'Avg CPA delta' },
          { icon: TrendingUp, label: 'Recommended split' },
        ]}
      />
      <div className="flex items-center justify-between gap-3">
        <RangeTabs value={range} onChange={setRange} />
      </div>
      <ToolTable
        columns={[
          { label: 'Metric' },
          { label: 'Smart+', numeric: true },
          { label: 'Manual', numeric: true },
          { label: 'Delta', numeric: true },
        ]}
        emptyMessage="Connect a TikTok ad account with Smart+ campaigns running to compare them against your manual structures."
      />
      <InsightBanner icon={BadgeDollarSign} tone="info">
        Smart+ Comparator lines spend, CPA, ROAS and conversions up side by side so you can see
        whether Smart+&apos;s automated targeting and bidding is actually beating your manual
        structure - or just spending faster.
      </InsightBanner>
    </div>
  );
}

export const managementViews: ToolViewMap = {
  'campaign-studio': CampaignStudioView,
  'bulk-editor': BulkEditorView,
  'targeting-explorer': TargetingExplorerView,
  'launch-qa': LaunchQaView,
  'smart-plus': SmartPlusView,
};

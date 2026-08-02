'use client';

/**
 * Cluster: analytics. TikTok diagnostics, optimization, reporting and
 * intelligence tool views. No live data source is wired yet, so every view
 * renders the full UI shell - stats, controls, table - with placeholder
 * values and an explained empty state, per DESIGN_SYSTEM.md.
 */

import { useState, type ReactNode } from 'react';
import {
  StatTile,
  StatGrid,
  InsightBanner,
  DataGrid,
  THead,
  TR,
  TH,
  TD,
  EmptyRow,
  Segmented,
  DatePreset,
  ContextLine,
  Checkbox,
  BulkActionBar,
  TrendChart,
  Button,
  type DateRangeValue,
} from '@adsos/ui';
import {
  ScanSearch,
  Activity,
  Gauge,
  AlertTriangle,
  LineChart,
  CalendarClock,
  Recycle,
  TrendingUp,
  TrendingDown,
  Wallet,
  RefreshCw,
  Boxes,
  Coins,
  FileText,
  Scale,
  Clock,
  Percent,
  Layers,
  Target,
  DollarSign,
  Users,
  BarChart3,
  GitCompareArrows,
  CheckCircle2,
  History,
  Plus,
  Zap,
  ArrowLeftRight,
  Ban,
  type LucideIcon,
} from 'lucide-react';
import type { ToolViewMap, ToolViewProps } from './_registry';

// -- Local shell atoms --
// Segmented/DatePreset/ContextLine now live in @adsos/ui (shared across every
// cluster view); only what stays genuinely tool-view-specific is kept here.

/** Uses the tool's declared scopes (from lib/tools-registry) to ground the
 *  shell in the real TikTok capability it depends on. */
function ScopesLine({ tool }: { tool: ToolViewProps['tool'] }) {
  if (!tool.scopes || tool.scopes.length === 0) return null;
  return (
    <p className="font-ui text-[11px] text-ink-faint">TikTok scopes: {tool.scopes.join(', ')}</p>
  );
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

/** A ToolTable with a leading row-select column, for tools whose findings
 *  become bulk actions (waste/winners/losers/budget). Selection state is
 *  owned by the view; with no rows synced yet the header checkbox stays
 *  inert and the bar below renders in its idle (0 selected) state. */
function SelectableToolTable({ columns, emptyMessage }: { columns: Col[]; emptyMessage: string }) {
  return (
    <DataGrid>
      <THead>
        <TR>
          <TH className="w-8">
            <Checkbox checked={false} onCheckedChange={() => {}} disabled aria-label="Select all" />
          </TH>
          {columns.map((c) => (
            <TH key={c.label} numeric={c.numeric}>
              {c.label}
            </TH>
          ))}
        </TR>
      </THead>
      <tbody>
        <EmptyRow cols={columns.length + 1}>{emptyMessage}</EmptyRow>
      </tbody>
    </DataGrid>
  );
}

const NO_DATA = 'Connect a TikTok ad account to see live results here.';

// -- Diagnostics ------------------------------------------------------------

function DeliveryDoctorView({ tool }: ToolViewProps) {
  const [range, setRange] = useState<DateRangeValue>('30d');
  const [reason, setReason] = useState<'all' | 'learning' | 'bid' | 'audience' | 'budget'>('all');
  return (
    <div className="flex flex-col gap-5">
      <ContextLine>
        Diagnoses under-delivering ad groups with TikTok&apos;s own Ad Diagnosis signals - learning
        phase, bid competitiveness, and audience size - then pairs each reason with a proposed fix.
      </ContextLine>
      <ScopesLine tool={tool} />
      <PlaceholderStats
        stats={[
          { icon: ScanSearch, label: 'Ad groups diagnosed', sub: `last ${range}` },
          { icon: Clock, label: 'Stuck in learning' },
          { icon: DollarSign, label: 'Bid-constrained' },
          { icon: Users, label: 'Audience-constrained' },
        ]}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DatePreset value={range} onChange={setRange} />
        <Segmented
          ariaLabel="Diagnosis reason"
          value={reason}
          onChange={setReason}
          options={[
            { value: 'all', label: 'All reasons' },
            { value: 'learning', label: 'Learning phase' },
            { value: 'bid', label: 'Bid' },
            { value: 'audience', label: 'Audience' },
            { value: 'budget', label: 'Budget' },
          ]}
        />
      </div>
      <ToolTable
        columns={[
          { label: 'Ad group' },
          { label: 'Campaign' },
          { label: 'Delivery status' },
          { label: 'Learning phase' },
          { label: 'Diagnosis reason' },
          { label: 'Spend', numeric: true },
          { label: 'CPA', numeric: true },
          { label: 'Impressions', numeric: true },
          { label: 'Suggested fix' },
        ]}
        emptyMessage="Connect a TikTok ad account to run diagnosis. Ad Diagnosis needs at least 3 days of ad group delivery data."
      />
      <InsightBanner icon={ScanSearch} tone="info">
        Delivery Doctor pulls TikTok&apos;s Ad Diagnosis reason for every non-delivering or
        under-delivering ad group and pairs it with your reporting data, so you see the why -
        learning phase, bid, audience, or budget - next to the fix, not just a red status dot.
      </InsightBanner>
    </div>
  );
}

function HealthScoreView({ tool }: ToolViewProps) {
  const [range, setRange] = useState<DateRangeValue>('30d');
  return (
    <div className="flex flex-col gap-5">
      <ContextLine>
        A single composite score built from delivery, tracking, structure and spend signals across
        every connected ad account, so you know where to look first.
      </ContextLine>
      <ScopesLine tool={tool} />
      <PlaceholderStats
        stats={[
          { icon: Activity, label: 'Overall health score', sub: `last ${range}` },
          { icon: Gauge, label: 'Delivery health' },
          { icon: CheckCircle2, label: 'Tracking health' },
          { icon: Layers, label: 'Structure health' },
        ]}
      />
      <div className="flex items-center justify-between gap-3">
        <DatePreset value={range} onChange={setRange} />
      </div>
      <ToolTable
        columns={[
          { label: 'Component' },
          { label: 'Score', numeric: true },
          { label: 'Status' },
          { label: 'Signal' },
          { label: 'Trend', numeric: true },
        ]}
        emptyMessage={NO_DATA}
      />
      <InsightBanner icon={Activity} tone="info">
        Account Health Score rolls delivery, tracking and structure into one number, then breaks it
        back down by component so a dropping score always points at a specific, fixable cause.
      </InsightBanner>
    </div>
  );
}

function BudgetPacingView({ tool }: ToolViewProps) {
  const [range, setRange] = useState<DateRangeValue>('30d');
  return (
    <div className="flex flex-col gap-5">
      <ContextLine>
        Compares spend-to-date against ideal pace for every active campaign and projects the
        end-of-period total, so pacing drift shows up before the budget runs out early - or under-spends.
      </ContextLine>
      <ScopesLine tool={tool} />
      <PlaceholderStats
        stats={[
          { icon: Wallet, label: 'Spend to date' },
          { icon: Gauge, label: 'Ideal pace' },
          { icon: TrendingUp, label: 'Projected EOP spend' },
          { icon: AlertTriangle, label: 'Pacing variance' },
        ]}
      />
      <div className="flex items-center justify-between gap-3">
        <DatePreset value={range} onChange={setRange} />
      </div>
      <TrendChart
        xKey="day"
        series={[
          { key: 'actual', label: 'Actual spend' },
          { key: 'ideal', label: 'Ideal pace' },
        ]}
        emptyLabel="Pacing curve renders once daily spend has synced for the selected range"
      />
      <ToolTable
        columns={[
          { label: 'Campaign' },
          { label: 'Daily budget', numeric: true },
          { label: 'Spend to date', numeric: true },
          { label: 'Ideal pace', numeric: true },
          { label: 'Actual pace', numeric: true },
          { label: 'Projected EOP', numeric: true },
          { label: 'Status' },
        ]}
        emptyMessage={NO_DATA}
      />
      <InsightBanner icon={Gauge} tone="info">
        Budget Pacing projects every campaign to period end using its trailing daily spend rate, so
        you can catch a budget that will cap out on day 20 - or finish 40% under - while there is
        still time to act.
      </InsightBanner>
    </div>
  );
}

function AnomalyInvestigatorView({ tool }: ToolViewProps) {
  const [range, setRange] = useState<DateRangeValue>('30d');
  const [metric, setMetric] = useState<'all' | 'spend' | 'cpa' | 'ctr' | 'cvr'>('all');
  return (
    <div className="flex flex-col gap-5">
      <ContextLine>
        Flags spend, CPA, CTR and CVR moves that break from the trailing baseline, ranked by
        severity, with the entity and time window that drove each one.
      </ContextLine>
      <ScopesLine tool={tool} />
      <PlaceholderStats
        stats={[
          { icon: AlertTriangle, label: 'Anomalies detected', sub: `last ${range}` },
          { icon: Zap, label: 'Highest severity' },
          { icon: DollarSign, label: 'Spend impacted' },
          { icon: BarChart3, label: 'Metrics affected' },
        ]}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DatePreset value={range} onChange={setRange} />
        <Segmented
          ariaLabel="Metric filter"
          value={metric}
          onChange={setMetric}
          options={[
            { value: 'all', label: 'All metrics' },
            { value: 'spend', label: 'Spend' },
            { value: 'cpa', label: 'CPA' },
            { value: 'ctr', label: 'CTR' },
            { value: 'cvr', label: 'CVR' },
          ]}
        />
      </div>
      <TrendChart
        xKey="day"
        series={[
          { key: 'actual', label: 'Actual' },
          { key: 'baseline', label: 'Trailing baseline' },
        ]}
        emptyLabel="Baseline vs. actual renders once a trailing window has synced"
      />
      <ToolTable
        columns={[
          { label: 'Entity' },
          { label: 'Metric' },
          { label: 'Baseline', numeric: true },
          { label: 'Actual', numeric: true },
          { label: 'Deviation', numeric: true },
          { label: 'Severity' },
          { label: 'Detected at' },
        ]}
        emptyMessage={NO_DATA}
      />
      <InsightBanner icon={AlertTriangle} tone="info">
        Anomaly Investigator compares each entity&apos;s metric against its own trailing baseline,
        not a fixed threshold, so a small account and a large one both get anomalies sized to what
        is actually unusual for them.
      </InsightBanner>
    </div>
  );
}

function PerformanceChangeView({ tool }: ToolViewProps) {
  const [range, setRange] = useState<DateRangeValue>('30d');
  return (
    <div className="flex flex-col gap-5">
      <ContextLine>
        Shows what moved period-over-period and attributes the shift to the campaign, ad group or
        ad that drove it - so a swing in the account total always traces to a cause.
      </ContextLine>
      <ScopesLine tool={tool} />
      <PlaceholderStats
        stats={[
          { icon: DollarSign, label: 'Spend change' },
          { icon: TrendingDown, label: 'CPA change' },
          { icon: TrendingUp, label: 'Conversions change' },
          { icon: LineChart, label: 'ROAS change' },
        ]}
      />
      <div className="flex items-center justify-between gap-3">
        <DatePreset value={range} onChange={setRange} />
      </div>
      <TrendChart
        xKey="day"
        series={[
          { key: 'current', label: 'Current period' },
          { key: 'prior', label: 'Prior period' },
        ]}
        emptyLabel="Period-over-period trend renders once two full periods have synced"
      />
      <ToolTable
        columns={[
          { label: 'Entity' },
          { label: 'Metric' },
          { label: 'Prior period', numeric: true },
          { label: 'Current period', numeric: true },
          { label: 'Change', numeric: true },
          { label: 'Primary driver' },
        ]}
        emptyMessage={NO_DATA}
      />
      <InsightBanner icon={LineChart} tone="info">
        Performance Change compares the selected period against the prior one of equal length and
        ranks entities by contribution to the move, so the top row is always the biggest reason the
        account total changed.
      </InsightBanner>
    </div>
  );
}

function ChangeHistoryView({ tool }: ToolViewProps) {
  const [range, setRange] = useState<DateRangeValue>('30d');
  const [type, setType] = useState<'all' | 'budget' | 'bid' | 'targeting' | 'status'>('all');
  return (
    <div className="flex flex-col gap-5">
      <ContextLine>
        A timeline of every configuration change - yours, an automated rule&apos;s, or TikTok&apos;s -
        correlated with the performance shift that followed it.
      </ContextLine>
      <ScopesLine tool={tool} />
      <PlaceholderStats
        stats={[
          { icon: History, label: 'Changes logged', sub: `last ${range}` },
          { icon: GitCompareArrows, label: 'Tied to a shift' },
          { icon: Wallet, label: 'Budget changes' },
          { icon: Target, label: 'Targeting changes' },
        ]}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DatePreset value={range} onChange={setRange} />
        <Segmented
          ariaLabel="Change type"
          value={type}
          onChange={setType}
          options={[
            { value: 'all', label: 'All changes' },
            { value: 'budget', label: 'Budget' },
            { value: 'bid', label: 'Bid' },
            { value: 'targeting', label: 'Targeting' },
            { value: 'status', label: 'Status' },
          ]}
        />
      </div>
      <ToolTable
        columns={[
          { label: 'Timestamp' },
          { label: 'Entity' },
          { label: 'Field' },
          { label: 'From' },
          { label: 'To' },
          { label: 'Actor' },
          { label: 'Performance impact' },
        ]}
        emptyMessage={NO_DATA}
      />
      <InsightBanner icon={CalendarClock} tone="info">
        Change History lines every field change up against the metric trend around it, so you can
        tell whether last Tuesday&apos;s bid edit actually caused the CPA jump - or was a coincidence.
      </InsightBanner>
    </div>
  );
}

// -- Optimization -----------------------------------------------------------

type Sensitivity = 'conservative' | 'balanced' | 'aggressive';
const SENSITIVITY_OPTIONS: { value: Sensitivity; label: string }[] = [
  { value: 'conservative', label: 'Conservative' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'aggressive', label: 'Aggressive' },
];

function WasteFinderView({ tool }: ToolViewProps) {
  const [range, setRange] = useState<DateRangeValue>('30d');
  const [sensitivity, setSensitivity] = useState<Sensitivity>('balanced');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  return (
    <div className="flex flex-col gap-5">
      <ContextLine>
        Surfaces spend with no return - dead ad groups, zero-conversion targets and wasted
        impressions - ranked by how confidently each one looks like waste.
      </ContextLine>
      <ScopesLine tool={tool} />
      <PlaceholderStats
        stats={[
          { icon: Recycle, label: 'Wasted spend', sub: `last ${range}` },
          { icon: DollarSign, label: 'Zero-conversion ad groups' },
          { icon: Target, label: 'Dead targets' },
          { icon: BarChart3, label: 'Wasted impressions' },
        ]}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DatePreset value={range} onChange={setRange} />
        <Segmented ariaLabel="Sensitivity" value={sensitivity} onChange={setSensitivity} options={SENSITIVITY_OPTIONS} />
      </div>
      <SelectableToolTable
        columns={[
          { label: 'Ad group' },
          { label: 'Campaign' },
          { label: 'Spend', numeric: true },
          { label: 'Impressions', numeric: true },
          { label: 'Conversions', numeric: true },
          { label: 'CPA', numeric: true },
          { label: 'Reason' },
          { label: 'Confidence' },
        ]}
        emptyMessage={NO_DATA}
      />
      <BulkActionBar
        count={selected.size}
        onClear={() => setSelected(new Set())}
        actions={
          <>
            <Button variant="secondary" size="sm" disabled={selected.size === 0} className="gap-1.5">
              <Ban className="h-3.5 w-3.5" />
              Pause selected
            </Button>
            <Button variant="destructive" size="sm" disabled={selected.size === 0}>
              Remove wasted spend
            </Button>
          </>
        }
      />
      <InsightBanner icon={Recycle} tone="info">
        Waste Finder flags ad groups spending with zero or near-zero conversions, scores each one
        strong / likely / review, and pre-selects the clear cases so cleanup is a shortlist, not a
        spreadsheet hunt.
      </InsightBanner>
    </div>
  );
}

function UnderfundedWinnerView({ tool }: ToolViewProps) {
  const [range, setRange] = useState<DateRangeValue>('30d');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  return (
    <div className="flex flex-col gap-5">
      <ContextLine>
        Finds budget-capped ad groups with strong CPA that could scale further if given more
        budget - the opposite problem to waste.
      </ContextLine>
      <ScopesLine tool={tool} />
      <PlaceholderStats
        stats={[
          { icon: TrendingUp, label: 'Underfunded winners', sub: `last ${range}` },
          { icon: Clock, label: 'Avg budget-capped days' },
          { icon: DollarSign, label: 'Avg CPA of winners' },
          { icon: Wallet, label: 'Extra budget suggested' },
        ]}
      />
      <div className="flex items-center justify-between gap-3">
        <DatePreset value={range} onChange={setRange} />
      </div>
      <SelectableToolTable
        columns={[
          { label: 'Ad group' },
          { label: 'Campaign' },
          { label: 'CPA', numeric: true },
          { label: 'ROAS', numeric: true },
          { label: 'Budget-capped days', numeric: true },
          { label: 'Current budget', numeric: true },
          { label: 'Suggested budget', numeric: true },
        ]}
        emptyMessage={NO_DATA}
      />
      <BulkActionBar
        count={selected.size}
        onClear={() => setSelected(new Set())}
        actions={
          <Button variant="primary" size="sm" disabled={selected.size === 0} className="gap-1.5">
            <Wallet className="h-3.5 w-3.5" />
            Apply suggested budget
          </Button>
        }
      />
      <InsightBanner icon={TrendingUp} tone="info">
        Underfunded Winner looks for ad groups that hit their daily cap repeatedly while holding a
        CPA below the campaign average - evidence there is more efficient volume on the table if
        the budget allows it.
      </InsightBanner>
    </div>
  );
}

function OverspendingLoserView({ tool }: ToolViewProps) {
  const [range, setRange] = useState<DateRangeValue>('30d');
  const [sensitivity, setSensitivity] = useState<Sensitivity>('balanced');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  return (
    <div className="flex flex-col gap-5">
      <ContextLine>
        Surfaces high-spend, weak-return ad groups - candidates to trim, pause, or rework before
        they keep drawing budget.
      </ContextLine>
      <ScopesLine tool={tool} />
      <PlaceholderStats
        stats={[
          { icon: TrendingDown, label: 'Losers found', sub: `last ${range}` },
          { icon: DollarSign, label: 'Spend at risk' },
          { icon: Percent, label: 'Avg CPA of losers' },
          { icon: Recycle, label: 'Recommended trims' },
        ]}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DatePreset value={range} onChange={setRange} />
        <Segmented ariaLabel="Sensitivity" value={sensitivity} onChange={setSensitivity} options={SENSITIVITY_OPTIONS} />
      </div>
      <SelectableToolTable
        columns={[
          { label: 'Ad group' },
          { label: 'Campaign' },
          { label: 'Spend', numeric: true },
          { label: 'CPA', numeric: true },
          { label: 'ROAS', numeric: true },
          { label: 'Conversions', numeric: true },
          { label: 'Suggested action' },
        ]}
        emptyMessage={NO_DATA}
      />
      <BulkActionBar
        count={selected.size}
        onClear={() => setSelected(new Set())}
        actions={
          <>
            <Button variant="secondary" size="sm" disabled={selected.size === 0} className="gap-1.5">
              <Ban className="h-3.5 w-3.5" />
              Pause selected
            </Button>
            <Button variant="destructive" size="sm" disabled={selected.size === 0}>
              Trim budget
            </Button>
          </>
        }
      />
      <InsightBanner icon={TrendingDown} tone="info">
        Overspending Loser ranks ad groups by spend that is not converting at an acceptable CPA or
        ROAS, and separates a quick trim from a full pause based on how far off target each one is.
      </InsightBanner>
    </div>
  );
}

function BudgetReallocatorView({ tool }: ToolViewProps) {
  const [range, setRange] = useState<DateRangeValue>('30d');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  return (
    <div className="flex flex-col gap-5">
      <ContextLine>
        Proposes moving budget from underperforming ad groups to strong ones inside your
        guardrails, with the projected conversion lift for every move.
      </ContextLine>
      <ScopesLine tool={tool} />
      <PlaceholderStats
        stats={[
          { icon: ArrowLeftRight, label: 'Reallocation opportunities', sub: `last ${range}` },
          { icon: Wallet, label: 'Budget to move' },
          { icon: TrendingUp, label: 'Projected conversion lift' },
          { icon: AlertTriangle, label: 'Guardrail breaches' },
        ]}
      />
      <div className="flex items-center justify-between gap-3">
        <DatePreset value={range} onChange={setRange} />
      </div>
      <SelectableToolTable
        columns={[
          { label: 'From ad group' },
          { label: 'To ad group' },
          { label: 'Amount', numeric: true },
          { label: 'Reason' },
          { label: 'Risk' },
          { label: 'Status' },
        ]}
        emptyMessage={NO_DATA}
      />
      <BulkActionBar
        count={selected.size}
        onClear={() => setSelected(new Set())}
        actions={
          <Button variant="primary" size="sm" disabled={selected.size === 0} className="gap-1.5">
            <ArrowLeftRight className="h-3.5 w-3.5" />
            Apply reallocation
          </Button>
        }
      />
      <InsightBanner icon={ArrowLeftRight} tone="info">
        Budget Reallocator pairs every proposed move with the guardrail it was checked against -
        max daily change, min remaining budget, cooldown - so a reallocation never exceeds what you
        have allowed it to do unattended.
      </InsightBanner>
    </div>
  );
}

function AutomationRulesView({ tool }: ToolViewProps) {
  const [range, setRange] = useState<DateRangeValue>('30d');
  const [trigger, setTrigger] = useState('cpa_above');
  const [action, setAction] = useState('pause_ad_group');
  return (
    <div className="flex flex-col gap-5">
      <ContextLine>
        Threshold, cooldown and cap rules that either propose an action for review or push a
        native TikTok Automated Rule directly through the Automated Rules API.
      </ContextLine>
      <ScopesLine tool={tool} />
      <PlaceholderStats
        stats={[
          { icon: RefreshCw, label: 'Active rules' },
          { icon: Zap, label: 'Triggered', sub: `last ${range}` },
          { icon: CheckCircle2, label: 'Actions taken' },
          { icon: AlertTriangle, label: 'Paused by a rule' },
        ]}
      />
      <div className="flex items-center justify-between gap-3">
        <DatePreset value={range} onChange={setRange} />
      </div>

      <ToolTable
        columns={[
          { label: 'Rule' },
          { label: 'Condition' },
          { label: 'Action' },
          { label: 'Scope' },
          { label: 'Status' },
          { label: 'Last triggered' },
        ]}
        emptyMessage="No automated rules yet. Create one below, or connect a TikTok ad account to import existing native rules."
      />

      <div className="flex flex-col gap-3 rounded-md border border-rule bg-paper p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-label text-ink-muted">New rule</h3>
          <span className="inline-flex items-center gap-1 font-ui text-[11px] text-ink-faint">
            <Plus className="h-3 w-3" />
            controls only, not yet wired to save
          </span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <FieldShell label="Trigger metric">
            <select
              value={trigger}
              onChange={(e) => setTrigger(e.target.value)}
              className="h-[38px] w-full rounded-md border border-rule bg-paper px-2 font-ui text-[13px] text-ink"
            >
              <option value="cpa_above">CPA above</option>
              <option value="spend_above">Spend above</option>
              <option value="ctr_below">CTR below</option>
              <option value="cvr_below">CVR below</option>
              <option value="budget_capped">Budget-capped days</option>
            </select>
          </FieldShell>
          <FieldShell label="Threshold">
            <input
              type="number"
              placeholder="0.00"
              className="h-[38px] w-full rounded-md border border-rule bg-paper px-2 font-data text-[13px] text-ink"
            />
          </FieldShell>
          <FieldShell label="Action">
            <select
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="h-[38px] w-full rounded-md border border-rule bg-paper px-2 font-ui text-[13px] text-ink"
            >
              <option value="pause_ad_group">Pause ad group</option>
              <option value="lower_bid">Lower bid</option>
              <option value="lower_budget">Lower budget</option>
              <option value="notify_only">Notify only</option>
            </select>
          </FieldShell>
          <FieldShell label="Cooldown">
            <select className="h-[38px] w-full rounded-md border border-rule bg-paper px-2 font-ui text-[13px] text-ink">
              <option>24 hours</option>
              <option>48 hours</option>
              <option>7 days</option>
            </select>
          </FieldShell>
        </div>
      </div>

      <InsightBanner icon={RefreshCw} tone="info">
        Automated Rules can stay a proposal-only guardrail, or be pushed as a real TikTok Automated
        Rule via the Automated Rules scope - either way, every trigger and every action taken is
        logged here.
      </InsightBanner>
    </div>
  );
}

function FieldShell({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-label text-ink-muted">{label}</span>
      {children}
    </div>
  );
}

function ConsolidationView({ tool }: ToolViewProps) {
  const [range, setRange] = useState<DateRangeValue>('30d');
  return (
    <div className="flex flex-col gap-5">
      <ContextLine>
        Finds fragmented, low-volume ad groups that split conversion signal thin enough that none
        of them can exit the TikTok learning phase, and proposes how to merge them.
      </ContextLine>
      <ScopesLine tool={tool} />
      <PlaceholderStats
        stats={[
          { icon: Boxes, label: 'Fragmented ad groups', sub: `last ${range}` },
          { icon: GitCompareArrows, label: 'Consolidation candidates' },
          { icon: Clock, label: 'Stuck in learning' },
          { icon: Layers, label: 'Estimated merges' },
        ]}
      />
      <div className="flex items-center justify-between gap-3">
        <DatePreset value={range} onChange={setRange} />
      </div>
      <ToolTable
        columns={[
          { label: 'Campaign' },
          { label: 'Ad groups to merge' },
          { label: 'Combined spend', numeric: true },
          { label: 'Combined conversions', numeric: true },
          { label: 'Reason' },
          { label: 'Suggested merged budget', numeric: true },
        ]}
        emptyMessage={NO_DATA}
      />
      <InsightBanner icon={Boxes} tone="info">
        Consolidation groups ad groups that target near-identical audiences at low individual
        volume, and estimates whether merging them clears the 50-conversion learning-phase
        threshold faster than leaving them split.
      </InsightBanner>
    </div>
  );
}

// -- Reporting ----------------------------------------------------------------

function ProfitabilityView({ tool }: ToolViewProps) {
  const [range, setRange] = useState<DateRangeValue>('30d');
  return (
    <div className="flex flex-col gap-5">
      <ContextLine>
        True ROAS and net profit using real billed spend from Payment Portfolio and product margins
        from your catalog - not just platform-reported spend and revenue.
      </ContextLine>
      <ScopesLine tool={tool} />
      <PlaceholderStats
        stats={[
          { icon: DollarSign, label: 'Billed spend', sub: `last ${range}` },
          { icon: Coins, label: 'Revenue' },
          { icon: Wallet, label: 'Net profit' },
          { icon: TrendingUp, label: 'True ROAS' },
        ]}
      />
      <div className="flex items-center justify-between gap-3">
        <DatePreset value={range} onChange={setRange} />
      </div>
      <ToolTable
        columns={[
          { label: 'Campaign' },
          { label: 'Ad spend', numeric: true },
          { label: 'Platform fees', numeric: true },
          { label: 'Revenue', numeric: true },
          { label: 'Product margin', numeric: true },
          { label: 'Net profit', numeric: true },
          { label: 'True ROAS', numeric: true },
        ]}
        emptyMessage="Connect a TikTok ad account and a Payment Portfolio billing source to see true P&L. Platform spend alone understates true cost."
      />
      <InsightBanner icon={Coins} tone="info">
        Profitability keeps media spend, platform fees and product margin as separate lines and
        never sums them into one figure, so the net-profit column is always traceable back to its
        parts.
      </InsightBanner>
    </div>
  );
}

function CustomReportsView({ tool }: ToolViewProps) {
  const [range, setRange] = useState<DateRangeValue>('30d');
  const [dimension, setDimension] = useState('campaign');
  const [metric, setMetric] = useState('spend');
  return (
    <div className="flex flex-col gap-5">
      <ContextLine>
        Build and schedule reports across any TikTok reporting dimension and metric, saved for
        reuse and exportable to your agency&apos;s reporting stack.
      </ContextLine>
      <ScopesLine tool={tool} />
      <PlaceholderStats
        stats={[
          { icon: FileText, label: 'Saved reports' },
          { icon: CalendarClock, label: 'Scheduled reports' },
          { icon: Layers, label: 'Dimensions available' },
          { icon: BarChart3, label: 'Metrics available' },
        ]}
      />
      <div className="flex flex-wrap items-center gap-3">
        <DatePreset value={range} onChange={setRange} />
        <FieldShell label="Dimension">
          <select
            value={dimension}
            onChange={(e) => setDimension(e.target.value)}
            className="h-8 rounded-sm border border-rule bg-paper px-2 font-ui text-[12px] text-ink"
          >
            <option value="campaign">Campaign</option>
            <option value="ad_group">Ad group</option>
            <option value="ad">Ad</option>
            <option value="advertiser">Advertiser</option>
          </select>
        </FieldShell>
        <FieldShell label="Metric">
          <select
            value={metric}
            onChange={(e) => setMetric(e.target.value)}
            className="h-8 rounded-sm border border-rule bg-paper px-2 font-ui text-[12px] text-ink"
          >
            <option value="spend">Spend</option>
            <option value="cpa">CPA</option>
            <option value="roas">ROAS</option>
            <option value="ctr">CTR</option>
          </select>
        </FieldShell>
      </div>
      <ToolTable
        columns={[
          { label: 'Report name' },
          { label: 'Dimensions' },
          { label: 'Metrics' },
          { label: 'Schedule' },
          { label: 'Last run' },
          { label: 'Owner' },
        ]}
        emptyMessage="No saved reports yet. Pick a dimension and metric above to start one, or connect an account to import TikTok's standard reports."
      />
      <InsightBanner icon={FileText} tone="info">
        Custom Reports lets you cross any dimension - advertiser, campaign, ad group, ad - with any
        metric TikTok Reporting exposes, then save and schedule the combination for recurring
        delivery.
      </InsightBanner>
    </div>
  );
}

function BenchmarkingView({ tool }: ToolViewProps) {
  const [range, setRange] = useState<DateRangeValue>('30d');
  const [industry, setIndustry] = useState('ecommerce');
  return (
    <div className="flex flex-col gap-5">
      <ContextLine>
        Benchmarks a client account over time and against TikTok Partner Insights industry data, so
        a CPA can be judged against the market, not just last month.
      </ContextLine>
      <ScopesLine tool={tool} />
      <PlaceholderStats
        stats={[
          { icon: Scale, label: 'CPA vs benchmark', sub: `last ${range}` },
          { icon: Percent, label: 'CTR vs benchmark' },
          { icon: TrendingUp, label: 'CVR vs benchmark' },
          { icon: BarChart3, label: 'Percentile rank' },
        ]}
      />
      <div className="flex flex-wrap items-center gap-3">
        <DatePreset value={range} onChange={setRange} />
        <FieldShell label="Industry">
          <select
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            className="h-8 rounded-sm border border-rule bg-paper px-2 font-ui text-[12px] text-ink"
          >
            <option value="ecommerce">Ecommerce</option>
            <option value="app">App / gaming</option>
            <option value="lead_gen">Lead generation</option>
            <option value="retail">Retail</option>
          </select>
        </FieldShell>
      </div>
      <ToolTable
        columns={[
          { label: 'Metric' },
          { label: 'Your value', numeric: true },
          { label: 'Industry median', numeric: true },
          { label: 'Top quartile', numeric: true },
          { label: 'Gap', numeric: true },
          { label: 'Percentile', numeric: true },
        ]}
        emptyMessage="Connect a TikTok ad account with Partner Insights access to compare your metrics against industry benchmarks."
      />
      <InsightBanner icon={Scale} tone="info">
        Benchmarking pairs your trailing metrics with TikTok Partner Insights industry data for the
        selected vertical, so a number that looks fine in isolation shows up when it is actually
        behind the market.
      </InsightBanner>
    </div>
  );
}

export const analyticsViews: ToolViewMap = {
  'delivery-doctor': DeliveryDoctorView,
  'health-score': HealthScoreView,
  'budget-pacing': BudgetPacingView,
  'anomaly-investigator': AnomalyInvestigatorView,
  'performance-change': PerformanceChangeView,
  'change-history': ChangeHistoryView,
  'waste-finder': WasteFinderView,
  'underfunded-winner': UnderfundedWinnerView,
  'overspending-loser': OverspendingLoserView,
  'budget-reallocator': BudgetReallocatorView,
  'automation-rules': AutomationRulesView,
  consolidation: ConsolidationView,
  profitability: ProfitabilityView,
  'custom-reports': CustomReportsView,
  benchmarking: BenchmarkingView,
};

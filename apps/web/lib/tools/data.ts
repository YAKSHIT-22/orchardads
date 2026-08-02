import 'server-only';
import type { WorkspaceContext } from '@adsos/db';
import {
  type AccountTotals,
  type EntityRowStat,
  accountTotals,
  entityRowStats,
  healthScore,
  money,
} from '@adsos/recommendations';
import { loadAccountContext } from '../data/platform';

/** A unified per-tool data payload the views render. Empty when not connected. */
export type ToolStat = { label: string; value: string; sub?: string; tone?: 'neutral' | 'positive' | 'attention' | 'risk' | 'iris' };
export type ToolColumn = { key: string; label: string; numeric?: boolean };
export type ToolRow = { id: string; cells: Record<string, string | number>; tone?: 'neutral' | 'attention' | 'risk' | 'positive' };

export type ToolData = {
  connected: boolean;
  stats: ToolStat[];
  columns: ToolColumn[];
  rows: ToolRow[];
  insight?: string;
  currency: string;
};

const pct = (n: number) => `${(n * 100).toFixed(2)}%`;

function baseStats(t: AccountTotals): ToolStat[] {
  return [
    { label: 'Spend (30 d)', value: money(t.spend, t.currency) },
    { label: 'CPA', value: t.cpa != null ? money(t.cpa, t.currency) : '-', tone: 'iris', sub: 'lower is better' },
    { label: 'CTR', value: pct(t.ctr) },
    { label: 'Conversions', value: String(t.conversions), sub: `${t.entityCount} ad groups` },
  ];
}

const PERF_COLUMNS: ToolColumn[] = [
  { key: 'name', label: 'Ad group' },
  { key: 'spend', label: 'Spend', numeric: true },
  { key: 'impressions', label: 'Impr.', numeric: true },
  { key: 'clicks', label: 'Clicks', numeric: true },
  { key: 'ctr', label: 'CTR', numeric: true },
  { key: 'conversions', label: 'Conv.', numeric: true },
  { key: 'cpa', label: 'CPA', numeric: true },
  { key: 'roas', label: 'ROAS', numeric: true },
];

function perfRow(r: EntityRowStat, currency: string): ToolRow {
  return {
    id: r.entityId,
    cells: {
      name: r.entityName,
      spend: money(r.spend, currency),
      impressions: r.impressions.toLocaleString(),
      clicks: r.clicks.toLocaleString(),
      ctr: pct(r.ctr),
      conversions: String(r.conversions),
      cpa: r.cpa != null ? money(r.cpa, currency) : '-',
      roas: r.roas != null ? `${r.roas.toFixed(2)}x` : '-',
    },
  };
}

/**
 * Compute a tool's data from the synced store. Metric-backed tools (diagnostics,
 * optimization, reporting) return real stats + rows; tools that need un-synced API
 * surfaces (creatives, comments, creators) return connected:true with an empty set
 * and an insight so the view shows an honest "syncing / not available" state.
 */
export async function getToolData(slug: string, ctx: WorkspaceContext): Promise<ToolData> {
  const empty: ToolData = { connected: false, stats: [], columns: [], rows: [], currency: 'USD' };
  const loaded = await loadAccountContext('TIKTOK', ctx);
  if (!loaded) return empty;

  const { accountContext } = loaded;
  const totals = accountTotals(accountContext);
  const rows = entityRowStats(accountContext);
  const currency = totals.currency;
  const med = medianCpa(rows);

  switch (slug) {
    case 'health-score': {
      const h = healthScore(accountContext);
      return {
        connected: true,
        currency,
        stats: [
          { label: 'Health score', value: `${h.score}/100`, tone: h.score >= 70 ? 'positive' : h.score >= 40 ? 'attention' : 'risk' },
          ...h.factors.slice(0, 3).map((f) => ({ label: f.label, value: `${f.points}`, sub: f.note })),
        ],
        columns: [
          { key: 'factor', label: 'Factor' },
          { key: 'points', label: 'Points', numeric: true },
          { key: 'note', label: 'Detail' },
        ],
        rows: h.factors.map((f) => ({ id: f.label, cells: { factor: f.label, points: f.points, note: f.note } })),
        insight: 'Composite score from tracking, spend efficiency, CPA consistency and structure.',
      };
    }
    case 'waste-finder': {
      const waste = rows.filter((r) => r.conversions === 0 && r.spend > 0).sort((a, b) => b.spend - a.spend);
      return {
        connected: true,
        currency,
        stats: [
          { label: 'Wasted spend', value: money(waste.reduce((s, r) => s + r.spend, 0), currency), tone: 'risk' },
          { label: 'Ad groups', value: String(waste.length), sub: 'zero conversions' },
          { label: 'Total spend', value: money(totals.spend, currency) },
          { label: 'CTR', value: pct(totals.ctr) },
        ],
        columns: PERF_COLUMNS,
        rows: waste.map((r) => ({ ...perfRow(r, currency), tone: 'risk' })),
        insight: 'Ad groups spending with no conversions in the last 30 days - candidates to pause.',
      };
    }
    case 'overspending-loser': {
      const losers = med == null ? [] : rows.filter((r) => r.cpa != null && r.cpa >= med * 1.5).sort((a, b) => (b.cpa ?? 0) - (a.cpa ?? 0));
      return {
        connected: true,
        currency,
        stats: baseStats(totals),
        columns: PERF_COLUMNS,
        rows: losers.map((r) => ({ ...perfRow(r, currency), tone: 'attention' })),
        insight: med == null ? 'Not enough conversions yet to rank by CPA.' : `CPA at least 1.5x the account median (${money(med, currency)}).`,
      };
    }
    case 'underfunded-winner': {
      const winners = med == null ? [] : rows.filter((r) => r.cpa != null && r.cpa <= med * 0.75).sort((a, b) => (a.cpa ?? 0) - (b.cpa ?? 0));
      return {
        connected: true,
        currency,
        stats: baseStats(totals),
        columns: PERF_COLUMNS,
        rows: winners.map((r) => ({ ...perfRow(r, currency), tone: 'positive' })),
        insight: med == null ? 'Not enough conversions yet to find winners.' : `Strong CPA (under 0.75x the ${money(med, currency)} median) - candidates to scale.`,
      };
    }
    case 'profitability': {
      const revenue = rows.reduce((s, r) => s + (r.roas != null ? r.roas * r.spend : 0), 0);
      return {
        connected: true,
        currency,
        stats: [
          { label: 'Media spend', value: money(totals.spend, currency) },
          { label: 'Est. revenue', value: money(revenue, currency), tone: 'positive' },
          { label: 'Net', value: money(revenue - totals.spend, currency), tone: revenue >= totals.spend ? 'positive' : 'risk' },
          { label: 'Blended ROAS', value: totals.roas != null ? `${totals.roas.toFixed(2)}x` : '-', tone: 'iris' },
        ],
        columns: [
          { key: 'name', label: 'Ad group' },
          { key: 'spend', label: 'Spend', numeric: true },
          { key: 'revenue', label: 'Revenue', numeric: true },
          { key: 'roas', label: 'ROAS', numeric: true },
          { key: 'net', label: 'Net', numeric: true },
        ],
        rows: rows.map((r) => {
          const rev = r.roas != null ? r.roas * r.spend : 0;
          return { id: r.entityId, cells: { name: r.entityName, spend: money(r.spend, currency), revenue: money(rev, currency), roas: r.roas != null ? `${r.roas.toFixed(2)}x` : '-', net: money(rev - r.spend, currency) }, tone: rev >= r.spend ? 'positive' : 'risk' };
        }),
        insight: 'Media spend and platform fees shown apart from revenue. True ROAS, not blended platform spend.',
      };
    }
    // Generic performance tools: real per-ad-group table.
    case 'anomaly-investigator':
    case 'performance-change':
    case 'budget-pacing':
    case 'budget-reallocator':
    case 'bid-optimizer':
    case 'consolidation':
    case 'custom-reports':
    case 'benchmarking':
    case 'delivery-doctor':
    case 'creative-fatigue': {
      return {
        connected: true,
        currency,
        stats: baseStats(totals),
        columns: PERF_COLUMNS,
        rows: rows.map((r) => perfRow(r, currency)),
        insight: 'Live per-ad-group performance from your last 30 days of synced data.',
      };
    }
    default:
      // Tool needs API data we do not sync yet (creatives, comments, creators,
      // audiences, pixel diagnostics). Connected, but nothing to show until that
      // sync lands - the view renders an honest "not available yet" state.
      return { connected: true, stats: [], columns: [], rows: [], currency, insight: 'This tool activates when its data source is synced for the connected account.' };
  }
}

function medianCpa(rows: EntityRowStat[]): number | null {
  const cpas = rows.map((r) => r.cpa).filter((c): c is number => c != null).sort((a, b) => a - b);
  if (cpas.length === 0) return null;
  const m = Math.floor(cpas.length / 2);
  return cpas.length % 2 ? (cpas[m] as number) : ((cpas[m - 1] as number) + (cpas[m] as number)) / 2;
}

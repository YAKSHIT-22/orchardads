import type { LucideIcon } from 'lucide-react';
import type * as React from 'react';
import { cn } from '../cn';
import { Sparkline } from './sparkline';

/**
 * Shared tool-page kit, re-skinned from handyAds' optimize/ui to our tokens.
 * Presentation-only: analysis/data lives elsewhere. Chrome stays achromatic;
 * colour is rationed to state (applied/attention/risk) + the iris "next action".
 */

export type StatTone = 'neutral' | 'positive' | 'attention' | 'risk' | 'iris';

/** A bordered stat tile: icon chip + label + big data value + sub, with an
 *  optional inline sparkline (only pass `spark` for a real synced series -
 *  never fabricate one to fill the empty-state layout). */
export function StatTile({
  icon: Icon,
  label,
  value,
  sub,
  tone = 'neutral',
  spark,
  className,
}: {
  icon?: LucideIcon;
  label: string;
  value: string;
  sub?: string;
  tone?: StatTone;
  spark?: number[];
  className?: string;
}) {
  const chip = {
    neutral: 'bg-paper-sunk text-ink-muted',
    positive: 'bg-applied-wash text-applied',
    attention: 'bg-attention-wash text-attention',
    risk: 'bg-risk-wash text-risk',
    iris: 'bg-iris-wash text-iris',
  }[tone];
  return (
    <div className={cn('flex flex-col gap-2 rounded-md border border-rule bg-paper p-4', className)}>
      <div className="flex items-center justify-between">
        <span className="text-label text-ink-muted">{label}</span>
        {Icon && (
          <span className={cn('flex h-6 w-6 items-center justify-center rounded-sm', chip)}>
            <Icon className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
      <div className="flex items-end justify-between gap-2">
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="font-data text-[22px] leading-6 text-ink truncate">{value}</span>
          {sub && <span className="font-ui text-[11px] text-ink-faint truncate">{sub}</span>}
        </div>
        {spark && spark.length > 1 && (
          <Sparkline data={spark} tone={tone === 'neutral' ? 'iris' : tone} />
        )}
      </div>
    </div>
  );
}

export function StatGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('grid grid-cols-2 gap-3 sm:grid-cols-4', className)}>{children}</div>;
}

/** Titled section wrapper with optional right-side action. */
export function ToolSection({
  title,
  sub,
  action,
  children,
  className,
}: {
  title: string;
  sub?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-end justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-label text-ink-muted">{title}</h2>
          {sub && <span className="font-ui text-[12px] text-ink-faint">{sub}</span>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Inline callout. Colour follows tone but stays desaturated. */
export function InsightBanner({
  icon: Icon,
  tone = 'info',
  children,
  className,
}: {
  icon?: LucideIcon;
  tone?: 'info' | 'positive' | 'attention' | 'risk';
  children: React.ReactNode;
  className?: string;
}) {
  const styles = {
    info: 'border-iris-edge bg-iris-wash text-ink',
    positive: 'border-applied/40 bg-applied-wash text-ink',
    attention: 'border-attention/40 bg-attention-wash text-ink',
    risk: 'border-risk/40 bg-risk-wash text-ink',
  }[tone];
  const iconColor = { info: 'text-iris', positive: 'text-applied', attention: 'text-attention', risk: 'text-risk' }[tone];
  return (
    <div className={cn('flex items-start gap-2 rounded-md border px-3 py-2', styles, className)}>
      {Icon && <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', iconColor)} />}
      <p className="font-ui text-[12px] leading-5">{children}</p>
    </div>
  );
}

// ── Dense table primitives (shadcn-style, our tokens) ──
export function DataGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="overflow-x-auto rounded-md border border-rule">
      <table className={cn('w-full border-collapse', className)}>{children}</table>
    </div>
  );
}
export function THead({ children }: { children: React.ReactNode }) {
  return <thead className="bg-paper-sunk">{children}</thead>;
}
export function TR({ children, className }: { children: React.ReactNode; className?: string }) {
  return <tr className={cn('border-b border-rule last:border-0', className)}>{children}</tr>;
}
export function TH({ children, className, numeric }: { children: React.ReactNode; className?: string; numeric?: boolean }) {
  return (
    <th
      scope="col"
      className={cn('px-3 py-2 text-label text-ink-muted', numeric ? 'text-right' : 'text-left', className)}
    >
      {children}
    </th>
  );
}
export function TD({ children, className, numeric }: { children: React.ReactNode; className?: string; numeric?: boolean }) {
  return (
    <td
      className={cn(
        'px-3 py-2 text-[13px] text-ink',
        numeric ? 'text-right font-data tabular-nums' : 'font-ui',
        className,
      )}
    >
      {children}
    </td>
  );
}

/** Skeleton loading rows for a table. */
export function SkeletonRows({ rows = 6, cols }: { rows?: number; cols: number }) {
  return (
    <>
      {Array.from({ length: rows }, (_, r) => `r${r}`).map((rk) => (
        <TR key={rk}>
          {Array.from({ length: cols }, (_, c) => `${rk}c${c}`).map((ck) => (
            <TD key={ck}>
              <span className="block h-3 w-full max-w-[120px] animate-pulse rounded bg-paper-sunk" />
            </TD>
          ))}
        </TR>
      ))}
    </>
  );
}

/** Full-width empty row inside a table. */
export function EmptyRow({ cols, children }: { cols: number; children: React.ReactNode }) {
  return (
    <TR>
      <td colSpan={cols} className="px-3 py-8 text-center font-ui text-[12px] text-ink-faint">
        {children}
      </td>
    </TR>
  );
}

/** Chart series ramp - neutral (never platform-coloured). */
export const CHART = {
  a: 'var(--iris)',
  b: 'var(--ink-muted)',
  c: 'var(--attention)',
  grid: 'var(--rule)',
  axis: 'var(--ink-faint)',
} as const;

// -- Shared tool-page controls --
// Consolidated here so every cluster view (analytics/management/creative/
// audience/growth) reads from one implementation instead of five drifting
// file-scoped copies.

type SegOption<T extends string> = T | { value: T; label: string };
function normalizeSegOption<T extends string>(o: SegOption<T>): { value: T; label: string } {
  return typeof o === 'string' ? { value: o, label: o } : o;
}

/** Pill-group control - date presets, sensitivity, segment tabs, anything
 *  with a small closed set of mutually-exclusive values. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  className,
}: {
  options: readonly SegOption<T>[];
  value: T;
  onChange: (v: T) => void;
  ariaLabel?: string;
  className?: string;
}) {
  return (
    <div
      className={cn('inline-flex items-center gap-0.5 rounded-md border border-rule bg-paper-sunk p-1', className)}
      role="tablist"
      aria-label={ariaLabel}
    >
      {options.map((raw) => {
        const o = normalizeSegOption(raw);
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={value === o.value}
            onClick={() => onChange(o.value)}
            className={cn(
              'rounded-sm px-2.5 py-1 font-ui text-[12px] font-medium transition-colors',
              value === o.value ? 'bg-paper text-ink shadow-sm' : 'text-ink-muted hover:text-ink',
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export type DateRangeValue = '7d' | '30d' | '60d' | '90d';
const DATE_PRESET_OPTIONS: { value: DateRangeValue; label: string }[] = [
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
  { value: '60d', label: '60d' },
  { value: '90d', label: '90d' },
];

/** The 7/30/60/90-day range control every tool page opens with. */
export function DatePreset({
  value,
  onChange,
  options = DATE_PRESET_OPTIONS,
  className,
}: {
  value: DateRangeValue;
  onChange: (v: DateRangeValue) => void;
  options?: { value: DateRangeValue; label: string }[];
  className?: string;
}) {
  return <Segmented ariaLabel="Date range" options={options} value={value} onChange={onChange} className={className} />;
}

export function SearchInput({
  placeholder,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { placeholder: string }) {
  return (
    <input
      type="text"
      placeholder={placeholder}
      className={cn(
        'h-[38px] w-56 rounded-md border border-rule bg-paper px-3 font-ui text-[13px] text-ink placeholder:text-ink-faint',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--iris)]',
        className,
      )}
      {...props}
    />
  );
}

export function SelectField({
  label,
  options,
  value,
  onChange,
  className,
}: {
  label?: string;
  options: readonly string[];
  value?: string;
  onChange?: (v: string) => void;
  className?: string;
}) {
  return (
    <label className={cn('flex flex-col gap-1', className)}>
      {label && <span className="text-label text-ink-muted">{label}</span>}
      <select
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="h-[38px] rounded-md border border-rule bg-paper px-2 font-ui text-[13px] text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--iris)]"
      >
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}

/** The one-line description under a tool's ToolHeader. */
export function ContextLine({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn('max-w-2xl font-ui text-[13px] leading-5 text-ink-muted', className)}>{children}</p>;
}

/** Bordered placeholder for a chart that has no data source yet. Prefer
 *  TrendChart for an actual time series - reach for this for non-line
 *  visuals (reach curves, funnels) that stay a stub until wired. */
export function ChartPlaceholder({
  label,
  height = 160,
  className,
}: {
  label: string;
  height?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-1 rounded-md border border-dashed border-rule bg-paper-sunk',
        className,
      )}
      style={{ height }}
    >
      <span className="font-ui text-[12px] text-ink-faint">{label}</span>
    </div>
  );
}

// -- Generic tool-data rendering --
// One shared shape every cluster view's `data` prop (apps/web's ToolData,
// computed from the synced store) is rendered through, so a real-data table
// and its stat row look identical across all 5 clusters instead of five
// drifting copies. Structural typing only - this package does not import
// apps/web's lib/tools/data.ts (it is server-only and app-scoped).

export type ToolDataStat = { label: string; value: string; sub?: string; tone?: StatTone };
export type ToolDataColumn = { key: string; label: string; numeric?: boolean };
export type ToolDataRowTone = 'neutral' | 'attention' | 'risk' | 'positive';
export type ToolDataRow = { id: string; cells: Record<string, string | number>; tone?: ToolDataRowTone };

/** Real-data stat row - maps `data.stats` straight into StatTile, tone and
 *  all. Use PlaceholderStats-style dash tiles instead while `data` is absent
 *  or the connected account has no rows yet. */
export function ToolStats({ stats, className }: { stats: ToolDataStat[]; className?: string }) {
  return (
    <StatGrid className={className}>
      {stats.map((s) => (
        <StatTile key={s.label} label={s.label} value={s.value} sub={s.sub} tone={s.tone ?? 'neutral'} />
      ))}
    </StatGrid>
  );
}

const ROW_TONE_ACCENT: Record<ToolDataRowTone, string> = {
  neutral: '',
  positive: 'border-l-2 border-applied text-applied',
  attention: 'border-l-2 border-attention text-attention',
  risk: 'border-l-2 border-risk text-risk',
};

/** Real-data table built from `data.columns` + `data.rows`. Renders an
 *  EmptyRow with `emptyMessage` when there are no rows yet (connected but
 *  nothing synced), so the same component covers both the populated and the
 *  connected-but-empty state - callers only branch on which columns/rows to
 *  pass in. */
export function ToolDataTable({
  columns,
  rows,
  emptyMessage,
  className,
}: {
  columns: ToolDataColumn[];
  rows: ToolDataRow[];
  emptyMessage: string;
  className?: string;
}) {
  return (
    <DataGrid className={className}>
      <THead>
        <TR>
          {columns.map((c) => (
            <TH key={c.key} numeric={c.numeric}>
              {c.label}
            </TH>
          ))}
        </TR>
      </THead>
      <tbody>
        {rows.length === 0 ? (
          <EmptyRow cols={columns.length}>{emptyMessage}</EmptyRow>
        ) : (
          rows.map((r) => (
            <TR key={r.id}>
              {columns.map((c, i) => (
                <TD key={c.key} numeric={c.numeric} className={i === 0 ? ROW_TONE_ACCENT[r.tone ?? 'neutral'] : undefined}>
                  {r.cells[c.key] ?? '-'}
                </TD>
              ))}
            </TR>
          ))
        )}
      </tbody>
    </DataGrid>
  );
}

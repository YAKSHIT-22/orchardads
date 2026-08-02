import type { LucideIcon } from 'lucide-react';
import type * as React from 'react';
import { cn } from '../cn';

/**
 * Shared tool-page kit, re-skinned from handyAds' optimize/ui to our tokens.
 * Presentation-only: analysis/data lives elsewhere. Chrome stays achromatic;
 * colour is rationed to state (applied/attention/risk) + the iris "next action".
 */

/** A bordered stat tile: icon chip + label + big data value + sub. */
export function StatTile({
  icon: Icon,
  label,
  value,
  sub,
  tone = 'neutral',
  className,
}: {
  icon?: LucideIcon;
  label: string;
  value: string;
  sub?: string;
  tone?: 'neutral' | 'positive' | 'attention' | 'risk' | 'iris';
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
      <span className="font-data text-[22px] leading-6 text-ink">{value}</span>
      {sub && <span className="font-ui text-[11px] text-ink-faint">{sub}</span>}
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

import * as React from 'react';
import { cn } from '../cn';

export type Delta = {
  value: string;
  direction: 'up' | 'down' | 'flat';
  /** Is this direction good? Falling CPA is desirable; the colour follows this, not the sign. */
  desirable: boolean;
};

/** label, data-lg value, delta coloured by desirability (DESIGN_SYSTEM sec 7). */
export function MetricStat({
  label,
  value,
  delta,
  sub,
  className,
}: {
  label: string;
  value: string;
  delta?: Delta;
  sub?: string;
  className?: string;
}) {
  const arrow = delta ? (delta.direction === 'up' ? '+' : delta.direction === 'down' ? '-' : '') : '';
  const deltaColor = delta
    ? delta.direction === 'flat'
      ? 'text-ink-faint'
      : delta.desirable
        ? 'text-applied'
        : 'text-risk'
    : '';
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <span className="text-label text-ink-muted">{label}</span>
      <span className="font-data text-[20px] leading-6 text-ink">{value}</span>
      <div className="flex items-center gap-2">
        {delta && (
          <span className={cn('font-data text-[11px]', deltaColor)}>
            {arrow}
            {delta.value}
          </span>
        )}
        {sub && <span className="font-ui text-[11px] text-ink-faint">{sub}</span>}
      </div>
    </div>
  );
}

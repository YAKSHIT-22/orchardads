'use client';

import { cn } from '../cn';

/** Single-select pill group - date ranges, view toggles. Not a tab (no separate
 *  panels); use Tabs when the options swap the content below. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-0.5 rounded-md border border-rule bg-paper-sunk p-0.5',
        className,
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              'rounded-sm px-2.5 py-1 font-ui text-[12px] font-medium transition-colors',
              active ? 'bg-paper text-ink shadow-xs' : 'text-ink-muted hover:text-ink',
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

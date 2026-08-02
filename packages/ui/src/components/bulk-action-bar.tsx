import type * as React from 'react';
import { cn } from '../cn';

/** The bar below a selectable table: count + clear on the left, the tool's
 *  bulk actions on the right. Always mounted (so the shell is visible before
 *  any data exists) - it just lights up from an idle grey bar to the active
 *  iris one once `count` is above zero. Actions stay caller-owned so each
 *  tool decides which of its own buttons are enabled at zero selected. */
export function BulkActionBar({
  count,
  onClear,
  actions,
  className,
}: {
  count: number;
  onClear: () => void;
  actions: React.ReactNode;
  className?: string;
}) {
  const active = count > 0;
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-3 rounded-md border px-3.5 py-2.5 transition-colors',
        active ? 'border-iris-edge bg-iris-wash' : 'border-rule bg-paper-sunk',
        className,
      )}
      role="toolbar"
      aria-label="Bulk actions"
    >
      <p className={cn('font-ui text-[12px] font-semibold', active ? 'text-iris' : 'text-ink-muted')}>
        {count} selected
      </p>
      {active && (
        <button
          type="button"
          onClick={onClear}
          className="font-ui text-[12px] text-ink-muted underline-offset-2 hover:text-ink hover:underline"
        >
          Clear
        </button>
      )}
      <div className="ml-auto flex flex-wrap items-center gap-2">{actions}</div>
    </div>
  );
}

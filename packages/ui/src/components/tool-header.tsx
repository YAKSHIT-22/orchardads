import type { LucideIcon } from 'lucide-react';
import type * as React from 'react';
import { cn } from '../cn';

/** Page/tool header: tinted icon square + title + description + actions.
 *  Re-skinned from handyAds ToolHeader to the iris accent. */
export function ToolHeader({
  icon: Icon,
  title,
  description,
  children,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-iris-wash text-iris">
          <Icon className="h-[18px] w-[18px]" />
        </div>
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-[22px] leading-7 text-ink">{title}</h1>
          {description && (
            <p className="max-w-xl font-ui text-sm text-ink-muted">{description}</p>
          )}
        </div>
      </div>
      {children && <div className="flex shrink-0 items-center gap-2">{children}</div>}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  message,
  action,
  secondaryAction,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  /** Empty states are instructions, not dead ends (copy rules sec 9). */
  message: string;
  action?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-3 rounded-md border border-rule bg-paper px-6 py-14 text-center',
        className,
      )}
    >
      {Icon && (
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-paper-sunk">
          <Icon className="h-5 w-5 text-ink-faint" />
        </span>
      )}
      <div className="flex flex-col gap-1">
        <span className="font-display text-base text-ink">{title}</span>
        <p className="max-w-md font-ui text-[13px] leading-5 text-ink-muted">{message}</p>
      </div>
      {(action || secondaryAction) && (
        <div className="mt-1 flex items-center gap-2">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}

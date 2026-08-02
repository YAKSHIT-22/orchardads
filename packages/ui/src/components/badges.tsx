import { Slot } from '@radix-ui/react-slot';
import type * as React from 'react';
import { cn } from '../cn';
import { PLATFORM_COLOR, platformLabel } from '../cn';

type Risk = 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH';

const RISK_STYLE: Record<Risk, string> = {
  SAFE: 'text-ink-muted border-rule',
  LOW: 'text-applied border-applied/40 bg-applied-wash',
  MEDIUM: 'text-attention border-attention/40 bg-attention-wash',
  HIGH: 'text-risk border-risk/40 bg-risk-wash',
};

/** Generic status/label pill. Solid-tone variants share one shape across the app
 *  (tool status, action status, etc.) so colour + spacing never drift page to page. */
export type BadgeVariant = 'neutral' | 'iris' | 'applied' | 'attention' | 'risk';

const BADGE_STYLE: Record<BadgeVariant, string> = {
  neutral: 'bg-paper-sunk text-ink-muted',
  iris: 'bg-iris-wash text-iris',
  applied: 'bg-applied-wash text-applied',
  attention: 'bg-attention-wash text-attention',
  risk: 'bg-risk-wash text-risk',
};

export function Badge({
  variant = 'neutral',
  asChild = false,
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant; asChild?: boolean }) {
  const Comp = asChild ? Slot : 'span';
  return (
    <Comp
      className={cn('inline-flex items-center rounded-sm px-1.5 py-0.5 text-label', BADGE_STYLE[variant], className)}
      {...props}
    />
  );
}

/** Colour is never the only signal - the label carries the meaning too (sec 10). */
export function RiskBadge({ risk, className }: { risk: Risk; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-sm border px-1.5 py-0.5 text-label',
        RISK_STYLE[risk],
        className,
      )}
    >
      risk {risk}
    </span>
  );
}

export function PlatformChip({ platform, className }: { platform: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-rule px-2 py-0.5 font-ui text-[11px] font-medium text-ink',
        className,
      )}
    >
      <span
        className="h-2 w-2 rounded-full"
        style={{ background: PLATFORM_COLOR[platform] }}
        aria-hidden
      />
      {platformLabel(platform)}
    </span>
  );
}

type SyncTone = 'fresh' | 'syncing' | 'stale' | 'failed';
const SYNC_STYLE: Record<SyncTone, string> = {
  fresh: 'text-applied bg-applied-wash',
  syncing: 'text-iris bg-iris-wash',
  stale: 'text-attention bg-attention-wash',
  failed: 'text-risk bg-risk-wash',
};

export function SyncStatus({
  tone,
  label,
  className,
}: {
  tone: SyncTone;
  label: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-sm px-1.5 py-0.5 font-ui text-[11px] font-medium',
        SYNC_STYLE[tone],
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {label}
    </span>
  );
}

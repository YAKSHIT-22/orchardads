import * as React from 'react';
import { cn } from '../cn';
import { PLATFORM_COLOR } from '../cn';

type Risk = 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH';

const RISK_STYLE: Record<Risk, string> = {
  SAFE: 'text-ink-muted border-rule',
  LOW: 'text-applied border-applied/40 bg-applied-wash',
  MEDIUM: 'text-attention border-attention/40 bg-attention-wash',
  HIGH: 'text-risk border-risk/40 bg-risk-wash',
};

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
      {platform.charAt(0) + platform.slice(1).toLowerCase()}
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

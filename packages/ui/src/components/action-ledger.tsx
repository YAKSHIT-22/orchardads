'use client';

import * as React from 'react';
import { cn } from '../cn';
import { PLATFORM_COLOR } from '../cn';
import { Button } from './button';
import { RiskBadge } from './badges';

export type DiffRow = { field: string; from: string; to: string };
export type LedgerEstimate = {
  headline: string; // e.g. "+12 to +19 conversions / week"
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  basis: string; // mandatory \u2014 an estimate without a stated assumption is a guess
};

export type ActionLedgerProps = {
  platform: string;
  entityType: string;
  entityLabel: string;
  diff: DiffRow[];
  evidence?: string[];
  estimate?: LedgerEstimate;
  risk: 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH';
  reversible: boolean;
  cooldownH?: number;
  density?: 'line' | 'card' | 'frozen';
  apiResponse?: string;
  onApply?: () => void;
  onDismiss?: () => void;
  className?: string;
};

function DiffLine({ row }: { row: DiffRow }) {
  const changed = row.from !== row.to;
  return (
    <div className="grid grid-cols-[140px_1fr] items-center gap-2 py-0.5">
      <span className="text-label text-ink-muted">{row.field}</span>
      <div className="flex items-center gap-2 font-data text-[13px]">
        <span
          className="rounded-sm px-1.5 py-0.5"
          style={{ background: 'var(--diff-from-bg)', color: 'var(--diff-from-fg)' }}
        >
          {row.from}
        </span>
        <span className="text-ink-faint" aria-hidden>
          {'->'}
        </span>
        {changed ? (
          <span
            className="rounded-sm px-1.5 py-0.5"
            style={{ background: 'var(--diff-to-bg)', color: 'var(--diff-to-fg)' }}
          >
            {row.to}
          </span>
        ) : (
          <span className="text-ink-faint" aria-label="unchanged">
            {'\u2014'}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * The signature component (DESIGN_SYSTEM sec 4). Same element renders in the
 * inbox (line), the approval sheet (card) and the audit trail (frozen).
 * You always see exactly what will change before it changes.
 */
export function ActionLedger(props: ActionLedgerProps) {
  const {
    platform,
    entityType,
    entityLabel,
    diff,
    evidence,
    estimate,
    risk,
    reversible,
    cooldownH,
    density = 'card',
    apiResponse,
    onApply,
    onDismiss,
    className,
  } = props;

  const [open, setOpen] = React.useState(density !== 'line');
  const frozen = density === 'frozen';
  const changedRows = diff.filter((d) => d.from !== d.to);
  const headline = changedRows[0] ?? diff[0];

  return (
    <article
      className={cn('bg-paper border border-rule rounded-md border-l-[3px] overflow-hidden', className)}
      style={{ borderLeftColor: PLATFORM_COLOR[platform] }}
    >
      <header
        className={cn(
          'flex items-center justify-between gap-3 px-4 py-2.5',
          density === 'line' && 'cursor-pointer select-none',
        )}
        {...(density === 'line'
          ? {
              role: 'button',
              tabIndex: 0,
              'aria-expanded': open,
              onClick: () => setOpen((o) => !o),
              onKeyDown: (e: React.KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setOpen((o) => !o);
                }
              },
            }
          : {})}
      >
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-label text-ink-muted">
            {platform} {'\u00B7'} {entityType}
          </span>
          <span className="truncate font-ui text-[13px] font-medium text-ink">{entityLabel}</span>
        </div>
        {!open && headline && (
          <span className="shrink-0 font-data text-[12px] text-ink-muted">
            {headline.field}: {headline.from} {'->'} {headline.to}
          </span>
        )}
      </header>

      {open && (
        <div className="flex flex-col gap-3 px-4 pb-3">
          <div className="flex flex-col border-t border-rule pt-2">
            {diff.map((row) => (
              <DiffLine key={row.field} row={row} />
            ))}
          </div>

          {evidence && evidence.length > 0 && (
            <section className="flex flex-col gap-1">
              <span className="text-label text-ink-faint">evidence</span>
              {evidence.map((line) => (
                <p key={line} className="font-ui text-[12px] text-ink-muted">
                  {line}
                </p>
              ))}
            </section>
          )}

          {estimate && (
            <section className="flex flex-col gap-1">
              <span className="text-label text-ink-faint">estimate</span>
              <p className="font-ui text-[12px] text-ink">
                {estimate.headline}{' '}
                <span className="text-ink-faint">confidence {estimate.confidence}</span>
              </p>
              <p className="font-ui text-[11px] text-ink-faint">basis: {estimate.basis}</p>
            </section>
          )}

          <div className="flex items-center justify-between gap-3 border-t border-rule pt-2">
            <div className="flex items-center gap-2 font-ui text-[11px] text-ink-muted">
              <RiskBadge risk={risk} />
              <span className={reversible ? 'text-ink-muted' : 'text-risk'}>
                {reversible ? 'reversible' : 'irreversible'}
              </span>
              {cooldownH != null && <span>cooldown {cooldownH} h</span>}
            </div>
            {!frozen && (onApply || onDismiss) && (
              <div className="flex items-center gap-2">
                {onDismiss && (
                  <Button variant="ghost" size="sm" onClick={onDismiss}>
                    Dismiss
                  </Button>
                )}
                {onApply && (
                  <Button variant="primary" size="sm" onClick={onApply}>
                    Apply
                  </Button>
                )}
              </div>
            )}
          </div>

          {frozen && apiResponse && (
            <p className="rounded-sm bg-paper-sunk px-2 py-1 font-data text-[11px] text-ink-muted">
              {apiResponse}
            </p>
          )}
        </div>
      )}
    </article>
  );
}

import type * as React from 'react';
import { cn } from '../cn';

/** Label + control + hint/error, laid out consistently wherever a form field
 *  appears. Error takes priority over hint when both are set. */
export function Field({
  label,
  hint,
  error,
  htmlFor,
  children,
  className,
}: {
  label?: string;
  hint?: string;
  error?: string;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={htmlFor} className="text-label text-ink-muted">
          {label}
        </label>
      )}
      {children}
      {error ? (
        <span className="font-ui text-[11px] text-risk">{error}</span>
      ) : hint ? (
        <span className="font-ui text-[11px] text-ink-faint">{hint}</span>
      ) : null}
    </div>
  );
}

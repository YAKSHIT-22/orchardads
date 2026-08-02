import { ChevronLeft, ChevronRight } from 'lucide-react';
import type * as React from 'react';
import { cn } from '../cn';

/** Prev/next table pagination with a "N-M of T" summary. Stateless - the
 *  caller owns the current page. */
export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  className,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  className?: string;
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  return (
    <div className={cn('flex items-center justify-between gap-3 px-1 py-1', className)}>
      <span className="font-data text-[11px] text-ink-faint">
        {from}-{to} of {total}
      </span>
      <div className="flex items-center gap-1.5">
        <span className="font-ui text-[11px] text-ink-faint">
          Page {page} of {pageCount}
        </span>
        <PageButton disabled={page <= 1} onClick={() => onPageChange(page - 1)} aria-label="Previous page">
          <ChevronLeft className="h-3.5 w-3.5" />
        </PageButton>
        <PageButton disabled={page >= pageCount} onClick={() => onPageChange(page + 1)} aria-label="Next page">
          <ChevronRight className="h-3.5 w-3.5" />
        </PageButton>
      </div>
    </div>
  );
}

function PageButton({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex h-7 w-7 items-center justify-center rounded-sm border border-rule text-ink-muted transition-colors',
        'hover:bg-paper-sunk hover:text-ink disabled:pointer-events-none disabled:opacity-40',
        className,
      )}
      {...props}
    />
  );
}

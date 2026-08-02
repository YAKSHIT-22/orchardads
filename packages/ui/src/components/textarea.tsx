import type * as React from 'react';
import { cn } from '../cn';

/** shadcn Textarea, ported from handyAds - matches Input's tokens/height rules. */
export function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'min-h-16 w-full rounded-md border border-rule bg-paper px-3 py-2 font-ui text-sm text-ink outline-none',
        'placeholder:text-ink-faint resize-y transition-colors',
        'focus-visible:border-iris focus-visible:ring-[3px] focus-visible:ring-iris/20',
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-paper-sunk',
        className,
      )}
      {...props}
    />
  );
}

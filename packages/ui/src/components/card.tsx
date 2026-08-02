import type * as React from 'react';
import { cn } from '../cn';
import { PLATFORM_COLOR } from '../cn';

/** shadcn Card, ported from handyAds - our tokens, plus the OrchardAds
 *  `platform` rail (a 3px left border in the platform's identity colour)
 *  and `interactive` hover treatment. Each region (header/content/footer)
 *  owns its own padding, so nothing here assumes a fixed set of children. */
export function Card({
  className,
  platform,
  interactive,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { platform?: string; interactive?: boolean }) {
  return (
    <div
      data-slot="card"
      className={cn(
        'flex flex-col rounded-md border border-rule bg-paper text-ink shadow-xs',
        platform && 'border-l-[3px]',
        interactive && 'transition-shadow duration-150 hover:border-rule-strong hover:shadow-sm',
        className,
      )}
      style={platform ? { borderLeftColor: PLATFORM_COLOR[platform] } : undefined}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        'grid auto-rows-min grid-rows-[auto_auto] items-start gap-1 p-4',
        'has-data-[slot=card-action]:grid-cols-[1fr_auto]',
        className,
      )}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      data-slot="card-title"
      className={cn('font-ui text-sm font-semibold text-ink leading-none', className)}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p data-slot="card-description" className={cn('font-ui text-[12px] text-ink-muted', className)} {...props} />
  );
}

/** Optional top-right slot in the header grid (e.g. a menu trigger). */
export function CardAction({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="card-action"
      className={cn('col-start-2 row-span-2 row-start-1 self-start justify-self-end', className)}
      {...props}
    />
  );
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="card-content" className={cn('p-4 pt-0', className)} {...props} />;
}

/** Bottom action row - border-topped, consistent padding for footer CTAs. */
export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="card-footer"
      className={cn('flex items-center gap-2 border-t border-rule px-4 py-3', className)}
      {...props}
    />
  );
}

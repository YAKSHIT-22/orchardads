import type * as React from 'react';
import { cn } from '../cn';
import { PLATFORM_COLOR } from '../cn';

export function Card({
  className,
  platform,
  interactive,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { platform?: string; interactive?: boolean }) {
  return (
    <div
      className={cn(
        'bg-paper border border-rule rounded-md shadow-xs',
        platform && 'border-l-[3px]',
        interactive && 'transition-shadow duration-150 hover:shadow-sm hover:border-rule-strong',
        className,
      )}
      style={platform ? { borderLeftColor: PLATFORM_COLOR[platform] } : undefined}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-1 p-4', className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('font-ui text-sm font-semibold text-ink', className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('font-ui text-[12px] text-ink-muted', className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-4 pt-0', className)} {...props} />;
}

/** Bottom action row - border-topped, consistent padding for footer CTAs. */
export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex items-center gap-2 border-t border-rule px-4 py-3', className)}
      {...props}
    />
  );
}

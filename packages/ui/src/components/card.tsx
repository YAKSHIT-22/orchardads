import type * as React from 'react';
import { cn } from '../cn';
import { PLATFORM_COLOR } from '../cn';

export function Card({
  className,
  platform,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { platform?: string }) {
  return (
    <div
      className={cn('bg-paper border border-rule rounded-md', platform && 'border-l-[3px]', className)}
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

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-4 pt-0', className)} {...props} />;
}

import type * as React from 'react';
import { cn } from '../cn';

/** Generic loading placeholder block. Table-specific rows live in tool-kit.tsx
 *  (SkeletonRows); this is for stat tiles, cards, headers, anything else. */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('animate-pulse rounded-sm bg-paper-sunk', className)} {...props} />;
}

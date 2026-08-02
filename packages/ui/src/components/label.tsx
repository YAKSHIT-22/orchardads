'use client';

import * as LabelPrimitive from '@radix-ui/react-label';
import type * as React from 'react';
import { cn } from '../cn';

/** shadcn Label, ported from handyAds - our tokens. The Field component in
 *  field.tsx covers the common "label + control + hint" layout; reach for
 *  this one directly when a raw Radix-composable label is needed. */
export function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        'flex items-center gap-2 font-ui text-sm font-medium text-ink leading-none select-none',
        'group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50',
        'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}

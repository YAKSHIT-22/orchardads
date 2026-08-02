'use client';

import * as React from 'react';
import { cn } from '../cn';

/** Native checkbox, styled to the design tokens. Used for table row-select
 *  (bulk-editor style tools) - kept as a plain input for a11y + form-free use. */
export const Checkbox = React.forwardRef<
  HTMLInputElement,
  Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'checked' | 'onChange'> & {
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    indeterminate?: boolean;
  }
>(({ checked, onCheckedChange, indeterminate, className, ...props }, forwardedRef) => {
  const innerRef = React.useRef<HTMLInputElement>(null);
  React.useImperativeHandle(forwardedRef, () => innerRef.current as HTMLInputElement);
  React.useEffect(() => {
    if (innerRef.current) innerRef.current.indeterminate = Boolean(indeterminate);
  }, [indeterminate]);

  return (
    <input
      ref={innerRef}
      type="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
      className={cn(
        'h-3.5 w-3.5 shrink-0 cursor-pointer rounded-[3px] border border-rule-strong text-iris accent-[var(--iris)]',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--iris)]',
        className,
      )}
      {...props}
    />
  );
});
Checkbox.displayName = 'Checkbox';

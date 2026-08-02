import * as React from 'react';
import { cn } from '../cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

/** 38px control height per DESIGN_SYSTEM sec 2, matches Button/Select. */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid, ...props }, ref) => (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        'h-[38px] w-full rounded-md border bg-paper px-3 font-ui text-sm text-ink shadow-xs outline-none',
        'placeholder:text-ink-faint transition-colors',
        invalid ? 'border-risk focus:border-risk' : 'border-rule focus:border-iris',
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-paper-sunk',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';

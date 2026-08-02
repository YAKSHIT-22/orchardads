import { ChevronDown } from 'lucide-react';
import * as React from 'react';
import { cn } from '../cn';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  wrapperClassName?: string;
}

/** Native <select> styled to match Input/Button - no popover to keep the kit
 *  dependency-free, but full keyboard + screen-reader support for free. */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, wrapperClassName, children, ...props }, ref) => (
    <div className={cn('relative', wrapperClassName)}>
      <select
        ref={ref}
        className={cn(
          'h-[38px] w-full appearance-none rounded-md border border-rule bg-paper pl-3 pr-8',
          'font-ui text-sm text-ink outline-none transition-colors focus:border-iris',
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-paper-sunk',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint"
        aria-hidden
      />
    </div>
  ),
);
Select.displayName = 'Select';

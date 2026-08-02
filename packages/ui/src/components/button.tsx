import { type VariantProps, cva } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '../cn';

const button = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-ui text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2',
  {
    variants: {
      variant: {
        primary: 'bg-iris text-white hover:bg-iris-hover',
        secondary: 'bg-paper-sunk text-ink border border-rule hover:border-rule-strong',
        ghost: 'text-ink-muted hover:bg-paper-sunk hover:text-ink',
        destructive: 'bg-risk text-white hover:opacity-90',
      },
      size: {
        // 38px control height per DESIGN_SYSTEM sec 2
        default: 'h-[38px] px-4 rounded-md',
        sm: 'h-8 px-3 rounded-sm text-[13px]',
        icon: 'h-[38px] w-[38px] rounded-md',
      },
    },
    defaultVariants: { variant: 'primary', size: 'default' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof button> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(button({ variant, size }), className)} {...props} />
  ),
);
Button.displayName = 'Button';

export { button as buttonVariants };

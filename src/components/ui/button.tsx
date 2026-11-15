import { cva, type VariantProps } from 'class-variance-authority';
import type { ButtonHTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-brand text-white hover:bg-brand/90',
        secondary: 'border border-stone-300 bg-white text-ink hover:bg-stone-100',
        ghost: 'text-ink hover:bg-stone-200/70',
        danger: 'bg-red-700 text-white hover:bg-red-800',
        'danger-ghost': 'text-red-700 hover:bg-red-50',
      },
      size: {
        sm: 'h-8 px-2.5 text-xs',
        md: 'h-9 px-3.5 text-sm',
      },
    },
    defaultVariants: { variant: 'secondary', size: 'md' },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, type = 'button', ...props }: ButtonProps) {
  return <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

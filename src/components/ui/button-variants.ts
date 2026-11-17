import { cva } from 'class-variance-authority';

export const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-2 rounded-md font-medium whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-50 aria-pressed:bg-selected aria-pressed:text-selected-foreground',
  {
    variants: {
      variant: {
        primary: 'bg-brand text-on-brand enabled:hover:bg-brand/90',
        secondary:
          'border border-stone-300 bg-card text-foreground shadow-xs enabled:hover:bg-stone-100',
        ghost: 'text-foreground enabled:hover:bg-hover',
        // Red text on its own lightest shade: readable in both themes (the scale flips in dark).
        danger: 'bg-red-700 text-red-50 enabled:hover:bg-red-800',
        'danger-ghost': 'text-red-700 enabled:hover:bg-red-50',
      },
      size: {
        sm: 'h-8 px-2.5 text-xs',
        md: 'h-9 px-3.5 text-sm',
        icon: 'size-8 text-sm',
      },
    },
    defaultVariants: { variant: 'secondary', size: 'md' },
  },
);

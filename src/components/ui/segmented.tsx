import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export interface SegmentedOption<T extends string> {
  readonly value: T;
  /** Accessible name and tooltip. */
  readonly label: string;
  readonly icon: ReactNode;
}

interface SegmentedProps<T extends string> {
  readonly label: string;
  readonly value: T;
  readonly options: readonly SegmentedOption<T>[];
  readonly onChange: (value: T) => void;
  readonly className?: string;
}

/** A small row of icon buttons where exactly one is pressed (theme, view mode). */
export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  className,
}: SegmentedProps<T>) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn('bg-card inline-flex h-8 rounded-md border border-stone-300 p-0.5', className)}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            aria-label={option.label}
            title={option.label}
            className={cn(
              'inline-flex w-7 items-center justify-center rounded-[0.3rem] text-stone-600',
              active ? 'bg-selected text-selected-foreground' : 'hover:bg-hover',
            )}
            onClick={() => onChange(option.value)}
          >
            {option.icon}
          </button>
        );
      })}
    </div>
  );
}

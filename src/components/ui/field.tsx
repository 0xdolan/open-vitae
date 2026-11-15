import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export const controlClass =
  'h-9 w-full rounded-md border border-stone-300 bg-white px-2.5 text-sm text-ink focus-visible:border-brand';

interface FieldProps {
  readonly label: string;
  readonly htmlFor: string;
  readonly hint?: string;
  readonly className?: string;
  readonly children: ReactNode;
}

/** A labelled form control with an optional hint underneath. */
export function Field({ label, htmlFor, hint, className, children }: FieldProps) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1', className)}>
      <label htmlFor={htmlFor} className="text-xs font-semibold text-stone-700">
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs text-stone-500">{hint}</p> : null}
    </div>
  );
}

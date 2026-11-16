import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export const controlClass =
  'h-9 w-full rounded-md border border-stone-300 bg-card px-2.5 text-sm text-foreground placeholder:text-stone-400 disabled:opacity-50';

interface FieldProps {
  readonly label: string;
  readonly htmlFor: string;
  readonly hint?: string;
  readonly className?: string;
  readonly children: ReactNode;
}

const HEX6 = /^#[0-9a-f]{6}$/i;

interface ColorControlProps {
  readonly id: string;
  /** The stored colour; absent means "use the default". */
  readonly value: string | undefined;
  /** Shown while no colour is stored. */
  readonly fallback: string;
  readonly onChange: (color: string | undefined) => void;
  /** Label of the button that clears the colour; no button without it. */
  readonly resetLabel?: string;
  readonly 'aria-label'?: string;
}

/** A colour swatch input, with an optional button to go back to the default. */
export function ColorControl({
  id,
  value,
  fallback,
  onChange,
  resetLabel,
  ...aria
}: ColorControlProps) {
  const shown = value && HEX6.test(value) ? value : HEX6.test(fallback) ? fallback : '#000000';
  return (
    <div className="flex items-center gap-1.5">
      <input
        id={id}
        type="color"
        className="bg-card h-9 min-w-0 flex-1 rounded-md border border-stone-300 p-1"
        value={shown}
        onChange={(e) => onChange(e.target.value)}
        {...aria}
      />
      {resetLabel && value !== undefined ? (
        <button
          type="button"
          className="hover:bg-hover h-9 shrink-0 rounded-md px-2 text-xs text-stone-600"
          onClick={() => onChange(undefined)}
        >
          {resetLabel}
        </button>
      ) : null}
    </div>
  );
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

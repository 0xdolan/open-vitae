import { useEffect, useRef, type ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface PopoverProps {
  /** Content of the toggle button. */
  readonly trigger: ReactNode;
  /** Accessible name of the toggle button. */
  readonly label: string;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly active?: boolean;
  readonly className?: string;
  readonly children: ReactNode;
}

/**
 * Small toolbar popover. Closes on Escape (returning focus to its button) and
 * on clicks outside. Opens towards the reading end, so it mirrors in RTL.
 */
export function Popover({ trigger, label, open, onOpenChange, active, className, children }: PopoverProps) {
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (root.current && !root.current.contains(event.target as Node)) onOpenChange(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onOpenChange(false);
        button.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey, true);
    };
  }, [open, onOpenChange]);

  return (
    <div ref={root} className="relative">
      <button
        ref={button}
        type="button"
        aria-label={label}
        title={label}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={cn('ov-tool', (active || open) && 'ov-tool-active')}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onOpenChange(!open)}
      >
        {trigger}
      </button>
      {open ? (
        <div
          role="dialog"
          aria-label={label}
          className={cn(
            'absolute start-0 top-full z-30 mt-1 w-72 rounded-lg border border-stone-200 bg-white p-3 text-sm shadow-xl',
            className,
          )}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

import { useRef, type ReactNode } from 'react';

import { useDismiss } from '@/hooks/useDismiss';
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
export function Popover({
  trigger,
  label,
  open,
  onOpenChange,
  active,
  className,
  children,
}: PopoverProps) {
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  useDismiss(open, [root], (reason) => {
    onOpenChange(false);
    if (reason === 'escape') button.current?.focus();
  });

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
            'bg-popover absolute start-0 top-full z-30 mt-1 w-72 rounded-lg border border-stone-200 p-3 text-sm shadow-lg',
            className,
          )}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

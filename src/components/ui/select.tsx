import {
  useCallback,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from 'react';

import { useDismiss } from '@/hooks/useDismiss';
import { cn } from '@/lib/utils';

import { CheckIcon, ChevronDownIcon } from './icons';

export interface SelectOption {
  readonly value: string;
  readonly label: string;
  /** Shown instead of the label in the list (the trigger still shows the label). */
  readonly content?: ReactNode;
  readonly disabled?: boolean;
  /** E.g. a font option drawn in its own font. */
  readonly style?: CSSProperties;
  readonly lang?: string;
  readonly dir?: 'ltr' | 'rtl' | 'auto';
}

export interface SelectGroup {
  readonly group: string;
  readonly options: readonly SelectOption[];
}

export type SelectItem = SelectOption | SelectGroup;

const isGroup = (item: SelectItem): item is SelectGroup => 'group' in item;

/** Every option in order, groups flattened. */
function flattenItems(items: readonly SelectItem[]): SelectOption[] {
  return items.flatMap((item) => (isGroup(item) ? item.options : [item]));
}

/** The shared trigger look, also used by other dropdown buttons. */
export const selectTriggerClass =
  'inline-flex w-full min-w-0 items-center justify-between gap-2 rounded-md border border-stone-300 bg-card text-start text-foreground transition-colors hover:border-stone-400 disabled:opacity-50 aria-expanded:border-ring';

const SIZES = {
  sm: 'h-8 px-2 text-xs',
  md: 'h-9 px-2.5 text-sm',
} as const;

interface SelectProps {
  readonly value: string;
  readonly onValueChange: (value: string) => void;
  readonly items: readonly SelectItem[];
  readonly id?: string;
  readonly 'aria-label'?: string;
  readonly 'aria-labelledby'?: string;
  readonly 'aria-describedby'?: string;
  readonly title?: string;
  readonly disabled?: boolean;
  readonly size?: keyof typeof SIZES;
  /** Shown when the value matches no option. */
  readonly placeholder?: string;
  /** Replaces the label in the trigger (e.g. an icon plus short text). */
  readonly renderValue?: (option: SelectOption | undefined) => ReactNode;
  readonly className?: string;
  /** Classes for the list (e.g. a wider list than the trigger). */
  readonly contentClassName?: string;
  /** Keep focus where it is when the trigger is pressed (toolbars over a text editor). */
  readonly keepFocus?: boolean;
}

interface Position {
  readonly top?: number;
  readonly bottom?: number;
  readonly left?: number;
  readonly right?: number;
  readonly minWidth: number;
  readonly maxHeight: number;
}

const GAP = 4;
const MAX_LIST_HEIGHT = 320;

/**
 * The one dropdown used across the app (shadcn/ui Select look, ARIA
 * listbox behaviour). Keyboard: arrows, Home/End, type to jump, Enter or
 * Space to choose, Escape or Tab to close. Closes on a press outside. The
 * list is positioned "fixed", so scrolling panels and dialogs never clip it,
 * and it opens upwards when there is no room below. Mirrors in RTL.
 */
export function Select({
  value,
  onValueChange,
  items,
  id,
  title,
  disabled,
  size = 'md',
  placeholder,
  renderValue,
  className,
  contentClassName,
  keepFocus,
  ...aria
}: SelectProps) {
  const listId = useId();
  const optionId = (index: number) => `${listId}-o${index}`;
  const trigger = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [position, setPosition] = useState<Position | null>(null);
  const typed = useRef({ text: '', at: 0 });

  const options = useMemo(() => flattenItems(items), [items]);
  const selectedIndex = options.findIndex((option) => option.value === value);
  const selected = options[selectedIndex];

  const place = useCallback(() => {
    const box = trigger.current?.getBoundingClientRect();
    if (!box) return;
    const below = window.innerHeight - box.bottom - GAP * 2;
    const above = box.top - GAP * 2;
    const up = below < Math.min(MAX_LIST_HEIGHT, 200) && above > below;
    const rtl = getComputedStyle(trigger.current as Element).direction === 'rtl';
    setPosition({
      ...(up ? { bottom: window.innerHeight - box.top + GAP } : { top: box.bottom + GAP }),
      // In RTL the list lines up with the trigger's right edge.
      ...(rtl ? { right: window.innerWidth - box.right } : { left: box.left }),
      minWidth: box.width,
      maxHeight: Math.max(120, Math.min(MAX_LIST_HEIGHT, up ? above : below)),
    });
  }, []);

  const close = useCallback((refocus: boolean) => {
    setOpen(false);
    if (refocus) trigger.current?.focus({ preventScroll: true });
  }, []);

  useDismiss(open, [trigger, list], (reason) => close(reason === 'escape'));

  const show = (start?: number) => {
    if (disabled) return;
    place();
    setActive(start ?? (selectedIndex >= 0 ? selectedIndex : nextEnabled(-1, 1)));
    setOpen(true);
  };

  // Follow the trigger while the page or a panel scrolls, or the window resizes.
  useLayoutEffect(() => {
    if (!open) return;
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [open, place]);

  // Focus the list when it opens and keep the active option in view.
  useLayoutEffect(() => {
    if (!open) return;
    if (!keepFocus) list.current?.focus({ preventScroll: true });
    document.getElementById(optionId(active))?.scrollIntoView({ block: 'nearest' });
    // optionId only depends on listId.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, active, keepFocus]);

  function nextEnabled(from: number, step: 1 | -1): number {
    for (let i = from + step; i >= 0 && i < options.length; i += step) {
      if (!options[i]?.disabled) return i;
    }
    return from;
  }

  const choose = (index: number) => {
    const option = options[index];
    if (!option || option.disabled) return;
    close(!keepFocus);
    if (option.value !== value) onValueChange(option.value);
  };

  const typeahead = (key: string) => {
    const now = Date.now();
    typed.current = {
      text: (now - typed.current.at > 700 ? '' : typed.current.text) + key.toLocaleLowerCase(),
      at: now,
    };
    const query = typed.current.text;
    const start = open ? active : selectedIndex;
    const order = [...options.keys()].map((_, i) => (start + 1 + i) % options.length);
    const match = order.find(
      (i) => !options[i]?.disabled && options[i]?.label.toLocaleLowerCase().startsWith(query),
    );
    return match;
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const key = event.key;
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(key)) {
        event.preventDefault();
        show(key === 'ArrowUp' && selectedIndex < 0 ? nextEnabled(options.length, -1) : undefined);
      } else if (key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
        // Typing on a closed select changes the value, like a native one.
        const match = typeahead(key);
        if (match !== undefined) choose(match);
      }
      return;
    }
    if (key === 'ArrowDown' || key === 'ArrowUp') {
      event.preventDefault();
      setActive((i) => nextEnabled(i, key === 'ArrowDown' ? 1 : -1));
    } else if (key === 'Home' || key === 'End') {
      event.preventDefault();
      setActive(key === 'Home' ? nextEnabled(-1, 1) : nextEnabled(options.length, -1));
    } else if (key === 'Enter' || key === ' ') {
      event.preventDefault();
      choose(active);
    } else if (key === 'Tab') {
      close(false);
    } else if (key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const match = typeahead(key);
      if (match !== undefined) setActive(match);
    }
  };

  let index = -1;
  const renderOption = (option: SelectOption) => {
    index += 1;
    const i = index;
    const isSelected = option.value === value;
    return (
      <div
        key={`${option.value}-${i}`}
        id={optionId(i)}
        role="option"
        aria-selected={isSelected}
        aria-disabled={option.disabled || undefined}
        lang={option.lang}
        dir={option.dir}
        style={option.style}
        className={cn(
          'relative flex min-h-8 items-center gap-2 rounded-sm py-1.5 ps-7 pe-2 text-sm select-none',
          i === active && !option.disabled && 'bg-hover',
          isSelected && 'text-selected-foreground font-medium',
          option.disabled && 'opacity-50',
        )}
        onPointerMove={() => i !== active && setActive(i)}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => choose(i)}
      >
        {isSelected ? <CheckIcon className="absolute start-2 size-3.5" aria-hidden="true" /> : null}
        <span className="min-w-0 truncate">{option.content ?? option.label}</span>
      </div>
    );
  };

  return (
    <>
      <button
        ref={trigger}
        type="button"
        id={id}
        title={title}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open && keepFocus && active >= 0 ? optionId(active) : undefined}
        disabled={disabled}
        className={cn(selectTriggerClass, SIZES[size], className)}
        onMouseDown={keepFocus ? (e) => e.preventDefault() : undefined}
        onClick={() => (open ? close(false) : show())}
        onKeyDown={onKeyDown}
        {...aria}
      >
        <span
          className="min-w-0 truncate"
          lang={selected?.lang}
          dir={selected?.dir}
          style={selected?.style}
        >
          {renderValue
            ? renderValue(selected)
            : (selected?.label ?? <span className="text-stone-500">{placeholder ?? value}</span>)}
        </span>
        <ChevronDownIcon
          aria-hidden="true"
          className={cn('size-3.5 shrink-0 opacity-60 transition-transform', open && 'rotate-180')}
        />
      </button>
      {open && position ? (
        <div
          ref={list}
          id={listId}
          role="listbox"
          tabIndex={-1}
          aria-labelledby={id}
          aria-label={id ? undefined : aria['aria-label']}
          aria-activedescendant={active >= 0 ? optionId(active) : undefined}
          className={cn(
            'bg-popover text-foreground fixed z-50 max-w-[min(22rem,calc(100vw-1rem))] overflow-y-auto rounded-md border border-stone-200 p-1 shadow-lg outline-none',
            contentClassName,
          )}
          style={position}
          onKeyDown={onKeyDown}
        >
          {items.map((item) =>
            isGroup(item) ? (
              <div key={`g-${item.group}`} role="group" aria-label={item.group}>
                <div className="px-2 pt-2 pb-1 text-xs font-semibold text-stone-500 select-none">
                  {item.group}
                </div>
                {item.options.map(renderOption)}
              </div>
            ) : (
              renderOption(item)
            ),
          )}
        </div>
      ) : null}
    </>
  );
}

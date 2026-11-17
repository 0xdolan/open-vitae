import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';

import { arrayMove } from '@/lib/document-ops';
import { targetIndex } from '@/lib/sortable';
import { cn } from '@/lib/utils';
import { useT } from '@/i18n';

interface DragState {
  readonly id: string;
  readonly from: number;
  readonly over: number;
  readonly mode: 'pointer' | 'keyboard';
}

export interface SortableItemContext {
  /** Spread onto the drag handle button. */
  readonly handleProps: HTMLAttributes<HTMLButtonElement> & {
    ref: (el: HTMLButtonElement | null) => void;
  };
  readonly index: number;
  readonly isDragging: boolean;
  /** Keyboard mode: this item is where the picked-up item will land. */
  readonly isDropTarget: boolean;
}

interface SortableListProps<T> {
  readonly items: readonly T[];
  readonly getId: (item: T) => string;
  /** Spoken name of an item, e.g. the section title. */
  readonly getLabel: (item: T) => string;
  readonly onMove: (from: number, to: number) => void;
  readonly renderItem: (item: T, context: SortableItemContext) => ReactNode;
  /** Accessible name of the list. */
  readonly label: string;
  readonly className?: string;
}

/**
 * Reorderable list that works with a mouse, touch and the keyboard, without
 * a drag-and-drop library.
 *
 * - Pointer: press the handle and drag; items move out of the way as you go.
 * - Keyboard: focus the handle, Space or Enter to pick up, arrow keys (or Home
 *   and End) to choose the place, Space or Enter to drop, Escape to cancel.
 * - Every step is announced to screen readers.
 */
export function SortableList<T>({
  items,
  getId,
  getLabel,
  onMove,
  renderItem,
  label,
  className,
}: SortableListProps<T>) {
  const instructionsId = useId();
  const [drag, setDrag] = useState<DragState | null>(null);
  const t = useT();
  const [announcement, setAnnouncement] = useState('');
  const itemRefs = useRef(new Map<string, HTMLLIElement>());
  const handleRefs = useRef(new Map<string, HTMLButtonElement>());
  const middles = useRef<number[]>([]);
  const refocusId = useRef<string | null>(null);

  // Live reorder while dragging with a pointer; keyboard mode shows a target instead,
  // so the focused handle never moves in the DOM until the drop.
  const shown = drag?.mode === 'pointer' ? arrayMove(items, drag.from, drag.over) : items;

  useLayoutEffect(() => {
    if (refocusId.current) {
      handleRefs.current.get(refocusId.current)?.focus();
      refocusId.current = null;
    }
  });

  const position = (index: number) => t('sort.position', { index: index + 1, total: items.length });

  const finish = useCallback(
    (state: DragState, commit: boolean) => {
      const item = items[state.from];
      const name = item ? getLabel(item) : '';
      setDrag(null);
      if (commit && state.over !== state.from) {
        refocusId.current = state.mode === 'keyboard' ? state.id : null;
        onMove(state.from, state.over);
        setAnnouncement(t('sort.dropped', { name, position: position(state.over) }));
      } else {
        setAnnouncement(
          commit
            ? t('sort.droppedSame', { name })
            : t('sort.cancelled', { name, position: position(state.from) }),
        );
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- position depends only on items.length
    [items, getLabel, onMove],
  );

  const onPointerDown = (event: PointerEvent<HTMLButtonElement>, id: string, index: number) => {
    if (event.button !== 0) return;
    event.preventDefault();
    middles.current = items.map((item) => {
      const rect = itemRefs.current.get(getId(item))?.getBoundingClientRect();
      return rect ? rect.top + rect.height / 2 : 0;
    });
    setDrag({ id, from: index, over: index, mode: 'pointer' });
  };

  // Track the pointer on the window, not the handle: the handle moves in the page as
  // items reorder, and moving an element makes the browser drop its pointer capture.
  const dragRef = useRef(drag);
  dragRef.current = drag;
  const pointerDragging = drag?.mode === 'pointer';
  useEffect(() => {
    if (!pointerDragging) return;
    const onMove = (event: globalThis.PointerEvent) => {
      const current = dragRef.current;
      if (current?.mode !== 'pointer') return;
      const over = targetIndex(event.clientY, middles.current, current.from);
      if (over !== current.over) setDrag({ ...current, over });
    };
    const onUp = () => {
      const current = dragRef.current;
      if (current?.mode === 'pointer') finish(current, true);
    };
    const onCancel = () => {
      const current = dragRef.current;
      if (current?.mode === 'pointer') finish(current, false);
    };
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') onCancel();
    };
    const previousCursor = document.body.style.cursor;
    document.body.style.cursor = 'grabbing';
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.cursor = previousCursor;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
      window.removeEventListener('keydown', onKey);
    };
  }, [pointerDragging, finish]);

  const onKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    id: string,
    index: number,
    name: string,
  ) => {
    const picked = drag?.mode === 'keyboard' && drag.id === id ? drag : null;

    if (!picked) {
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        setDrag({ id, from: index, over: index, mode: 'keyboard' });
        setAnnouncement(t('sort.picked', { name, position: position(index) }));
      }
      return;
    }

    const moveTo = (over: number) => {
      const clamped = Math.max(0, Math.min(items.length - 1, over));
      setDrag({ ...picked, over: clamped });
      setAnnouncement(t('sort.moved', { name, position: position(clamped) }));
    };

    switch (event.key) {
      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault();
        moveTo(picked.over - 1);
        break;
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault();
        moveTo(picked.over + 1);
        break;
      case 'Home':
        event.preventDefault();
        moveTo(0);
        break;
      case 'End':
        event.preventDefault();
        moveTo(items.length - 1);
        break;
      case ' ':
      case 'Enter':
        event.preventDefault();
        finish(picked, true);
        break;
      case 'Escape':
        event.preventDefault();
        finish(picked, false);
        break;
      case 'Tab':
        finish(picked, false);
        break;
    }
  };

  return (
    <>
      <ul aria-label={label} className={className}>
        {shown.map((item, index) => {
          const id = getId(item);
          const name = getLabel(item);
          const originalIndex = items.findIndex((i) => getId(i) === id);
          const isDragging = drag?.id === id;
          const isDropTarget = drag?.mode === 'keyboard' && !isDragging && drag.over === index;
          return (
            <li
              key={id}
              ref={(el) => {
                if (el) itemRefs.current.set(id, el);
                else itemRefs.current.delete(id);
              }}
              className={cn(isDragging && 'relative z-10')}
            >
              {renderItem(item, {
                index,
                isDragging,
                isDropTarget,
                handleProps: {
                  ref: (el) => {
                    if (el) handleRefs.current.set(id, el);
                    else handleRefs.current.delete(id);
                  },
                  'aria-label': t('sort.reorder', { name }),
                  'aria-describedby': instructionsId,
                  'aria-pressed': isDragging && drag?.mode === 'keyboard' ? true : undefined,
                  onPointerDown: (e) => onPointerDown(e, id, originalIndex),
                  onKeyDown: (e) => onKeyDown(e, id, originalIndex, name),
                  onBlur: () => {
                    if (drag?.mode === 'keyboard' && drag.id === id && !refocusId.current)
                      finish(drag, false);
                  },
                  style: {
                    touchAction: 'none',
                    cursor: drag?.mode === 'pointer' ? 'grabbing' : 'grab',
                  },
                },
              })}
            </li>
          );
        })}
      </ul>
      <p id={instructionsId} className="sr-only">
        {t('sort.help')}
      </p>
      <p aria-live="assertive" className="sr-only">
        {announcement}
      </p>
    </>
  );
}

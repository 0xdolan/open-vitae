import { useEffect, useRef, type RefObject } from 'react';

/** Open popups, innermost last: Escape closes only the top one. */
const stack: symbol[] = [];

/**
 * Close a popup on a pointer press outside it and on Escape. Pass every
 * element that counts as "inside" (the popup and the button that opens it).
 * Escape closes only the most recently opened popup (a list inside a panel
 * closes before the panel), and is caught before a surrounding <dialog> sees it.
 */
export function useDismiss(
  open: boolean,
  inside: readonly RefObject<HTMLElement | null>[],
  onDismiss: (reason: 'outside' | 'escape') => void,
): void {
  // Keep the latest values without re-subscribing on every render.
  const latest = useRef({ inside, onDismiss });
  latest.current = { inside, onDismiss };

  useEffect(() => {
    if (!open) return;
    const token = Symbol('popup');
    stack.push(token);
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (latest.current.inside.some((ref) => ref.current?.contains(target))) return;
      latest.current.onDismiss('outside');
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || stack[stack.length - 1] !== token) return;
      event.preventDefault();
      event.stopPropagation();
      latest.current.onDismiss('escape');
    };
    document.addEventListener('pointerdown', onPointer, true);
    document.addEventListener('keydown', onKey, true);
    return () => {
      stack.splice(stack.indexOf(token), 1);
      document.removeEventListener('pointerdown', onPointer, true);
      document.removeEventListener('keydown', onKey, true);
    };
  }, [open]);
}

/** True while a popup that handles Escape itself, or a modal dialog, is open. */
export function isEscapeTaken(): boolean {
  return stack.length > 0 || document.querySelector('dialog[open]') !== null;
}

type BackdropEvent = { readonly target: EventTarget; readonly currentTarget: EventTarget };

/**
 * For a native modal <dialog>: a click on the backdrop (outside the dialog's
 * box) closes it, like Escape does. A press that starts inside and ends
 * outside (selecting text, dragging) does not count. Spread the result on
 * the <dialog>; its content must fill the dialog box (no padding on it).
 */
export function useBackdropDismiss(onDismiss: () => void) {
  const pressed = useRef(false);
  return {
    onPointerDown: (event: BackdropEvent) => {
      pressed.current = event.target === event.currentTarget;
    },
    onClick: (event: BackdropEvent) => {
      if (pressed.current && event.target === event.currentTarget) onDismiss();
      pressed.current = false;
    },
  };
}

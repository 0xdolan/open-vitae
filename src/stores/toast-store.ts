import { create } from 'zustand';

import { createId } from '@/lib/id';

export type ToastTone = 'success' | 'error' | 'info';

export interface Toast {
  readonly id: string;
  readonly tone: ToastTone;
  readonly title: string;
  readonly description?: string;
  /** Optional button, such as "Undo". Clicking it also closes the toast. */
  readonly action?: { readonly label: string; readonly onClick: () => void };
  /** Visible time; paused while hovered or focused. */
  readonly durationMs: number;
}

interface ToastState {
  readonly toasts: readonly Toast[];
  show(toast: Omit<Toast, 'id' | 'durationMs'> & { durationMs?: number }): string;
  dismiss(id: string): void;
}

const MAX_VISIBLE = 3;

export const useToastStore = create<ToastState>()((set) => ({
  toasts: [],
  show(input) {
    const toast: Toast = { durationMs: 7000, ...input, id: createId() };
    set((state) => ({ toasts: [...state.toasts.slice(-(MAX_VISIBLE - 1)), toast] }));
    return toast.id;
  },
  dismiss(id) {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
}));

/** Shortcut for showing messages from anywhere in the app. */
export const toast = {
  success: (title: string, description?: string) =>
    useToastStore.getState().show({ tone: 'success', title, description }),
  error: (title: string, description?: string) =>
    useToastStore.getState().show({ tone: 'error', title, description, durationMs: 10_000 }),
  info: (title: string, description?: string, action?: Toast['action']) =>
    useToastStore
      .getState()
      .show({ tone: 'info', title, description, action, durationMs: action ? 10_000 : 7000 }),
};

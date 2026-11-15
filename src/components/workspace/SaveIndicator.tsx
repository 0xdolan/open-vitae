import type { SaveState } from '@/stores';

const LABELS: Record<SaveState, string> = {
  idle: '',
  unsaved: 'Unsaved changes',
  saving: 'Saving…',
  saved: 'Saved in this browser',
  error: 'Not saved',
};

export function SaveIndicator({ state }: { readonly state: SaveState }) {
  return (
    <p
      role="status"
      aria-live="polite"
      className={state === 'error' ? 'text-xs font-semibold text-red-700' : 'text-xs text-stone-500'}
    >
      {LABELS[state]}
    </p>
  );
}

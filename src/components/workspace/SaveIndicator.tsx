import { formatDateTime, formatTime } from '@/lib/datetime';
import type { VersionSummary } from '@/lib/versions/repository';
import type { SaveState } from '@/stores';

interface SaveIndicatorProps {
  readonly state: SaveState;
  readonly latest: VersionSummary | undefined;
}

/** "Saved · version 12 · 19:05:23", with the full date and time on hover. */
export function SaveIndicator({ state, latest }: SaveIndicatorProps) {
  let text = '';
  if (state === 'unsaved') text = 'Unsaved changes';
  else if (state === 'saving') text = 'Saving…';
  else if (state === 'error') text = 'Not saved';
  else if (latest) text = `Saved · version ${latest.number} · ${formatTime(latest.savedAt)}`;

  return (
    <p
      role="status"
      aria-live="polite"
      title={
        latest && state !== 'error'
          ? `Version ${latest.number}, saved ${formatDateTime(latest.savedAt)}`
          : undefined
      }
      className={
        state === 'error' ? 'text-xs font-semibold text-red-700' : 'text-xs text-stone-500'
      }
    >
      {text}
    </p>
  );
}

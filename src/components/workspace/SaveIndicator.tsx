import { formatDateTime, formatTime } from '@/lib/datetime';
import type { VersionSummary } from '@/lib/versions/repository';
import type { SaveState } from '@/stores';
import { useT } from '@/i18n';

interface SaveIndicatorProps {
  readonly state: SaveState;
  readonly latest: VersionSummary | undefined;
}

/** "Saved · version 12 · 19:05:23", with the full date and time on hover. */
export function SaveIndicator({ state, latest }: SaveIndicatorProps) {
  const t = useT();
  let text = '';
  if (state === 'unsaved') text = t('save.unsaved');
  else if (state === 'saving') text = t('save.saving');
  else if (state === 'error') text = t('save.error');
  else if (latest)
    text = t('save.saved', { number: latest.number, time: formatTime(latest.savedAt, t.locale) });

  return (
    <p
      role="status"
      aria-live="polite"
      title={
        latest && state !== 'error'
          ? t('save.savedTitle', {
              number: latest.number,
              when: formatDateTime(latest.savedAt, t.locale),
            })
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

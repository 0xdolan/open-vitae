import { Button } from '@/components/ui/button';
import { DownloadIcon } from '@/components/ui/icons';
import { useT } from '@/i18n';
import { usePwaStore } from '@/pwa/pwa-store';

/** "Install app", shown only when the browser offers it and the app is not installed. */
export function InstallButton() {
  const t = useT();
  const installable = usePwaStore((s) => s.installable && !s.installed);
  const install = usePwaStore((s) => s.install);
  if (!installable) return null;
  return (
    <Button size="sm" title={t('pwa.installHint')} onClick={() => void install()}>
      <DownloadIcon /> {t('pwa.install')}
    </Button>
  );
}

/** A small badge while offline. Everything keeps working; only Google Fonts wait. */
export function OfflineBadge() {
  const t = useT();
  const online = usePwaStore((s) => s.online);
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed start-4 bottom-4 z-40"
    >
      {online ? null : (
        <p
          className="pointer-events-auto flex max-w-xs items-start gap-2 rounded-lg border border-stone-300 bg-card px-3 py-2 text-xs text-stone-700 shadow"
          title={t('pwa.offlineHint')}
        >
          <span aria-hidden="true" className="mt-1 size-2 shrink-0 rounded-full bg-amber-500" />
          <span>
            <strong className="block text-sm text-ink">{t('pwa.offline')}</strong>
            {t('pwa.offlineHint')}
          </span>
        </p>
      )}
    </div>
  );
}

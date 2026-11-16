import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { formatBytes } from '@/lib/format';
import { getStorageInfo, requestPersistentStorage, type StorageInfo } from '@/lib/storage';
import { useT } from '@/i18n';

/**
 * Tells people plainly where their data lives and what deletes it, and offers
 * to ask the browser not to evict it when disk space runs low.
 */
export function StorageNotice() {
  const t = useT();
  const [info, setInfo] = useState<StorageInfo | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getStorageInfo().then((result) => {
      if (!cancelled) setInfo(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const askToKeep = async () => {
    await requestPersistentStorage();
    setInfo(await getStorageInfo());
  };

  return (
    <aside
      aria-label={t('storage.label')}
      className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950"
    >
      <p className="min-w-0 flex-[1_1_16rem]">
        <strong>{t('storage.title')}</strong> {t('storage.body')}
        {info?.usageBytes ? ` ${t('storage.usage', { size: formatBytes(info.usageBytes) })}` : ''}
      </p>
      {info?.persisted === false ? (
        <Button size="sm" onClick={() => void askToKeep()}>
          {t('storage.keep')}
        </Button>
      ) : null}
      {info?.persisted === true ? (
        <span className="text-xs font-medium">{t('storage.kept')}</span>
      ) : null}
    </aside>
  );
}

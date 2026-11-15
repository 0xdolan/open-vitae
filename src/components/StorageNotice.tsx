import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { formatBytes } from '@/lib/format';
import { getStorageInfo, requestPersistentStorage, type StorageInfo } from '@/lib/storage';

/**
 * Tells people plainly where their data lives and what deletes it, and offers
 * to ask the browser not to evict it when disk space runs low.
 */
export function StorageNotice() {
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
      aria-label="Where your data is stored"
      className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950"
    >
      <p className="min-w-0 flex-1">
        <strong>Your resumes stay in this browser only.</strong> Nothing is sent to a server.
        Clearing this site’s data or your browser cache deletes them.
        {info?.usageBytes ? ` Using ${formatBytes(info.usageBytes)}.` : ''}
      </p>
      {info?.persisted === false ? (
        <Button size="sm" onClick={() => void askToKeep()}>
          Ask the browser to keep my data
        </Button>
      ) : null}
      {info?.persisted === true ? (
        <span className="text-xs font-medium">
          The browser will keep this data when space is low.
        </span>
      ) : null}
    </aside>
  );
}

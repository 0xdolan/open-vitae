import { useEffect, useSyncExternalStore } from 'react';

import type { IconSetId } from '@/config/icon-sets';
import {
  getIconSet,
  loadIconSet,
  subscribeIconSets,
  type LoadedIconSet,
} from '@/lib/icons/registry';

/** The loaded set, loading it if needed. Undefined until it arrives. */
export function useIconSet(id: IconSetId | null): LoadedIconSet | undefined {
  const set = useSyncExternalStore(subscribeIconSets, () => (id ? getIconSet(id) : undefined));
  useEffect(() => {
    if (id && !getIconSet(id)) void loadIconSet(id).catch(() => undefined);
  }, [id]);
  return set;
}

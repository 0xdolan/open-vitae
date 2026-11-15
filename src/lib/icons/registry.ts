import type { ComponentType } from 'react';

import { ICON_SETS, type IconSetId } from '@/config/icon-sets';

/** Props the icon components accept (a subset of react-icons' IconBaseProps). */
export interface IconComponentProps {
  readonly className?: string;
  readonly size?: string | number;
  readonly 'aria-hidden'?: boolean | 'true';
  readonly focusable?: string;
}

export type IconComponent = ComponentType<IconComponentProps>;

export interface LoadedIconSet {
  readonly id: IconSetId;
  /** Component names in the set, sorted. */
  readonly names: readonly string[];
  get(name: string): IconComponent | undefined;
}

/**
 * One loader per set, written out so the bundler makes a separate file for
 * each set and loads it only when needed. Lucide is small and used for the
 * contact line, so it is kept for offline use; the others are cached when
 * first loaded.
 */
const LOADERS: Readonly<Record<IconSetId, () => Promise<Record<string, unknown>>>> = {
  lu: () => import('react-icons/lu'),
  fa6: () => import('react-icons/fa6'),
  si: () => import('react-icons/si'),
  tb: () => import('react-icons/tb'),
  md: () => import('react-icons/md'),
  bs: () => import('react-icons/bs'),
  pi: () => import('react-icons/pi'),
  ri: () => import('react-icons/ri'),
  hi2: () => import('react-icons/hi2'),
  io5: () => import('react-icons/io5'),
  fi: () => import('react-icons/fi'),
  ai: () => import('react-icons/ai'),
  bi: () => import('react-icons/bi'),
  cg: () => import('react-icons/cg'),
  ci: () => import('react-icons/ci'),
  di: () => import('react-icons/di'),
  fa: () => import('react-icons/fa'),
  fc: () => import('react-icons/fc'),
  gi: () => import('react-icons/gi'),
  go: () => import('react-icons/go'),
  gr: () => import('react-icons/gr'),
  hi: () => import('react-icons/hi'),
  im: () => import('react-icons/im'),
  io: () => import('react-icons/io'),
  lia: () => import('react-icons/lia'),
  rx: () => import('react-icons/rx'),
  sl: () => import('react-icons/sl'),
  tfi: () => import('react-icons/tfi'),
  ti: () => import('react-icons/ti'),
  vsc: () => import('react-icons/vsc'),
  wi: () => import('react-icons/wi'),
};

const loaded = new Map<IconSetId, LoadedIconSet>();
const loading = new Map<IconSetId, Promise<LoadedIconSet>>();
const listeners = new Set<() => void>();

function toSet(id: IconSetId, module: Record<string, unknown>): LoadedIconSet {
  const { prefix } = ICON_SETS[id];
  const components = new Map<string, IconComponent>();
  for (const [name, value] of Object.entries(module)) {
    if (typeof value === 'function' && name.startsWith(prefix))
      components.set(name, value as IconComponent);
  }
  const names = [...components.keys()].sort((a, b) => a.localeCompare(b));
  return { id, names, get: (name) => components.get(name) };
}

/** The set if it has finished loading. */
export function getIconSet(id: IconSetId): LoadedIconSet | undefined {
  return loaded.get(id);
}

/** Load a set once; later calls share the same request. */
export function loadIconSet(id: IconSetId): Promise<LoadedIconSet> {
  const ready = loaded.get(id);
  if (ready) return Promise.resolve(ready);
  let promise = loading.get(id);
  if (!promise) {
    promise = LOADERS[id]()
      .then((module) => {
        const set = toSet(id, module);
        loaded.set(id, set);
        for (const listener of listeners) listener();
        return set;
      })
      .finally(() => loading.delete(id));
    loading.set(id, promise);
  }
  return promise;
}

/** For useSyncExternalStore: called whenever a set finishes loading. */
export function subscribeIconSets(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

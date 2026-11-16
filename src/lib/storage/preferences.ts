import { DEFAULT_RETENTION, parseRetention, type Retention } from '@/config/versions';

/** Small UI preferences. Holds ids and settings only, never resume content. */
export interface PreferenceStore {
  getActiveId(): string | null;
  setActiveId(id: string | null): void;
  getRetention(): Retention;
  setRetention(retention: Retention): void;
}

const ACTIVE_KEY = 'open-vitae:active-resume';
const RETENTION_KEY = 'open-vitae:version-retention';

function readLocal(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeLocal(key: string, value: string | null): void {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // Not critical: defaults apply.
  }
}

/** localStorage can throw (private mode, disabled storage); treat that as "no preference". */
export function createLocalPreferences(): PreferenceStore {
  return {
    getActiveId: () => readLocal(ACTIVE_KEY),
    setActiveId: (id) => writeLocal(ACTIVE_KEY, id),
    getRetention: () => parseRetention(readLocal(RETENTION_KEY)),
    setRetention: (retention) => writeLocal(RETENTION_KEY, String(retention)),
  };
}

export function createMemoryPreferences(): PreferenceStore {
  let active: string | null = null;
  let retention: Retention = DEFAULT_RETENTION;
  return {
    getActiveId: () => active,
    setActiveId: (id) => {
      active = id;
    },
    getRetention: () => retention,
    setRetention: (value) => {
      retention = value;
    },
  };
}

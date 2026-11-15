/** Small UI preferences. Holds ids only, never resume content. */
export interface PreferenceStore {
  getActiveId(): string | null;
  setActiveId(id: string | null): void;
}

const ACTIVE_KEY = 'open-vitae:active-resume';

/** localStorage can throw (private mode, disabled storage); treat that as "no preference". */
export function createLocalPreferences(): PreferenceStore {
  return {
    getActiveId() {
      try {
        return localStorage.getItem(ACTIVE_KEY);
      } catch {
        return null;
      }
    },
    setActiveId(id) {
      try {
        if (id === null) {
          localStorage.removeItem(ACTIVE_KEY);
        } else {
          localStorage.setItem(ACTIVE_KEY, id);
        }
      } catch {
        // Not critical: the app falls back to the most recently edited resume.
      }
    },
  };
}

export function createMemoryPreferences(): PreferenceStore {
  let active: string | null = null;
  return {
    getActiveId: () => active,
    setActiveId: (id) => {
      active = id;
    },
  };
}

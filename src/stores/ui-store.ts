import { create } from 'zustand';

import {
  DEFAULT_LIBRARY_VIEW,
  DEFAULT_THEME,
  isLibraryView,
  isTheme,
  UI_STORAGE_KEYS,
  type LibraryView,
  type Theme,
} from '@/config/ui';

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage can be unavailable (private mode); the choice then lasts for this visit.
  }
}

export interface UiState {
  readonly theme: Theme;
  readonly previewCollapsed: boolean;
  readonly libraryView: LibraryView;
  readonly hideSamples: boolean;
  setTheme(theme: Theme): void;
  setPreviewCollapsed(collapsed: boolean): void;
  setLibraryView(view: LibraryView): void;
  setHideSamples(hide: boolean): void;
}

/** Interface preferences: theme, preview pane, library view. Saved in localStorage. */
export const useUiStore = create<UiState>()((set) => {
  const theme = read(UI_STORAGE_KEYS.theme);
  const view = read(UI_STORAGE_KEYS.libraryView);
  return {
    theme: isTheme(theme) ? theme : DEFAULT_THEME,
    previewCollapsed: read(UI_STORAGE_KEYS.previewCollapsed) === 'true',
    libraryView: isLibraryView(view) ? view : DEFAULT_LIBRARY_VIEW,
    hideSamples: read(UI_STORAGE_KEYS.hideSamples) === 'true',
    setTheme: (next) => {
      write(UI_STORAGE_KEYS.theme, next);
      set({ theme: next });
    },
    setPreviewCollapsed: (collapsed) => {
      write(UI_STORAGE_KEYS.previewCollapsed, String(collapsed));
      set({ previewCollapsed: collapsed });
    },
    setLibraryView: (next) => {
      write(UI_STORAGE_KEYS.libraryView, next);
      set({ libraryView: next });
    },
    setHideSamples: (hide) => {
      write(UI_STORAGE_KEYS.hideSamples, String(hide));
      set({ hideSamples: hide });
    },
  };
});

/** The theme actually shown: "system" follows the operating system setting. */
export function resolveTheme(theme: Theme, prefersDark: boolean): 'light' | 'dark' {
  if (theme === 'system') return prefersDark ? 'dark' : 'light';
  return theme;
}

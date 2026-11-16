/** Interface preferences kept in this browser (localStorage). Never resume content. */

export const THEMES = ['light', 'dark', 'system'] as const;
export type Theme = (typeof THEMES)[number];
export const DEFAULT_THEME: Theme = 'system';

/** How the My resumes screen lists resumes. */
export const LIBRARY_VIEWS = ['grid', 'list', 'thumbnails'] as const;
export type LibraryView = (typeof LIBRARY_VIEWS)[number];
export const DEFAULT_LIBRARY_VIEW: LibraryView = 'grid';

/** Width of a resume thumbnail on the My resumes screen, in CSS pixels. */
export const THUMBNAIL_WIDTH_PX = 220;

export const UI_STORAGE_KEYS = {
  theme: 'open-vitae:theme',
  previewCollapsed: 'open-vitae:preview-collapsed',
  libraryView: 'open-vitae:library-view',
  hideSamples: 'open-vitae:hide-samples',
} as const;

export function isTheme(value: unknown): value is Theme {
  return typeof value === 'string' && (THEMES as readonly string[]).includes(value);
}

export function isLibraryView(value: unknown): value is LibraryView {
  return typeof value === 'string' && (LIBRARY_VIEWS as readonly string[]).includes(value);
}

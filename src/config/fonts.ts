export type TextDirection = 'ltr' | 'rtl';

export type FontSource = 'bundled' | 'google' | 'system' | 'user';

export interface FontOption {
  readonly family: string;
  readonly source: FontSource;
  /** CSS fallback stack appended after the family. */
  readonly fallback: string;
}

/** Fonts that ship with the app and work offline. */
export const BUNDLED_FONTS: readonly FontOption[] = [
  { family: 'Manrope', source: 'bundled', fallback: 'system-ui, sans-serif' },
  { family: 'Sahel', source: 'bundled', fallback: 'Tahoma, system-ui, sans-serif' },
  { family: 'Estedad', source: 'bundled', fallback: 'Tahoma, system-ui, sans-serif' },
];

/**
 * Proprietary fonts are never shipped. We use the copy installed on the user's
 * machine and fall back to the metric-compatible open fonts Arimo and Tinos.
 */
export const SYSTEM_FONTS: readonly FontOption[] = [
  { family: 'Arial', source: 'system', fallback: 'Arimo, Helvetica, sans-serif' },
  { family: 'Times New Roman', source: 'system', fallback: 'Tinos, Times, serif' },
];

export const DEFAULT_FONT_BY_DIRECTION: Readonly<Record<TextDirection, string>> = {
  ltr: 'Manrope',
  rtl: 'Sahel',
};

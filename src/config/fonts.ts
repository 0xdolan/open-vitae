export const TEXT_DIRECTIONS = ['ltr', 'rtl'] as const;

export type TextDirection = (typeof TEXT_DIRECTIONS)[number];

export type FontSource = 'bundled' | 'google' | 'system' | 'user';

export interface FontOption {
  readonly family: string;
  readonly source: FontSource;
  /** Whether the font covers Arabic-script letters (Persian, Arabic, Kurdish, Urdu...). */
  readonly arabicScript: boolean;
  /** CSS fallback stack appended after the family. */
  readonly fallback: string;
}

/** Fonts that ship with the app and work offline. */
export const BUNDLED_FONTS: readonly FontOption[] = [
  { family: 'Manrope', source: 'bundled', arabicScript: false, fallback: 'system-ui, sans-serif' },
  { family: 'Sahel', source: 'bundled', arabicScript: true, fallback: 'Tahoma, system-ui, sans-serif' },
  { family: 'Estedad', source: 'bundled', arabicScript: true, fallback: 'Tahoma, system-ui, sans-serif' },
];

/**
 * Proprietary fonts are never shipped. We use the copy installed on the user's
 * machine and fall back to the metric-compatible open fonts Arimo and Tinos.
 */
export const SYSTEM_FONTS: readonly FontOption[] = [
  { family: 'Arial', source: 'system', arabicScript: true, fallback: 'Arimo, Helvetica, sans-serif' },
  { family: 'Times New Roman', source: 'system', arabicScript: true, fallback: 'Tinos, Times, serif' },
];

export const KNOWN_FONTS: readonly FontOption[] = [...BUNDLED_FONTS, ...SYSTEM_FONTS];

export const DEFAULT_FONT_BY_DIRECTION: Readonly<Record<TextDirection, string>> = {
  ltr: 'Manrope',
  rtl: 'Sahel',
};

/** The font used for any Arabic-script character the primary font cannot draw. */
export const ARABIC_SCRIPT_FALLBACK = 'Sahel';

function quote(family: string): string {
  return `"${family.replace(/["\\]/g, '')}"`;
}

/**
 * Build a CSS font-family stack.
 *
 * Sahel is always inserted right after a primary font that lacks Arabic-script
 * glyphs, so Persian or Arabic words inside an English resume (and the other
 * way round) render in Sahel rather than whatever the operating system picks.
 */
export function fontStack(family: string): string {
  const known = KNOWN_FONTS.find((f) => f.family === family);
  const parts = [quote(family)];

  if (!known?.arabicScript && family !== ARABIC_SCRIPT_FALLBACK) {
    parts.push(quote(ARABIC_SCRIPT_FALLBACK));
  }

  parts.push(known?.fallback ?? 'system-ui, sans-serif');
  return parts.join(', ');
}

import type { TextDirection } from '@/config/fonts';

/** Languages the interface is offered in. Resume content can be in any language. */
export const UI_LOCALES = [
  { tag: 'en', label: 'English', nativeName: 'English', direction: 'ltr' },
  { tag: 'fa', label: 'Persian', nativeName: 'فارسی', direction: 'rtl' },
  { tag: 'ar', label: 'Arabic', nativeName: 'العربية', direction: 'rtl' },
  { tag: 'ckb', label: 'Kurdish (Sorani)', nativeName: 'کوردی (سۆرانی)', direction: 'rtl' },
] as const satisfies readonly {
  tag: string;
  label: string;
  nativeName: string;
  direction: TextDirection;
}[];

export type UiLocale = (typeof UI_LOCALES)[number]['tag'];

export const DEFAULT_UI_LOCALE: UiLocale = 'en';

export function isUiLocale(value: string): value is UiLocale {
  return UI_LOCALES.some((locale) => locale.tag === value);
}

/**
 * Digits for numbers in the interface where the browser's own choice is
 * wrong or missing: Sorani is written with Arabic-Indic digits, but browsers
 * without Sorani data would use Western ones.
 */
export const UI_NUMBERING: Readonly<Partial<Record<UiLocale, string>>> = { ckb: 'arab' };

export function localeDirection(locale: UiLocale): TextDirection {
  return UI_LOCALES.find((l) => l.tag === locale)?.direction ?? 'ltr';
}

/**
 * The best interface language for the browser's preferred languages:
 * "fa-IR" → fa, "ar-EG" → ar, "ckb-IQ" → ckb. Plain "ku" is not matched,
 * because it can mean Kurmanji as well as Sorani.
 */
export function detectUiLocale(preferred: readonly string[]): UiLocale {
  for (const tag of preferred) {
    const base = tag.toLowerCase().split(/[-_]/)[0] ?? '';
    if (isUiLocale(base)) return base;
  }
  return DEFAULT_UI_LOCALE;
}

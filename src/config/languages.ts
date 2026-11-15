import type { TextDirection } from './fonts';

export interface ResumeLanguage {
  /** BCP 47 tag stored in the resume. */
  readonly tag: string;
  /** English name, for the settings menu. */
  readonly label: string;
  /** The language's own name. */
  readonly nativeName: string;
  readonly direction: TextDirection;
}

/**
 * Languages with their own default section titles. The full translation
 * system in phase 9 adds more; until then other tags are kept as they are.
 */
export const RESUME_LANGUAGES: readonly ResumeLanguage[] = [
  { tag: 'en', label: 'English', nativeName: 'English', direction: 'ltr' },
  { tag: 'ar', label: 'Arabic', nativeName: 'العربية', direction: 'rtl' },
  { tag: 'ckb', label: 'Kurdish (Sorani)', nativeName: 'کوردی (سۆرانی)', direction: 'rtl' },
  { tag: 'fa', label: 'Persian', nativeName: 'فارسی', direction: 'rtl' },
];

export function findResumeLanguage(tag: string): ResumeLanguage | undefined {
  const base = tag.split('-')[0]?.toLowerCase();
  return RESUME_LANGUAGES.find((language) => language.tag === base);
}

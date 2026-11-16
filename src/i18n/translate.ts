import { UI_NUMBERING, type UiLocale } from './locales';

/**
 * A message is a string with {placeholders}, or a set of plural forms chosen
 * by the `count` parameter using the language's own plural rules (Arabic has
 * six forms, English two). Missing forms fall back to `other`.
 */
export type PluralMessage = Partial<Record<Intl.LDMLPluralRule, string>> & {
  readonly other: string;
};
export type Message = string | PluralMessage;

export type Params = Readonly<Record<string, string | number>>;

export type Catalog<K extends string> = Readonly<Record<K, Message>>;
export type Translations<K extends string> = Readonly<Partial<Record<K, Message>>>;

export type Translator<K extends string> = (key: K, params?: Params) => string;

/** Placeholders used in a message, e.g. ["name", "count"]. */
export function placeholders(message: Message): string[] {
  const texts = typeof message === 'string' ? [message] : Object.values(message);
  const names = new Set<string>();
  for (const text of texts)
    for (const match of (text ?? '').matchAll(/\{(\w+)\}/g)) if (match[1]) names.add(match[1]);
  return [...names].sort();
}

/** Numbers in the interface language's digits: 12 → "۱۲" in Persian, "١٢" in Sorani. */
export function numberFormat(locale: UiLocale): Intl.NumberFormat {
  const numberingSystem = UI_NUMBERING[locale];
  return new Intl.NumberFormat(locale, numberingSystem ? { numberingSystem } : {});
}

/**
 * Build a translator for a locale. Keys missing from the locale fall back to
 * English, so a partly translated language still works. Numbers in
 * parameters are written with the locale's digits (Persian digits for fa).
 */
export function createTranslator<K extends string>(
  locale: UiLocale,
  source: Catalog<K>,
  translations: Translations<K>,
): Translator<K> {
  const plural = new Intl.PluralRules(locale);
  const number = numberFormat(locale);
  return (key, params = {}) => {
    const message = translations[key] ?? source[key];
    let text: string;
    if (typeof message === 'string') {
      text = message;
    } else {
      const count = typeof params.count === 'number' ? params.count : 0;
      text = message[plural.select(count)] ?? message.other;
    }
    return text.replace(/\{(\w+)\}/g, (match, name: string) => {
      const value = params[name];
      if (value === undefined) return match;
      return typeof value === 'number' ? number.format(value) : value;
    });
  };
}

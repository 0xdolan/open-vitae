import { useMemo } from 'react';
import { create } from 'zustand';

import {
  DEFAULT_UI_LOCALE,
  detectUiLocale,
  isUiLocale,
  localeDirection,
  type UiLocale,
} from './locales';
import { ar } from './messages/ar';
import { ckb } from './messages/ckb';
import { en, type MessageKey } from './messages/en';
import { fa } from './messages/fa';
import {
  createTranslator,
  numberFormat,
  type Params,
  type Translations,
  type Translator,
} from './translate';

export { UI_LOCALES, type UiLocale } from './locales';
export type { MessageKey } from './messages/en';

export const TRANSLATIONS: Readonly<Record<UiLocale, Translations<MessageKey>>> = {
  en: {},
  fa,
  ar,
  ckb,
};

const STORAGE_KEY = 'open-vitae:ui-locale';

function initialLocale(): UiLocale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && isUiLocale(saved)) return saved;
  } catch {
    // Storage can be unavailable (private mode); fall back to the browser languages.
  }
  return typeof navigator === 'undefined'
    ? DEFAULT_UI_LOCALE
    : detectUiLocale(navigator.languages ?? [navigator.language]);
}

/** Point the page at the interface language, so screen readers and the browser use it. */
export function applyDocumentLocale(locale: UiLocale): void {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = locale;
  document.documentElement.dir = localeDirection(locale);
}

interface LocaleState {
  readonly locale: UiLocale;
  setLocale(locale: UiLocale): void;
}

export const useLocaleStore = create<LocaleState>()((set) => ({
  locale: initialLocale(),
  setLocale(locale) {
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      // Not saved; the choice still applies until the page is closed.
    }
    applyDocumentLocale(locale);
    set({ locale });
  },
}));

export function translatorFor(locale: UiLocale): Translator<MessageKey> {
  return createTranslator(locale, en, TRANSLATIONS[locale]);
}

/** The translator for the current interface language. Components re-render when it changes. */
export function useT(): Translator<MessageKey> & {
  readonly locale: UiLocale;
  readonly num: (value: number) => string;
} {
  const locale = useLocaleStore((s) => s.locale);
  return useMemo(() => {
    const format = numberFormat(locale);
    return Object.assign(translatorFor(locale), {
      locale,
      num: (value: number) => format.format(value),
    });
  }, [locale]);
}

/** Translate outside React (store messages, toasts after async work). */
export function t(key: MessageKey, params?: Params): string {
  return translatorFor(useLocaleStore.getState().locale)(key, params);
}

/** A validation message key shown in the interface language, or nothing. */
export function errorText(
  translate: Translator<MessageKey>,
  key: MessageKey | null,
): string | null {
  return key ? translate(key) : null;
}

import { describe, expect, it } from 'vitest';

import { TRANSLATIONS } from './index';
import { detectUiLocale, UI_LOCALES } from './locales';
import { en, type MessageKey } from './messages/en';
import { createTranslator, placeholders } from './translate';

describe('translator', () => {
  it('fills placeholders and falls back to English', () => {
    const t = createTranslator('fa', en, { 'library.edited': 'ویرایش {when}' });
    expect(t('library.edited', { when: 'دیروز' })).toBe('ویرایش دیروز');
    expect(t('library.open')).toBe('Open');
    expect(t('library.deleteNamed')).toBe('Delete {name}');
  });

  it('chooses plural forms with each language’s rules and local digits', () => {
    const english = createTranslator('en', en, {});
    expect(english('pages.count', { count: 1 })).toBe('1 page');
    expect(english('pages.count', { count: 3 })).toBe('3 pages');

    const arabic = createTranslator('ar', en, {
      'pages.count': {
        zero: 'لا صفحات',
        one: 'صفحة واحدة',
        two: 'صفحتان',
        few: '{count} صفحات',
        many: '{count} صفحة',
        other: '{count} صفحة',
      },
    });
    expect(arabic('pages.count', { count: 2 })).toBe('صفحتان');
    expect(arabic('pages.count', { count: 3 })).toMatch(/صفحات$/);

    const persian = createTranslator('fa', en, { 'pages.count': { other: '{count} صفحه' } });
    expect(persian('pages.count', { count: 12 })).toBe('۱۲ صفحه');
  });

  it('detects the interface language from the browser', () => {
    expect(detectUiLocale(['fa-IR', 'en'])).toBe('fa');
    expect(detectUiLocale(['ckb-IQ'])).toBe('ckb');
    expect(detectUiLocale(['de-DE', 'ar-EG'])).toBe('ar');
    expect(detectUiLocale(['ku'])).toBe('en');
    expect(detectUiLocale([])).toBe('en');
  });
});

describe('translations', () => {
  const keys = Object.keys(en) as MessageKey[];

  for (const { tag } of UI_LOCALES.filter((l) => l.tag !== 'en')) {
    const catalog = TRANSLATIONS[tag];

    it(`${tag}: translates every message`, () => {
      const missing = keys.filter((key) => catalog[key] === undefined);
      expect(missing).toEqual([]);
    });

    it(`${tag}: has no unknown keys and keeps every placeholder`, () => {
      for (const [key, message] of Object.entries(catalog)) {
        expect(keys).toContain(key);
        const source = en[key as MessageKey];
        expect([key, placeholders(message)]).toEqual([key, placeholders(source)]);
        if (typeof source !== 'string') expect([key, typeof message]).toEqual([key, 'object']);
      }
    });

    it(`${tag}: does not leave English text untranslated`, () => {
      // Brand and format names stay as they are.
      const allowed = new Set(['app.name', 'export.run']);
      const same = keys.filter(
        (key) => !allowed.has(key) && typeof en[key] === 'string' && catalog[key] === en[key],
      );
      expect(same).toEqual([]);
    });
  }
});

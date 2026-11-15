import { describe, expect, it } from 'vitest';

import {
  formatRange,
  formatYearMonth,
  KURDISH_SOLAR_MONTHS,
  monthNames,
  presentWord,
  toCalendar,
  yearChoices,
} from './calendars';
import { formatDateTime, formatRelative, formatTime } from './datetime';
import { applyDigits, defaultDigits, htmlToDigits, toDigits } from './digits';
import { createResumeFromSample } from '@/samples';

describe('digits', () => {
  it('converts between digit sets', () => {
    expect(toDigits('2024 – 2026', 'arab')).toBe('٢٠٢٤ – ٢٠٢٦');
    expect(toDigits('٢٠٢٤', 'arabext')).toBe('۲۰۲۴');
    expect(toDigits('۱۴۰۳', 'latn')).toBe('1403');
    expect(defaultDigits('fa-IR')).toBe('arabext');
    expect(defaultDigits('ckb')).toBe('arab');
    expect(defaultDigits('en')).toBe('latn');
  });

  it('leaves tags, character references, links and code alone in HTML', () => {
    const html =
      '<p data-x="1">Cut 40% in 2023&#160;<a href="https://a.io/2">v2</a> <code>h1</code></p>';
    expect(htmlToDigits(html, 'arab')).toBe(
      '<p data-x="1">Cut ٤٠% in ٢٠٢٣&#160;<a href="https://a.io/2">v2</a> <code>h1</code></p>',
    );
  });

  it('changes the drawn resume but never email, phone or links', () => {
    const doc = createResumeFromSample('kurdish');
    const changed = applyDigits({ ...doc, layout: { ...doc.layout, digits: 'latn' } });
    expect(changed.profile.phone).toBe(doc.profile.phone);
    expect(changed.profile.email).toBe(doc.profile.email);
    expect(changed.profile.links).toBe(doc.profile.links);
    const dates = changed.sections.flatMap((s) => s.items.map((i) => i.dateRange)).join(' ');
    expect(dates).not.toMatch(/[٠-٩۰-۹]/);
    expect(applyDigits(doc)).toBe(doc);
  });
});

describe('calendars', () => {
  // 21 March 2025, Newroz: 1 Farvardin 1404, so 1 Xakelêwe 2725.
  const newroz = new Date(2025, 2, 21, 12);

  it('converts dates', () => {
    expect(toCalendar(newroz, 'gregorian')).toEqual({ year: 2025, month: 3, day: 21 });
    expect(toCalendar(newroz, 'persian')).toEqual({ year: 1404, month: 1, day: 1 });
    expect(toCalendar(newroz, 'kurdish')).toEqual({ year: 2725, month: 1, day: 1 });
    expect(toCalendar(newroz, 'islamic').year).toBe(1446);
  });

  it('names months', () => {
    expect(monthNames('kurdish', 'en')).toBe(KURDISH_SOLAR_MONTHS);
    expect(monthNames('gregorian', 'en')[2]).toBe('March');
    expect(monthNames('gregorian', 'ckb')[0]).toBe('کانوونی دووەم');
    expect(monthNames('persian', 'fa')[0]).toBe('فروردین');
    expect(monthNames('persian', 'ckb')[1]).toBe('گوڵان');
    expect(monthNames('islamic', 'ar')[8]).toBe('رمضان');
    for (const calendar of ['gregorian', 'persian', 'islamic'] as const) {
      expect(monthNames(calendar, 'en').every((name) => name.length > 0)).toBe(true);
    }
  });

  it('writes ranges in the resume’s language and digits', () => {
    expect(
      formatRange({ year: 2021, month: 3 }, 'present', { calendar: 'gregorian', language: 'en' }),
    ).toBe('March 2021 – Present');
    expect(
      formatRange(
        { year: 2720, month: 2 },
        { year: 2725 },
        { calendar: 'kurdish', language: 'ckb' },
      ),
    ).toBe('گوڵان ٢٧٢٠ – ٢٧٢٥');
    expect(formatRange({ year: 1398 }, 'present', { calendar: 'persian', language: 'fa' })).toBe(
      '۱۳۹۸ – اکنون',
    );
    expect(
      formatYearMonth(
        { year: 2020, month: 9 },
        { calendar: 'gregorian', language: 'ckb', digits: 'latn' },
      ),
    ).toBe('ئەیلوول 2020');
    expect(formatRange({ year: 2019 }, null, { calendar: 'gregorian', language: 'en' })).toBe(
      '2019',
    );
    expect(presentWord('ar-IQ')).toBe('حتى الآن');
  });

  it('offers recent years, newest first', () => {
    const years = yearChoices('kurdish', newroz);
    expect(years[0]).toBe(2730);
    expect(years).toContain(2725);
    expect(years.length).toBe(76);
  });
});

describe('Sorani dates', () => {
  it('formats with Kurdish names and Arabic-Indic digits when the browser has no Sorani data', () => {
    const when = new Date(2026, 10, 15, 9, 3, 1);
    // Node ships Sorani data; Chrome does not. Pretend to be Chrome.
    const original = Intl.DateTimeFormat.supportedLocalesOf;
    Intl.DateTimeFormat.supportedLocalesOf = (locales) =>
      original(locales).filter((tag) => !tag.startsWith('ckb'));
    try {
      expect(formatTime(when, 'ckb')).toBe('٩:٠٣:٠١');
      expect(formatDateTime(when, 'ckb')).toBe('یەکشەممە، ١٥ی تشرینی دووەمی ٢٠٢٦، ٩:٠٣:٠١');
      expect(formatRelative(new Date(when.getTime() - 180_000), when, 'ckb')).toBe(
        '٣ خولەک لەمەوبەر',
      );
      expect(formatRelative(new Date(when.getTime() + 2 * 86_400_000), when, 'ckb')).toBe(
        'دوای ٢ ڕۆژ',
      );
      expect(formatRelative(when, when, 'ckb')).toBe('ئێستا');
    } finally {
      Intl.DateTimeFormat.supportedLocalesOf = original;
    }
  });
});

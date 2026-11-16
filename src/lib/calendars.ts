import { defaultDigits, toDigits, type DigitSystem } from './digits';

/**
 * Calendars for writing dates in a resume. Gregorian, Persian (Solar Hijri)
 * and Islamic (Umm al-Qura) come from the browser's Intl support. The Kurdish
 * calendar uses the Solar Hijri months with their Kurdish names, and its year
 * is the Solar Hijri year plus 1321 (Newroz 2025 began the year 2725).
 */
export const CALENDAR_IDS = ['gregorian', 'persian', 'islamic', 'kurdish'] as const;
export type CalendarId = (typeof CALENDAR_IDS)[number];

export function isCalendarId(value: string): value is CalendarId {
  return (CALENDAR_IDS as readonly string[]).includes(value);
}

export const KURDISH_YEAR_OFFSET = 1321;

/** Kurdish (Sorani) names of the solar months, from Newroz. */
export const KURDISH_SOLAR_MONTHS = [
  'خاکەلێوە',
  'گوڵان',
  'جۆزەردان',
  'پووشپەڕ',
  'گەلاوێژ',
  'خەرمانان',
  'ڕەزبەر',
  'گەڵاڕێزان',
  'سەرماوەز',
  'بەفرانبار',
  'ڕێبەندان',
  'ڕەشەمە',
] as const;

/** Sorani names of the Gregorian months, as used in the Kurdistan Region. */
export const KURDISH_GREGORIAN_MONTHS = [
  'کانوونی دووەم',
  'شوبات',
  'ئازار',
  'نیسان',
  'ئایار',
  'حوزەیران',
  'تەممووز',
  'ئاب',
  'ئەیلوول',
  'تشرینی یەکەم',
  'تشرینی دووەم',
  'کانوونی یەکەم',
] as const;

/** Sorani spelling of the Islamic months. */
export const KURDISH_ISLAMIC_MONTHS = [
  'موحەڕڕەم',
  'سەفەر',
  'ڕەبیعولئەووەل',
  'ڕەبیعولئاخیر',
  'جومادەلئوولا',
  'جومادەلئاخیرە',
  'ڕەجەب',
  'شەعبان',
  'ڕەمەزان',
  'شەووال',
  'زولقەعدە',
  'زولحیججە',
] as const;

/** Sorani weekday names, Sunday first. */
export const KURDISH_WEEKDAYS = [
  'یەکشەممە',
  'دووشەممە',
  'سێشەممە',
  'چوارشەممە',
  'پێنجشەممە',
  'هەینی',
  'شەممە',
] as const;

/** The word for an ongoing end date, in the resume's language. */
const PRESENT: Readonly<Record<string, string>> = {
  en: 'Present',
  fa: 'اکنون',
  ar: 'حتى الآن',
  ckb: 'ئێستا',
};

export function presentWord(language: string): string {
  return PRESENT[baseLanguage(language)] ?? 'Present';
}

function baseLanguage(language: string): string {
  return language.toLowerCase().split('-')[0] ?? 'en';
}

function intlCalendar(calendar: Exclude<CalendarId, 'kurdish'>): string {
  if (calendar === 'islamic') return 'islamic-umalqura';
  return calendar === 'gregorian' ? 'gregory' : calendar;
}

/** Whether this browser can format dates in the language itself (Chrome has no Sorani data, for example). */
export function intlSupports(language: string): boolean {
  try {
    return Intl.DateTimeFormat.supportedLocalesOf([language]).length > 0;
  } catch {
    return false;
  }
}

export interface CalendarDate {
  readonly year: number;
  /** 1 to 12. */
  readonly month: number;
  readonly day: number;
}

/** A moment as year, month and day in a calendar, in the local time zone. */
export function toCalendar(date: Date, calendar: CalendarId): CalendarDate {
  const base = calendar === 'kurdish' ? 'persian' : calendar;
  const parts = new Intl.DateTimeFormat(`en-u-ca-${intlCalendar(base)}-nu-latn`, {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? NaN);
  const year = get('year');
  return {
    year: calendar === 'kurdish' ? year + KURDISH_YEAR_OFFSET : year,
    month: get('month'),
    day: get('day'),
  };
}

const monthCache = new Map<string, readonly string[]>();

/**
 * The twelve month names of a calendar in a language. Kurdish names are
 * built in; other languages come from Intl, falling back to English.
 */
export function monthNames(calendar: CalendarId, language: string): readonly string[] {
  const lang = baseLanguage(language);
  if (calendar === 'kurdish') return KURDISH_SOLAR_MONTHS;
  if (lang === 'ckb') {
    if (calendar === 'persian') return KURDISH_SOLAR_MONTHS;
    if (calendar === 'islamic') return KURDISH_ISLAMIC_MONTHS;
    return KURDISH_GREGORIAN_MONTHS;
  }
  const key = `${calendar}:${lang}`;
  const cached = monthCache.get(key);
  if (cached) return cached;

  const locale = intlSupports(lang) ? lang : 'en';
  const nameFormat = new Intl.DateTimeFormat(`${locale}-u-ca-${intlCalendar(calendar)}`, {
    month: 'long',
  });
  const names: string[] = new Array<string>(12).fill('');
  // Walk a little over a year of days and keep the first name seen for each month.
  const day = new Date(2024, 0, 1, 12);
  for (let i = 0; i < 400 && names.some((n) => n === ''); i += 1) {
    const { month } = toCalendar(day, calendar);
    if (names[month - 1] === '') names[month - 1] = nameFormat.format(day);
    day.setDate(day.getDate() + 1);
  }
  monthCache.set(key, names);
  return names;
}

export interface YearMonth {
  readonly year: number;
  /** 1 to 12; absent for a year only. */
  readonly month?: number;
}

export interface RangeOptions {
  readonly calendar: CalendarId;
  readonly language: string;
  /** Defaults to the language's usual digits. */
  readonly digits?: DigitSystem;
}

/** Month name, a space, then the year: "March 2021", "گوڵان ٢٧٢٥"; the year alone without a month. */
export function formatYearMonth(value: YearMonth, options: RangeOptions): string {
  const digits = options.digits ?? defaultDigits(options.language);
  const year = toDigits(String(value.year), digits);
  if (!value.month) return year;
  const name = monthNames(options.calendar, options.language)[value.month - 1] ?? '';
  return `${name} ${year}`;
}

/**
 * A date range for the Dates field: "March 2021 – Present",
 * "گوڵان ٢٧٢٠ – ئێستا". A missing end gives the start alone.
 */
export function formatRange(
  start: YearMonth,
  end: YearMonth | 'present' | null,
  options: RangeOptions,
): string {
  const from = formatYearMonth(start, options);
  if (end === null) return from;
  const to = end === 'present' ? presentWord(options.language) : formatYearMonth(end, options);
  return `${from} – ${to}`;
}

/** Years offered in the date helper: the last 70 years up to 5 ahead, newest first. */
export function yearChoices(calendar: CalendarId, now: Date = new Date()): number[] {
  const current = toCalendar(now, calendar).year;
  return Array.from({ length: 76 }, (_, i) => current + 5 - i);
}

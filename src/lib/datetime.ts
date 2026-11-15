/**
 * Human-readable dates for versions and exports. Uses the browser's language
 * and time zone, so people see times the way they write them.
 */

import { intlSupports, KURDISH_GREGORIAN_MONTHS, KURDISH_WEEKDAYS } from './calendars';
import { toDigits } from './digits';

/**
 * Sorani is formatted here when the browser has no data for it (Chrome, for
 * example, would fall back to English): Kurdish month and weekday names,
 * Arabic-Indic digits and a 24-hour clock.
 */
function needsKurdishFallback(locale: string | undefined): boolean {
  return (
    locale !== undefined && locale.toLowerCase().split('-')[0] === 'ckb' && !intlSupports(locale)
  );
}

const two = (n: number) => String(n).padStart(2, '0');

function kurdishTime(date: Date): string {
  return toDigits(`${date.getHours()}:${two(date.getMinutes())}:${two(date.getSeconds())}`, 'arab');
}

/** "Saturday, 14 November 2026 at 19:05:23" (wording follows the locale). */
export function formatDateTime(value: string | Date, locale?: string): string {
  const date = new Date(value);
  if (needsKurdishFallback(locale)) {
    const day = toDigits(`${date.getDate()}`, 'arab');
    const year = toDigits(`${date.getFullYear()}`, 'arab');
    return `${KURDISH_WEEKDAYS[date.getDay()]}، ${day}ی ${KURDISH_GREGORIAN_MONTHS[date.getMonth()]}ی ${year}، ${kurdishTime(date)}`;
  }
  return new Intl.DateTimeFormat(locale, { dateStyle: 'full', timeStyle: 'medium' }).format(date);
}

/** "19:05:23" or "7:05:23 PM" depending on the locale. */
export function formatTime(value: string | Date, locale?: string): string {
  if (needsKurdishFallback(locale)) return kurdishTime(new Date(value));
  return new Intl.DateTimeFormat(locale, { timeStyle: 'medium' }).format(new Date(value));
}

const UNITS: readonly [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['week', 7 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
  ['second', 1],
];

const KURDISH_UNITS: Readonly<Partial<Record<Intl.RelativeTimeFormatUnit, string>>> = {
  year: 'ساڵ',
  month: 'مانگ',
  week: 'هەفتە',
  day: 'ڕۆژ',
  hour: 'کاتژمێر',
  minute: 'خولەک',
  second: 'چرکە',
};

function kurdishRelative(amount: number, unit: Intl.RelativeTimeFormatUnit): string {
  if (amount === 0) return 'ئێستا';
  const span = `${toDigits(String(Math.abs(amount)), 'arab')} ${KURDISH_UNITS[unit] ?? ''}`;
  return amount < 0 ? `${span} لەمەوبەر` : `دوای ${span}`;
}

/** "2 minutes ago", "yesterday", "in 3 days". */
export function formatRelative(
  value: string | Date,
  now: Date = new Date(),
  locale?: string,
): string {
  const seconds = Math.round((new Date(value).getTime() - now.getTime()) / 1000);
  const kurdish = needsKurdishFallback(locale);
  const format = (amount: number, unit: Intl.RelativeTimeFormatUnit) =>
    kurdish
      ? kurdishRelative(amount, unit)
      : new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(amount, unit);
  if (Math.abs(seconds) < 10) return format(0, 'second');
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) {
      return format(Math.round(seconds / size), unit);
    }
  }
  return format(seconds, 'second');
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Local time, safe in file names on every operating system: 2026-11-14_19-05-23. */
export function fileTimestamp(date: Date): string {
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `_${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`
  );
}

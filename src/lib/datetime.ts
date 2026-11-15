/**
 * Human-readable dates for versions and exports. Uses the browser's language
 * and time zone, so people see times the way they write them.
 */

/** "Saturday, 14 November 2026 at 19:05:23" (wording follows the locale). */
export function formatDateTime(value: string | Date, locale?: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'full', timeStyle: 'medium' }).format(
    new Date(value),
  );
}

/** "19:05:23" or "7:05:23 PM" depending on the locale. */
export function formatTime(value: string | Date, locale?: string): string {
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

/** "just now", "3 minutes ago", "yesterday"... */
export function formatRelative(value: string | Date, now: Date = new Date(), locale?: string): string {
  const seconds = Math.round((new Date(value).getTime() - now.getTime()) / 1000);
  const format = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  if (Math.abs(seconds) < 10) return format.format(0, 'second');
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) {
      return format.format(Math.round(seconds / size), unit);
    }
  }
  return format.format(seconds, 'second');
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Local time, safe in file names on every operating system: 2026-11-14_19-05-23. */
export function fileTimestamp(date: Date): string {
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `_${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`
  );
}

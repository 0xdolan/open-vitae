import { isSafeUrl } from '@/lib/url';

/**
 * Field checks shown in the editor as the person types. They never block
 * saving: the stored data stays safe because links are only created from
 * values that pass isSafeUrl when the resume is drawn.
 */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const MESSAGES = {
  email: 'Enter a valid email address, such as name@example.com',
  url: 'Use a full address starting with https:// (or mailto: or tel:)',
} as const;

export function isValidEmail(value: string): boolean {
  return EMAIL.test(value);
}

export function emailError(value: string): string | null {
  return value === '' || isValidEmail(value) ? null : MESSAGES.email;
}

export function urlError(value: string): string | null {
  return value === '' || isSafeUrl(value) ? null : MESSAGES.url;
}

import type { MessageKey } from '@/i18n/messages/en';
import { isSafeUrl } from '@/lib/url';

/**
 * Field checks shown in the editor as the person types. They never block
 * saving: the stored data stays safe because links are only created from
 * values that pass isSafeUrl when the resume is drawn. They return a message
 * key, so the editor shows the message in the interface language.
 */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const MESSAGES = {
  email: 'validation.email',
  url: 'validation.url',
} as const satisfies Record<string, MessageKey>;

export function isValidEmail(value: string): boolean {
  return EMAIL.test(value);
}

export function emailError(value: string): MessageKey | null {
  return value === '' || isValidEmail(value) ? null : MESSAGES.email;
}

export function urlError(value: string): MessageKey | null {
  return value === '' || isSafeUrl(value) ? null : MESSAGES.url;
}

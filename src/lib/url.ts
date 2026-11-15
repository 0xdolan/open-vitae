const ALLOWED_PROTOCOLS: ReadonlySet<string> = new Set(['http:', 'https:', 'mailto:', 'tel:']);

/**
 * True only for absolute http, https, mailto and tel URLs.
 * Rejects javascript:, data:, relative paths and values with surrounding spaces.
 */
export function isSafeUrl(value: string): boolean {
  if (value === '' || value.trim() !== value) {
    return false;
  }
  try {
    return ALLOWED_PROTOCOLS.has(new URL(value).protocol);
  } catch {
    return false;
  }
}

/** Build a tel: URL from a human-written phone number. */
export function telUrl(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}

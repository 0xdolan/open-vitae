const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_-';

/**
 * Random URL-safe id (21 characters, about 126 bits).
 * Uses crypto.getRandomValues, which unlike crypto.randomUUID also works on
 * plain-http origins such as a LAN address.
 */
export function createId(size = 21): string {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  let id = '';
  for (const byte of bytes) {
    // 64 characters, so the low 6 bits map evenly with no bias.
    id += ALPHABET[byte & 63];
  }
  return id;
}

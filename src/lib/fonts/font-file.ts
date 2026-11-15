/** Largest font file accepted, in bytes. Big CJK fonts reach ~20 MB. */
export const MAX_FONT_BYTES = 25 * 1024 * 1024;

export type FontFormat = 'woff2' | 'woff' | 'truetype' | 'opentype';

/** Identify a font file by its first four bytes, never by its name. */
export function detectFontFormat(bytes: Uint8Array): FontFormat | null {
  if (bytes.length < 4) return null;
  const tag = String.fromCharCode(bytes[0] ?? 0, bytes[1] ?? 0, bytes[2] ?? 0, bytes[3] ?? 0);
  if (tag === 'wOF2') return 'woff2';
  if (tag === 'wOFF') return 'woff';
  if (tag === 'OTTO') return 'opentype';
  if (tag === 'true' || (bytes[0] === 0 && bytes[1] === 1 && bytes[2] === 0 && bytes[3] === 0)) return 'truetype';
  return null;
}

/** Same character rule as the resume schema, so the name can be stored and used in CSS. */
const DISALLOWED = /[^\p{L}\p{N} ._-]+/gu;

/**
 * A readable family name from a file name:
 * "Sahel-Bold.woff2" -> "Sahel Bold", "my_font (1).ttf" -> "my font 1".
 */
export function familyFromFileName(fileName: string): string {
  const name = fileName
    .replace(/\.(woff2?|ttf|otf)$/i, '')
    .replace(/[_-]+/g, ' ')
    .replace(DISALLOWED, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60)
    .trim();
  return name || 'Custom font';
}

/** Clean a name the person typed for a font. Returns null if nothing usable is left. */
export function cleanFamilyName(name: string): string | null {
  const cleaned = name.replace(DISALLOWED, ' ').replace(/\s+/g, ' ').trim().slice(0, 60).trim();
  return cleaned === '' ? null : cleaned;
}

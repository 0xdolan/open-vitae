import { detectFontFormat } from '@/lib/fonts/font-file';
import type { FontFaceSource } from '@/lib/fonts/registrar';
import { fontsUsedBy } from '@/lib/fonts/usage';
import type { ResumeDocument } from '@/schema/resume';

/**
 * @font-face rules with the font files inlined, for the fonts a resume uses
 * that were added with the FontFace API (fonts loaded from files and the
 * bundled Persian and Arabic fonts). Image and PDF exports draw the page as
 * an SVG picture, which cannot see those fonts unless they are inlined like this.
 * Fonts declared in stylesheets (Manrope, Google Fonts) are inlined by
 * html-to-image itself.
 */

const MIME: Readonly<Record<string, string>> = {
  woff2: 'font/woff2',
  woff: 'font/woff',
  truetype: 'font/ttf',
  opentype: 'font/otf',
};

export function toBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

/** The URL inside a `url(...) format(...)` source string. */
function urlOf(source: string): string | null {
  return /url\(\s*["']?([^"')]+)["']?\s*\)/.exec(source)?.[1] ?? null;
}

const cssString = (value: string) => `"${value.replace(/["\\]/g, '\\$&')}"`;

export async function fontEmbedCss(
  doc: ResumeDocument,
  sources: readonly FontFaceSource[],
  fetchFn: typeof fetch = fetch,
): Promise<string> {
  const used = new Set(fontsUsedBy(doc).map((family) => family.toLowerCase()));
  const rules: string[] = [];
  for (const source of sources) {
    if (!used.has(source.family.toLowerCase())) continue;
    let bytes: Uint8Array | null = null;
    if (source.data instanceof ArrayBuffer) {
      bytes = new Uint8Array(source.data);
    } else {
      const url = urlOf(source.data);
      if (!url) continue;
      try {
        const response = await fetchFn(url);
        if (response.ok) bytes = new Uint8Array(await response.arrayBuffer());
      } catch {
        bytes = null;
      }
    }
    if (!bytes) continue;
    const format = detectFontFormat(bytes.subarray(0, 4));
    if (!format) continue;
    rules.push(
      `@font-face{font-family:${cssString(source.family)};src:url(data:${MIME[format]};base64,${toBase64(bytes)});` +
        `font-weight:${source.weight ?? '400'};font-style:${source.style ?? 'normal'};}`,
    );
  }
  return rules.join('\n');
}

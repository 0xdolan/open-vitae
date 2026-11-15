/**
 * Google Fonts, loaded only after the person agrees. The stylesheet is
 * fetched, checked and then added, so nothing but @font-face rules pointing at
 * fonts.gstatic.com can enter the page.
 */

const CSS_HOST = 'https://fonts.googleapis.com/css2';

/** Variants to try, richest first. Google answers 400 when a family lacks a requested style. */
const VARIANTS = [':ital,wght@0,400;0,700;1,400;1,700', ':wght@400;700', ''] as const;

export function googleFontCssUrls(family: string): string[] {
  const name = family.trim().replace(/\s+/g, '+');
  return VARIANTS.map((variant) => `${CSS_HOST}?family=${encodeURIComponent(name).replace(/%2B/g, '+')}${variant}&display=swap`);
}

const ALLOWED_DESCRIPTORS = new Set(['font-family', 'font-style', 'font-weight', 'font-stretch', 'font-display', 'src', 'unicode-range']);

/**
 * True only for a stylesheet made of @font-face blocks whose descriptors are
 * known and whose every url() points at fonts.gstatic.com over https.
 */
export function isSafeGoogleFontCss(css: string): boolean {
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
  if (/@import|expression\s*\(|javascript:|<\/?style/i.test(withoutComments)) return false;

  const blocks = [...withoutComments.matchAll(/@font-face\s*\{([^{}]*)\}/g)];
  if (blocks.length === 0) return false;
  if (withoutComments.replace(/@font-face\s*\{[^{}]*\}/g, '').trim() !== '') return false;

  for (const [, body = ''] of blocks) {
    for (const declaration of body.split(';')) {
      const colon = declaration.indexOf(':');
      if (colon === -1) {
        if (declaration.trim() !== '') return false;
        continue;
      }
      const property = declaration.slice(0, colon).trim().toLowerCase();
      if (!ALLOWED_DESCRIPTORS.has(property)) return false;
    }
    for (const [, url = ''] of body.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)) {
      if (!url.startsWith('https://fonts.gstatic.com/')) return false;
    }
  }
  return true;
}

export class GoogleFontError extends Error {
  override readonly name = 'GoogleFontError';
}

/** Fetch the stylesheet for a family, trying simpler variants if Google rejects one. */
export async function fetchGoogleFontCss(family: string, fetchFn: typeof fetch = fetch): Promise<string> {
  let notFound = false;
  for (const url of googleFontCssUrls(family)) {
    let response: Response;
    try {
      response = await fetchFn(url, { credentials: 'omit', referrerPolicy: 'no-referrer' });
    } catch {
      throw new GoogleFontError('Google Fonts could not be reached. Check your connection.');
    }
    if (response.ok) {
      const css = await response.text();
      if (!isSafeGoogleFontCss(css)) throw new GoogleFontError('Google Fonts sent an unexpected response, so it was not used.');
      return css;
    }
    notFound = response.status === 400 || response.status === 404;
  }
  throw new GoogleFontError(notFound ? `“${family}” is not a Google font. Check the exact name on fonts.google.com.` : 'Google Fonts did not respond.');
}

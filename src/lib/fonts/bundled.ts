import type { FontRegistrar } from './registrar';

/**
 * Bundled fonts (Sahel, Estedad) live in public/fonts with a manifest written
 * by `npm run fonts:fetch`. Manrope comes from an npm package and needs no
 * manifest. If the manifest is missing, the app simply uses fallback fonts.
 */
export interface BundledFontFile {
  readonly file: string;
  readonly weight: string;
  readonly style?: string;
}

export interface BundledFontManifest {
  readonly fonts: readonly { readonly family: string; readonly license: string; readonly files: readonly BundledFontFile[] }[];
}

function isManifest(value: unknown): value is BundledFontManifest {
  if (typeof value !== 'object' || value === null || !Array.isArray((value as BundledFontManifest).fonts)) return false;
  return (value as BundledFontManifest).fonts.every(
    (font) =>
      typeof font.family === 'string' &&
      /^[\p{L}\p{N} ._-]{1,60}$/u.test(font.family) &&
      Array.isArray(font.files) &&
      font.files.every((f) => typeof f.file === 'string' && /^[\w./-]+\.woff2$/.test(f.file) && !f.file.includes('..') && /^\d{3}( \d{3})?$/.test(f.weight)),
  );
}

/** Register the bundled fonts. Returns the families that loaded. */
export async function loadBundledFonts(
  baseUrl: string,
  registrar: FontRegistrar,
  fetchFn: typeof fetch = fetch,
): Promise<string[]> {
  let manifest: unknown;
  try {
    const response = await fetchFn(`${baseUrl}fonts/manifest.json`);
    if (!response.ok) return [];
    manifest = await response.json();
  } catch {
    return [];
  }
  if (!isManifest(manifest)) return [];

  const loaded: string[] = [];
  for (const font of manifest.fonts) {
    const results = await Promise.allSettled(
      font.files.map((file) =>
        registrar.addFace({
          family: font.family,
          data: `url(${baseUrl}fonts/${file.file}) format("woff2")`,
          weight: file.weight,
          style: file.style ?? 'normal',
        }),
      ),
    );
    if (results.some((r) => r.status === 'fulfilled')) loaded.push(font.family);
  }
  return loaded;
}

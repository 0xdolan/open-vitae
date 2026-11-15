import { describe, expect, it } from 'vitest';

import { fontStack } from '@/config/fonts';
import { createBlankResume } from '@/lib/resume-factory';
import { createMemoryStore } from '@/lib/storage/key-value';
import { createFontStore, createMemoryFontPreferences } from '@/stores/font-store';

import { loadBundledFonts } from './bundled';
import { cleanFamilyName, detectFontFormat, familyFromFileName } from './font-file';
import { fetchGoogleFontCss, googleFontCssUrls, isSafeGoogleFontCss } from './google';
import { createMemoryRegistrar } from './registrar';
import { fontsUsedBy } from './usage';

const bytes = (...values: number[]) => new Uint8Array(values);
const ascii = (text: string) => new Uint8Array([...text].map((c) => c.charCodeAt(0)));
const fontFile = (name: string, magic: Uint8Array<ArrayBuffer>) =>
  new File([magic, new Uint8Array(64)], name);

const GOOD_CSS = `/* latin */
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/inter/v13/abc.woff2) format('woff2');
  unicode-range: U+0000-00FF;
}`;

function response(status: number, body = ''): Response {
  return new Response(body, { status });
}

describe('font files', () => {
  it('recognises formats by their first bytes', () => {
    expect(detectFontFormat(ascii('wOF2'))).toBe('woff2');
    expect(detectFontFormat(ascii('wOFF'))).toBe('woff');
    expect(detectFontFormat(ascii('OTTO'))).toBe('opentype');
    expect(detectFontFormat(bytes(0, 1, 0, 0))).toBe('truetype');
    expect(detectFontFormat(ascii('true'))).toBe('truetype');
    expect(detectFontFormat(ascii('%PDF'))).toBeNull();
    expect(detectFontFormat(bytes(1, 2))).toBeNull();
  });

  it('makes safe family names', () => {
    expect(familyFromFileName('Sahel-Bold.woff2')).toBe('Sahel Bold');
    expect(familyFromFileName('my_font (1).ttf')).toBe('my font 1');
    expect(familyFromFileName('وزیر.ttf')).toBe('وزیر');
    expect(familyFromFileName('";}.otf')).toBe('Custom font');
    expect(cleanFamilyName('  Brand  "Sans"; ')).toBe('Brand Sans');
    expect(cleanFamilyName('";{}')).toBeNull();
  });
});

describe('Google Fonts', () => {
  it('builds stylesheet addresses from rich to plain', () => {
    const urls = googleFontCssUrls('Noto Sans Arabic');
    expect(urls[0]).toBe(
      'https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:ital,wght@0,400;0,700;1,400;1,700&display=swap',
    );
    expect(urls.at(-1)).toBe(
      'https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic&display=swap',
    );
  });

  it('accepts only @font-face rules served from fonts.gstatic.com', () => {
    expect(isSafeGoogleFontCss(GOOD_CSS)).toBe(true);
    expect(isSafeGoogleFontCss(GOOD_CSS.replace('fonts.gstatic.com', 'evil.example'))).toBe(false);
    expect(isSafeGoogleFontCss(`${GOOD_CSS} body { display: none }`)).toBe(false);
    expect(isSafeGoogleFontCss(`@import url(https://fonts.gstatic.com/x.css); ${GOOD_CSS}`)).toBe(
      false,
    );
    expect(isSafeGoogleFontCss(GOOD_CSS.replace('font-display: swap;', 'background: red;'))).toBe(
      false,
    );
    expect(isSafeGoogleFontCss('')).toBe(false);
  });

  it('falls back to simpler variants when Google rejects one', async () => {
    const asked: string[] = [];
    const fake = (async (url: string) => {
      asked.push(url);
      return asked.length < 3 ? response(400) : response(200, GOOD_CSS);
    }) as unknown as typeof fetch;
    await expect(fetchGoogleFontCss('Inter', fake)).resolves.toBe(GOOD_CSS);
    expect(asked).toHaveLength(3);
  });

  it('explains unknown families and unexpected answers', async () => {
    const notFound = (async () => response(400)) as unknown as typeof fetch;
    await expect(fetchGoogleFontCss('Not A Font', notFound)).rejects.toThrow(/not a Google font/);
    const weird = (async () => response(200, 'body{}')) as unknown as typeof fetch;
    await expect(fetchGoogleFontCss('Inter', weird)).rejects.toThrow(/unexpected/);
  });
});

describe('bundled fonts', () => {
  it('loads fonts listed in the manifest', async () => {
    const registrar = createMemoryRegistrar();
    const manifest = {
      fonts: [
        {
          family: 'Sahel',
          license: 'OFL-1.1',
          files: [{ file: 'sahel/Sahel.woff2', weight: '400' }],
        },
      ],
    };
    const fake = (async () => response(200, JSON.stringify(manifest))) as unknown as typeof fetch;
    expect(await loadBundledFonts('/open-vitae/', registrar, fake)).toEqual(['Sahel']);
    expect(registrar.families.has('Sahel')).toBe(true);
  });

  it('ignores a missing or suspicious manifest', async () => {
    const registrar = createMemoryRegistrar();
    expect(
      await loadBundledFonts('/', registrar, (async () =>
        response(404)) as unknown as typeof fetch),
    ).toEqual([]);
    const bad = {
      fonts: [
        { family: 'X', license: '', files: [{ file: '../../etc/passwd.woff2', weight: '400' }] },
      ],
    };
    expect(
      await loadBundledFonts('/', registrar, (async () =>
        response(200, JSON.stringify(bad))) as unknown as typeof fetch),
    ).toEqual([]);
  });
});

describe('fontsUsedBy', () => {
  it('lists the page font, text styles and fonts inside rich text', () => {
    const doc = createBlankResume('x');
    const withFonts = {
      ...doc,
      profile: {
        ...doc.profile,
        nameStyle: { fontFamily: 'Playfair Display' },
        summaryHtml: '<p><span style="font-family: &quot;Fira Code&quot;, monospace">x</span></p>',
      },
    };
    expect(fontsUsedBy(withFonts).sort()).toEqual(['Fira Code', 'Manrope', 'Playfair Display']);
  });
});

describe('font stack with Google fonts', () => {
  it('uses the right generic family and skips Sahel for Arabic-script fonts', () => {
    expect(fontStack('Merriweather')).toBe('"Merriweather", "Sahel", serif');
    expect(fontStack('Vazirmatn')).toBe('"Vazirmatn", system-ui, sans-serif');
  });
});

describe('font store', () => {
  function setup(fetchFn?: typeof fetch) {
    const kv = createMemoryStore();
    const registrar = createMemoryRegistrar();
    const preferences = createMemoryFontPreferences();
    const store = createFontStore({
      kv,
      registrar,
      preferences,
      fetchFn: fetchFn ?? ((async () => response(404)) as unknown as typeof fetch),
    });
    return { kv, registrar, preferences, store };
  }

  it('adds a font file, keeps it across restarts and removes it', async () => {
    const { kv, store } = setup();
    await store.getState().init();
    const font = await store.getState().addUserFont(fontFile('Brand-Sans.woff2', ascii('wOF2')));
    expect(font).toMatchObject({ family: 'Brand Sans', format: 'woff2' });

    const registrar2 = createMemoryRegistrar();
    const second = createFontStore({
      kv,
      registrar: registrar2,
      preferences: createMemoryFontPreferences(),
      fetchFn: (async () => response(404)) as unknown as typeof fetch,
    });
    await second.getState().init();
    expect(second.getState().userFonts.map((f) => f.family)).toEqual(['Brand Sans']);
    expect(registrar2.families.has('Brand Sans')).toBe(true);

    await second.getState().removeUserFont(font.id);
    expect(await kv.keys()).toEqual([]);
  });

  it('refuses files that are not fonts and avoids name clashes', async () => {
    const { store } = setup();
    await store.getState().init();
    await expect(
      store.getState().addUserFont(fontFile('evil.woff2', ascii('%PDF'))),
    ).rejects.toThrow(/not a font/);
    const a = await store.getState().addUserFont(fontFile('Arial.ttf', bytes(0, 1, 0, 0)));
    expect(a.family).toBe('Arial (2)');
  });

  it('renames a font', async () => {
    const { store, registrar } = setup();
    await store.getState().init();
    const font = await store.getState().addUserFont(fontFile('x.otf', ascii('OTTO')));
    await store.getState().renameUserFont(font.id, 'Company Serif');
    expect(store.getState().userFonts[0]?.family).toBe('Company Serif');
    expect(registrar.families.has('Company Serif')).toBe(true);
    expect(registrar.families.has('x')).toBe(false);
  });

  it('never contacts Google without consent', async () => {
    let calls = 0;
    const { store } = setup((async () => {
      calls += 1;
      return response(200, GOOD_CSS);
    }) as unknown as typeof fetch);
    await store.getState().init();
    calls = 0;
    expect(await store.getState().ensureFonts(['Inter'])).toEqual([
      { family: 'Inter', kind: 'google', availability: 'needs-consent' },
    ]);
    expect(calls).toBe(0);

    store.getState().setGoogleConsent(true);
    const [status] = await store.getState().ensureFonts(['Inter']);
    expect(status?.availability).toBe('ready');
    expect(store.getState().googleFamilies).toEqual(['Inter']);
  });

  it('reports fonts that are not on this device', async () => {
    const { store } = setup();
    await store.getState().init();
    expect(store.getState().statusOf('Font From Another Laptop')).toMatchObject({
      kind: 'user',
      availability: 'missing',
    });
    expect(store.getState().statusOf('Sahel')).toMatchObject({
      kind: 'bundled',
      availability: 'missing',
    });
    expect(store.getState().statusOf('Manrope')).toMatchObject({ availability: 'ready' });
    expect(store.getState().statusOf('Times New Roman')).toMatchObject({
      kind: 'system',
      availability: 'ready',
    });
  });
});

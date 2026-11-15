import { create } from 'zustand';

import { BUNDLED_FONTS, SYSTEM_FONTS } from '@/config/fonts';
import { findGoogleFont } from '@/config/google-fonts';
import { createId } from '@/lib/id';
import {
  cleanFamilyName,
  detectFontFormat,
  familyFromFileName,
  MAX_FONT_BYTES,
  type FontFormat,
} from '@/lib/fonts/font-file';
import { fetchGoogleFontCss, GoogleFontError } from '@/lib/fonts/google';
import { loadBundledFonts } from '@/lib/fonts/bundled';
import type { FontRegistrar } from '@/lib/fonts/registrar';
import { uniqueName } from '@/lib/resume-factory';
import type { KeyValueStore } from '@/lib/storage/key-value';

/** A font the person loaded from a file. The file itself stays in this browser. */
export interface UserFont {
  readonly id: string;
  readonly family: string;
  readonly fileName: string;
  readonly format: FontFormat;
  readonly bytes: number;
  readonly addedAt: string;
}

interface StoredUserFont extends UserFont {
  readonly data: ArrayBuffer;
}

export type FontKind = 'bundled' | 'system' | 'user' | 'google';
export type FontAvailability = 'ready' | 'loading' | 'missing' | 'needs-consent' | 'error';

export interface FontStatus {
  readonly family: string;
  readonly kind: FontKind;
  readonly availability: FontAvailability;
  readonly message?: string;
}

interface FontPreferences {
  getGoogleConsent(): boolean;
  setGoogleConsent(value: boolean): void;
  getGoogleFamilies(): string[];
  setGoogleFamilies(families: string[]): void;
}

export interface FontStoreState {
  readonly ready: boolean;
  readonly bundledLoaded: readonly string[];
  readonly userFonts: readonly UserFont[];
  /** Google families the person has used, most recent first. */
  readonly googleFamilies: readonly string[];
  readonly googleConsent: boolean;
  readonly googleState: Readonly<
    Record<string, { state: 'loading' | 'ready' | 'error'; message?: string }>
  >;

  init(): Promise<void>;
  addUserFont(file: File, name?: string): Promise<UserFont>;
  renameUserFont(id: string, name: string): Promise<void>;
  removeUserFont(id: string): Promise<void>;
  setGoogleConsent(value: boolean): void;
  loadGoogleFont(family: string): Promise<void>;
  /** Load what a resume needs and report anything that is not available. */
  ensureFonts(families: readonly string[]): Promise<FontStatus[]>;
  statusOf(family: string): FontStatus;
  /** Forget loaded user fonts after all data was deleted. */
  reset(): void;
}

export class FontFileError extends Error {
  override readonly name = 'FontFileError';
}

const USER_FONT_PREFIX = 'font:';

export interface FontStoreDeps {
  readonly kv: KeyValueStore;
  readonly registrar: FontRegistrar;
  readonly preferences: FontPreferences;
  readonly baseUrl?: string;
  readonly fetchFn?: typeof fetch;
  readonly now?: () => Date;
}

function toMeta(stored: StoredUserFont): UserFont {
  return {
    id: stored.id,
    family: stored.family,
    fileName: stored.fileName,
    format: stored.format,
    bytes: stored.bytes,
    addedAt: stored.addedAt,
  };
}

function isStoredUserFont(value: unknown): value is StoredUserFont {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Partial<StoredUserFont>;
  return (
    typeof v.id === 'string' &&
    typeof v.family === 'string' &&
    cleanFamilyName(v.family) === v.family &&
    v.data instanceof ArrayBuffer &&
    detectFontFormat(new Uint8Array(v.data.slice(0, 4))) !== null
  );
}

export function createFontStore({
  kv,
  registrar,
  preferences,
  baseUrl = '/',
  fetchFn = (...args) => fetch(...args),
  now = () => new Date(),
}: FontStoreDeps) {
  return create<FontStoreState>()((set, get) => {
    const takenNames = () => [
      ...BUNDLED_FONTS.map((f) => f.family),
      ...SYSTEM_FONTS.map((f) => f.family),
      ...get().userFonts.map((f) => f.family),
    ];

    const register = async (font: StoredUserFont) => {
      await registrar.addFace({ family: font.family, data: font.data });
    };

    const rememberGoogle = (family: string) => {
      const families = [family, ...get().googleFamilies.filter((f) => f !== family)].slice(0, 30);
      preferences.setGoogleFamilies(families);
      set({ googleFamilies: families });
    };

    return {
      ready: false,
      bundledLoaded: [],
      userFonts: [],
      googleFamilies: preferences.getGoogleFamilies(),
      googleConsent: preferences.getGoogleConsent(),
      googleState: {},

      async init() {
        if (get().ready) return;
        const bundledLoaded = await loadBundledFonts(baseUrl, registrar, fetchFn);
        const userFonts: UserFont[] = [];
        for (const key of await kv.keys()) {
          if (!key.startsWith(USER_FONT_PREFIX)) continue;
          const value = await kv.get(key);
          if (!isStoredUserFont(value)) continue;
          try {
            await register(value);
            userFonts.push(toMeta(value));
          } catch {
            // A damaged file is skipped; the person can remove and reload it.
          }
        }
        userFonts.sort((a, b) => a.family.localeCompare(b.family));
        set({ ready: true, bundledLoaded, userFonts });
      },

      async addUserFont(file, name) {
        if (file.size > MAX_FONT_BYTES)
          throw new FontFileError('This font file is larger than 25 MB.');
        const data = await file.arrayBuffer();
        const format = detectFontFormat(new Uint8Array(data.slice(0, 4)));
        if (!format)
          throw new FontFileError('This is not a font file. Use a TTF, OTF, WOFF or WOFF2 file.');

        const requested = (name && cleanFamilyName(name)) || familyFromFileName(file.name);
        const family = uniqueName(requested, takenNames());
        const stored: StoredUserFont = {
          id: createId(),
          family,
          fileName: file.name.slice(0, 200),
          format,
          bytes: data.byteLength,
          addedAt: now().toISOString(),
          data,
        };
        try {
          await register(stored);
        } catch {
          throw new FontFileError('The browser could not read this font. The file may be damaged.');
        }
        await kv.set(USER_FONT_PREFIX + stored.id, stored);
        const meta = toMeta(stored);
        set((state) => ({
          userFonts: [...state.userFonts, meta].sort((a, b) => a.family.localeCompare(b.family)),
        }));
        return meta;
      },

      async renameUserFont(id, name) {
        const cleaned = cleanFamilyName(name);
        const stored = await kv.get(USER_FONT_PREFIX + id);
        if (!cleaned || !isStoredUserFont(stored) || cleaned === stored.family) return;
        const family = uniqueName(
          cleaned,
          takenNames().filter((n) => n !== stored.family),
        );
        registrar.removeFamily(stored.family);
        const next = { ...stored, family };
        await register(next);
        await kv.set(USER_FONT_PREFIX + id, next);
        set((state) => ({
          userFonts: state.userFonts.map((f) => (f.id === id ? toMeta(next) : f)),
        }));
      },

      async removeUserFont(id) {
        const font = get().userFonts.find((f) => f.id === id);
        await kv.delete(USER_FONT_PREFIX + id);
        if (font) registrar.removeFamily(font.family);
        set((state) => ({ userFonts: state.userFonts.filter((f) => f.id !== id) }));
      },

      setGoogleConsent(value) {
        preferences.setGoogleConsent(value);
        set({ googleConsent: value });
      },

      async loadGoogleFont(family) {
        if (!get().googleConsent) throw new GoogleFontError('Allow Google Fonts first.');
        if (get().googleState[family]?.state === 'ready') return;
        set((state) => ({ googleState: { ...state.googleState, [family]: { state: 'loading' } } }));
        try {
          const css = await fetchGoogleFontCss(family, fetchFn);
          registrar.addStylesheet(`google-${family}`, css);
          set((state) => ({ googleState: { ...state.googleState, [family]: { state: 'ready' } } }));
          rememberGoogle(family);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Could not load this font.';
          set((state) => ({
            googleState: { ...state.googleState, [family]: { state: 'error', message } },
          }));
          throw error;
        }
      },

      statusOf(family) {
        const { bundledLoaded, userFonts, googleFamilies, googleConsent, googleState } = get();
        if (BUNDLED_FONTS.some((f) => f.family === family)) {
          // Manrope ships with the app code; Sahel and Estedad need `npm run fonts:fetch`.
          const ok = family === 'Manrope' || bundledLoaded.includes(family);
          return ok
            ? { family, kind: 'bundled', availability: 'ready' }
            : {
                family,
                kind: 'bundled',
                availability: 'missing',
                message: 'Bundled font files are not installed; a similar font is used.',
              };
        }
        if (SYSTEM_FONTS.some((f) => f.family === family))
          return { family, kind: 'system', availability: 'ready' };
        if (userFonts.some((f) => f.family === family))
          return { family, kind: 'user', availability: 'ready' };
        if (findGoogleFont(family) || googleFamilies.includes(family) || googleState[family]) {
          const state = googleState[family];
          if (!googleConsent) return { family, kind: 'google', availability: 'needs-consent' };
          if (state?.state === 'ready') return { family, kind: 'google', availability: 'ready' };
          if (state?.state === 'error')
            return { family, kind: 'google', availability: 'error', message: state.message };
          return { family, kind: 'google', availability: 'loading' };
        }
        return {
          family,
          kind: 'user',
          availability: 'missing',
          message: 'Not loaded in this browser. Load the font file again.',
        };
      },

      reset() {
        for (const font of get().userFonts) registrar.removeFamily(font.family);
        set({ userFonts: [] });
      },

      async ensureFonts(families) {
        for (const family of families) {
          const status = get().statusOf(family);
          if (status.kind === 'google' && get().googleConsent && !get().googleState[family]) {
            await get()
              .loadGoogleFont(family)
              .catch(() => undefined);
          }
        }
        return families.map((family) => get().statusOf(family));
      },
    };
  });
}

export type FontStore = ReturnType<typeof createFontStore>;

const CONSENT_KEY = 'open-vitae:google-fonts-consent';
const FAMILIES_KEY = 'open-vitae:google-fonts';

export function createLocalFontPreferences(): FontPreferences {
  const read = (key: string) => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  };
  const write = (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Preference only.
    }
  };
  return {
    getGoogleConsent: () => read(CONSENT_KEY) === 'yes',
    setGoogleConsent: (value) => write(CONSENT_KEY, value ? 'yes' : 'no'),
    getGoogleFamilies: () => {
      try {
        const parsed: unknown = JSON.parse(read(FAMILIES_KEY) ?? '[]');
        return Array.isArray(parsed)
          ? parsed.filter((f): f is string => typeof f === 'string' && cleanFamilyName(f) === f)
          : [];
      } catch {
        return [];
      }
    },
    setGoogleFamilies: (families) => write(FAMILIES_KEY, JSON.stringify(families)),
  };
}

export function createMemoryFontPreferences(): FontPreferences {
  let consent = false;
  let families: string[] = [];
  return {
    getGoogleConsent: () => consent,
    setGoogleConsent: (value) => {
      consent = value;
    },
    getGoogleFamilies: () => families,
    setGoogleFamilies: (value) => {
      families = value;
    },
  };
}

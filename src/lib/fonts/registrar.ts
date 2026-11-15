import type { FontFormat } from './font-file';

export interface FontFaceSource {
  readonly family: string;
  readonly data: ArrayBuffer | string;
  readonly weight?: string;
  readonly style?: string;
}

/** Makes fonts usable on the page. In tests, a memory version records calls. */
export interface FontRegistrar {
  addFace(source: FontFaceSource): Promise<void>;
  removeFamily(family: string): void;
  /** Add a stylesheet (Google Fonts), keyed so it is only added once. */
  addStylesheet(key: string, css: string): void;
}

export function createBrowserRegistrar(): FontRegistrar {
  const faces = new Map<string, FontFace[]>();
  return {
    async addFace({ family, data, weight = '400', style = 'normal' }) {
      const face = new FontFace(family, data, { weight, style, display: 'swap' });
      await face.load();
      document.fonts.add(face);
      faces.set(family, [...(faces.get(family) ?? []), face]);
    },
    removeFamily(family) {
      for (const face of faces.get(family) ?? []) document.fonts.delete(face);
      faces.delete(family);
    },
    addStylesheet(key, css) {
      const id = `ov-font-${key.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`;
      if (document.getElementById(id)) return;
      const style = document.createElement('style');
      style.id = id;
      style.textContent = css;
      document.head.append(style);
    },
  };
}

export interface MemoryRegistrar extends FontRegistrar {
  readonly families: Set<string>;
  readonly stylesheets: Map<string, string>;
}

export function createMemoryRegistrar(): MemoryRegistrar {
  const families = new Set<string>();
  const stylesheets = new Map<string, string>();
  return {
    families,
    stylesheets,
    async addFace({ family }) {
      families.add(family);
    },
    removeFamily(family) {
      families.delete(family);
    },
    addStylesheet(key, css) {
      stylesheets.set(key, css);
    },
  };
}

export const FORMAT_LABELS: Readonly<Record<FontFormat, string>> = {
  woff2: 'WOFF2',
  woff: 'WOFF',
  truetype: 'TrueType',
  opentype: 'OpenType',
};

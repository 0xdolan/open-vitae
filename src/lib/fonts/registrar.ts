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
  /** Every face added and not removed, so exporters can embed the fonts a resume uses. */
  sources(): readonly FontFaceSource[];
}

export function createBrowserRegistrar(): FontRegistrar {
  const faces = new Map<string, FontFace[]>();
  const added: FontFaceSource[] = [];
  return {
    async addFace(source) {
      const { family, data, weight = '400', style = 'normal' } = source;
      const face = new FontFace(family, data, { weight, style, display: 'swap' });
      await face.load();
      document.fonts.add(face);
      faces.set(family, [...(faces.get(family) ?? []), face]);
      added.push({ family, data, weight, style });
    },
    removeFamily(family) {
      for (const face of faces.get(family) ?? []) document.fonts.delete(face);
      faces.delete(family);
      for (let i = added.length - 1; i >= 0; i -= 1)
        if (added[i]?.family === family) added.splice(i, 1);
    },
    sources: () => added,
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
  const added: FontFaceSource[] = [];
  return {
    families,
    stylesheets,
    async addFace(source) {
      families.add(source.family);
      added.push(source);
    },
    removeFamily(family) {
      families.delete(family);
      for (let i = added.length - 1; i >= 0; i -= 1)
        if (added[i]?.family === family) added.splice(i, 1);
    },
    sources: () => added,
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

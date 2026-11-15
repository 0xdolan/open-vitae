import { toCanvas, toSvg } from 'html-to-image';

/**
 * Turning rendered pages into pictures and reading where their links and
 * words are. Works on the page sheets drawn by PageSheet at 100% zoom.
 * Browser only.
 */

/** CSS pixels per inch: the browser lays pages out at 96 DPI. */
export const CSS_DPI = 96;
/** Largest picture drawn, in pixels; browsers fail or run out of memory above this. */
export const MAX_CANVAS_PIXELS = 60_000_000;

export interface Box {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface PageLink {
  readonly url: string;
  readonly boxes: readonly Box[];
}

export interface TextRun extends Box {
  readonly text: string;
  readonly fontSize: number;
}

/** The scale for a resolution, lowered if the picture would be too large to draw. */
export function pixelRatioFor(
  dpi: number,
  widthPx: number,
  heightPx: number,
): { ratio: number; limited: boolean } {
  const wanted = dpi / CSS_DPI;
  const max = Math.sqrt(MAX_CANVAS_PIXELS / Math.max(1, widthPx * heightPx));
  return wanted > max ? { ratio: max, limited: true } : { ratio: wanted, limited: false };
}

function relative(rect: DOMRect, origin: DOMRect): Box {
  return {
    x: rect.left - origin.left,
    y: rect.top - origin.top,
    width: rect.width,
    height: rect.height,
  };
}

const SAFE_LINK = /^(https?:|mailto:|tel:)/i;

/** Every web, email and phone link on the page, with the boxes it covers (one per line). */
export function collectLinks(page: HTMLElement): PageLink[] {
  const origin = page.getBoundingClientRect();
  return Array.from(page.querySelectorAll<HTMLAnchorElement>('a[href]'))
    .filter((a) => SAFE_LINK.test(a.getAttribute('href') ?? ''))
    .map((a) => ({
      url: a.getAttribute('href') ?? '',
      boxes: Array.from(a.getClientRects())
        .filter((r) => r.width > 0 && r.height > 0)
        .map((r) => relative(r, origin)),
    }))
    .filter((link) => link.boxes.length > 0);
}

/**
 * The words on the page as runs of text on one line, with their position.
 * Used for the invisible text layer that makes a PDF searchable.
 */
export function collectTextRuns(page: HTMLElement): TextRun[] {
  const origin = page.getBoundingClientRect();
  const pageBox = { right: origin.width, bottom: origin.height };
  const runs: TextRun[] = [];
  const walker = document.createTreeWalker(page, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.textContent ?? '';
    const parent = node.parentElement;
    if (!parent || text.trim() === '') continue;
    // Skip decorative and non-text parts of the page (the page itself may sit in a hidden export copy).
    const skipped = parent.closest('[aria-hidden="true"], svg, style, script');
    if (skipped && page.contains(skipped) && skipped !== page) continue;
    const fontSize = Number.parseFloat(getComputedStyle(parent).fontSize) || 12;
    let current: { text: string; box: Box } | null = null;
    const flush = () => {
      if (current && current.text.trim() !== '') {
        runs.push({ ...current.box, text: current.text.replace(/\s+/g, ' '), fontSize });
      }
      current = null;
    };
    for (let i = 0; i < text.length; i += 1) {
      range.setStart(node, i);
      range.setEnd(node, i + 1);
      const rect = range.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) continue;
      const box = relative(rect, origin);
      // Clipped away (taller than the page): not part of the printed page.
      if (box.y >= pageBox.bottom || box.y + box.height <= 0) continue;
      const char = text[i] as string;
      if (current && Math.abs(box.y - current.box.y) < box.height / 2) {
        const left = Math.min(current.box.x, box.x);
        const right = Math.max(current.box.x + current.box.width, box.x + box.width);
        // Keep reading order: right-to-left text grows leftwards.
        current = {
          text: current.text + char,
          box: {
            x: left,
            y: Math.min(current.box.y, box.y),
            width: right - left,
            height: Math.max(current.box.height, box.height),
          },
        };
      } else {
        flush();
        current = { text: char, box };
      }
    }
    flush();
  }
  range.detach();
  return runs;
}

interface RenderOptions {
  readonly pixelRatio: number;
  readonly fontEmbedCSS: string;
}

const common = (options: RenderOptions) => ({
  pixelRatio: options.pixelRatio,
  backgroundColor: '#ffffff',
  fontEmbedCSS: options.fontEmbedCSS,
  cacheBust: false,
  // The page is drawn at its natural size, ignoring any zoom around it.
  style: { margin: '0', transform: 'none', boxShadow: 'none' },
});

/** Draw a page onto a canvas at the given scale. */
export function renderPageCanvas(
  page: HTMLElement,
  options: RenderOptions,
): Promise<HTMLCanvasElement> {
  return toCanvas(page, common(options));
}

/** A page as an SVG document (text and shapes, with fonts and pictures inlined). */
export async function renderPageSvg(page: HTMLElement, fontEmbedCSS: string): Promise<string> {
  const dataUrl = await toSvg(page, { ...common({ pixelRatio: 1, fontEmbedCSS }) });
  const comma = dataUrl.indexOf(',');
  return decodeURIComponent(dataUrl.slice(comma + 1));
}

export function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: 'image/png' | 'image/jpeg',
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('The page could not be drawn.'))),
      type,
      quality,
    );
  });
}

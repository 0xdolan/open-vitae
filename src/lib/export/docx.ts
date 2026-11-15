import {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  ImageRun,
  LevelFormat,
  Packer,
  PageOrientation,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TabStopType,
  TextRun,
  WidthType,
  type IRunOptions,
  type ParagraphChild,
} from 'docx';

import { contentBoxMm, pageBoxMm } from '@/lib/page-geometry';
import { isSafeUrl } from '@/lib/url';
import type { ResumeDocument, TextStyle } from '@/schema/resume';

/**
 * Word (.docx) export with the docx library, built from the resume itself
 * rather than a picture, so the result is a normal editable document: real
 * headings, paragraphs, bullet and numbered lists, tables, links and the
 * photo, in the resume's fonts, sizes, colours and direction.
 * Browser only (uses DOMParser and canvas for pictures).
 */

const TWIP_PER_MM = 56.692_913;
const BULLETS = ['•', '◦', '▪'];
const LIST_INDENT = 360; // twips per level (a quarter inch)

interface WordImage {
  readonly data: Uint8Array;
  readonly type: 'png' | 'jpg';
  readonly width: number;
  readonly height: number;
}

/** Word cannot show WebP, so every picture is decoded and saved as PNG or JPEG. */
async function toWordImage(dataUrl: string): Promise<WordImage | null> {
  const img = new Image();
  img.src = dataUrl;
  try {
    await img.decode();
  } catch {
    return null;
  }
  const keepPng = dataUrl.startsWith('data:image/png');
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const context = canvas.getContext('2d');
  if (!context) return null;
  if (!keepPng) {
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
  context.drawImage(img, 0, 0);
  const out = canvas.toDataURL(keepPng ? 'image/png' : 'image/jpeg', 0.92);
  const binary = atob(out.slice(out.indexOf(',') + 1));
  const data = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) data[i] = binary.charCodeAt(i);
  return { data, type: keepPng ? 'png' : 'jpg', width: img.naturalWidth, height: img.naturalHeight };
}

const hex = (color: string | undefined) => {
  if (!color) return undefined;
  const value = color.trim();
  if (/^#[0-9a-f]{6}$/i.test(value)) return value.slice(1).toUpperCase();
  if (/^#[0-9a-f]{3}$/i.test(value)) return value.slice(1).split('').map((c) => c + c).join('').toUpperCase();
  const rgb = /^rgba?\((\d+),\s*(\d+),\s*(\d+)/i.exec(value);
  return rgb ? rgb.slice(1, 4).map((n) => Number(n).toString(16).padStart(2, '0')).join('').toUpperCase() : undefined;
};

/** Font size in half-points from a CSS size (pt, px or em relative to the base size). */
const halfPoints = (value: string | undefined, basePt: number) => {
  if (!value) return undefined;
  const number = Number.parseFloat(value);
  if (!Number.isFinite(number)) return undefined;
  if (value.endsWith('px')) return Math.round(number * 0.75 * 2);
  if (value.endsWith('em') || value.endsWith('rem')) return Math.round(number * basePt * 2);
  return Math.round(number * 2);
};

const firstFamily = (value: string | undefined) => value?.split(',')[0]?.trim().replace(/^["']|["']$/g, '') || undefined;

interface Context {
  readonly basePt: number;
  readonly rtl: boolean;
  readonly mono: string;
  readonly images: ReadonlyMap<string, WordImage>;
  readonly maxImageWidthPx: number;
  /** Numbered lists restart from 1: each gets its own instance. */
  nextListInstance: number;
}

/** A text style from the editor (colour, font, size) as Word run options. */
function styleRun(style: TextStyle | undefined): Partial<IRunOptions> {
  if (!style) return {};
  return {
    ...(style.color ? { color: hex(style.color) } : {}),
    ...(style.fontFamily ? { font: style.fontFamily } : {}),
    ...(style.fontSizePt ? { size: Math.round(style.fontSizePt * 2) } : {}),
  };
}

function runsOf(node: Node, run: Partial<IRunOptions>, ctx: Context): ParagraphChild[] {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = (node.textContent ?? '').replace(/\s+/g, ' ');
    return text ? [new TextRun({ ...run, text, rightToLeft: ctx.rtl })] : [];
  }
  if (!(node instanceof HTMLElement)) return [];
  const next: Record<string, unknown> = { ...run };
  const style = node.style;
  if (style.color) next.color = hex(style.color);
  if (style.backgroundColor) {
    const fill = hex(style.backgroundColor);
    if (fill) next.shading = { type: ShadingType.CLEAR, fill, color: 'auto' };
  }
  if (style.fontSize) next.size = halfPoints(style.fontSize, ctx.basePt);
  if (style.fontFamily) next.font = firstFamily(style.fontFamily);
  const children = () => Array.from(node.childNodes).flatMap((child) => runsOf(child, next as Partial<IRunOptions>, ctx));
  switch (node.tagName) {
    case 'STRONG':
    case 'B':
      next.bold = true;
      return children();
    case 'EM':
    case 'I':
      next.italics = true;
      return children();
    case 'U':
      next.underline = {};
      return children();
    case 'S':
    case 'DEL':
      next.strike = true;
      return children();
    case 'SUB':
      next.subScript = true;
      return children();
    case 'SUP':
      next.superScript = true;
      return children();
    case 'CODE':
      next.font = ctx.mono;
      return children();
    case 'BR':
      return [new TextRun({ ...run, break: 1 })];
    case 'A': {
      const href = node.getAttribute('href') ?? '';
      next.style = 'Hyperlink';
      const inner = children();
      return isSafeUrl(href) ? [new ExternalHyperlink({ link: href, children: inner as TextRun[] })] : inner;
    }
    case 'IMG': {
      const image = ctx.images.get(node.getAttribute('src') ?? '');
      if (!image) return [];
      const width = Math.min(Number(node.getAttribute('width')) || image.width, ctx.maxImageWidthPx);
      const height = Math.round((width * image.height) / image.width);
      return [new ImageRun({ type: image.type, data: image.data, transformation: { width, height } })];
    }
    default:
      return children();
  }
}

const ALIGN: Readonly<Record<string, (typeof AlignmentType)[keyof typeof AlignmentType]>> = {
  left: AlignmentType.LEFT,
  start: AlignmentType.START,
  center: AlignmentType.CENTER,
  right: AlignmentType.RIGHT,
  end: AlignmentType.END,
  justify: AlignmentType.JUSTIFIED,
};

function paragraphOptions(element: HTMLElement, ctx: Context) {
  const level = Number(element.style.getPropertyValue('--ov-level')) || 0;
  return {
    bidirectional: ctx.rtl,
    alignment: ALIGN[element.style.textAlign],
    ...(level > 0 ? { indent: { start: level * LIST_INDENT } } : {}),
  };
}

function listParagraphs(list: HTMLElement, level: number, ctx: Context, run: Partial<IRunOptions>): Paragraph[] {
  const ordered = list.tagName === 'OL';
  const instance = ordered ? (ctx.nextListInstance += 1) : 0;
  const out: Paragraph[] = [];
  for (const item of Array.from(list.children).filter((c): c is HTMLElement => c instanceof HTMLElement && c.tagName === 'LI')) {
    const inline: Node[] = [];
    const nested: HTMLElement[] = [];
    for (const child of Array.from(item.childNodes)) {
      if (child instanceof HTMLElement && (child.tagName === 'UL' || child.tagName === 'OL')) nested.push(child);
      else if (child instanceof HTMLElement && child.tagName === 'P') inline.push(...Array.from(child.childNodes));
      else inline.push(child);
    }
    out.push(
      new Paragraph({
        bidirectional: ctx.rtl,
        numbering: { reference: ordered ? 'ov-numbers' : 'ov-bullets', level: Math.min(level, 8), ...(ordered ? { instance } : {}) },
        children: inline.flatMap((n) => runsOf(n, run, ctx)),
      }),
    );
    for (const sub of nested) out.push(...listParagraphs(sub, level + 1, ctx, run));
  }
  return out;
}

/** Rich text to Word paragraphs and tables. */
function blocksOf(html: string, ctx: Context, run: Partial<IRunOptions> = {}): (Paragraph | Table)[] {
  if (html.trim() === '') return [];
  const template = document.createElement('template');
  template.innerHTML = html;
  const out: (Paragraph | Table)[] = [];
  for (const node of Array.from(template.content.childNodes)) {
    if (!(node instanceof HTMLElement)) {
      const runs = runsOf(node, run, ctx);
      if (runs.length > 0) out.push(new Paragraph({ bidirectional: ctx.rtl, children: runs }));
      continue;
    }
    switch (node.tagName) {
      case 'UL':
      case 'OL':
        out.push(...listParagraphs(node, 0, ctx, run));
        break;
      case 'H1':
      case 'H2':
      case 'H3':
      case 'H4':
        out.push(
          new Paragraph({
            ...paragraphOptions(node, ctx),
            spacing: { before: 120, after: 40 },
            children: Array.from(node.childNodes).flatMap((n) => runsOf(n, { ...run, bold: true, size: Math.round(ctx.basePt * 2 * (node.tagName === 'H4' ? 1 : 1.1)) }, ctx)),
          }),
        );
        break;
      case 'PRE':
        for (const line of (node.textContent ?? '').replace(/\n$/, '').split('\n')) {
          out.push(
            new Paragraph({
              shading: { type: ShadingType.CLEAR, fill: 'F5F5F4', color: 'auto' },
              spacing: { before: 0, after: 0 },
              children: [new TextRun({ text: line || ' ', font: ctx.mono, size: Math.round(ctx.basePt * 1.8) })],
            }),
          );
        }
        break;
      case 'BLOCKQUOTE':
        for (const block of blocksOf(node.innerHTML, ctx, { ...run, italics: true })) out.push(block);
        break;
      case 'HR':
        out.push(new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'A8A29E', space: 1 } }, children: [] }));
        break;
      case 'TABLE': {
        const rows = Array.from(node.querySelectorAll('tr')).map(
          (tr) =>
            new TableRow({
              children: Array.from(tr.children).map(
                (cell) =>
                  new TableCell({
                    children: (() => {
                      const blocks = blocksOf(cell.innerHTML, ctx, cell.tagName === 'TH' ? { ...run, bold: true } : run);
                      return blocks.length > 0 ? blocks : [new Paragraph({ children: [] })];
                    })(),
                  }),
              ),
            }),
        );
        if (rows.length > 0) out.push(new Table({ rows, width: { size: 100, type: WidthType.PERCENTAGE }, visuallyRightToLeft: ctx.rtl }));
        break;
      }
      default:
        out.push(new Paragraph({ ...paragraphOptions(node, ctx), children: Array.from(node.childNodes).flatMap((n) => runsOf(n, run, ctx)) }));
    }
  }
  return out;
}

function collectImageSources(doc: ResumeDocument): string[] {
  const sources = new Set<string>();
  if (doc.photo) sources.add(doc.photo.dataUrl);
  const htmls = [doc.profile.summaryHtml, ...doc.sections.flatMap((s) => s.items.map((i) => i.descriptionHtml))];
  for (const html of htmls) for (const match of html.matchAll(/<img[^>]+src="(data:image\/[^"]+)"/g)) if (match[1]) sources.add(match[1]);
  return [...sources];
}

const listLevels = (format: 'bullet' | 'decimal') =>
  Array.from({ length: 9 }, (_, level) => ({
    level,
    format: format === 'bullet' ? LevelFormat.BULLET : [LevelFormat.DECIMAL, LevelFormat.LOWER_LETTER, LevelFormat.LOWER_ROMAN][level % 3] ?? LevelFormat.DECIMAL,
    text: format === 'bullet' ? (BULLETS[level % BULLETS.length] ?? '•') : `%${level + 1}.`,
    alignment: AlignmentType.START,
    style: { paragraph: { indent: { start: LIST_INDENT * (level + 1), hanging: LIST_INDENT } } },
  }));

/** Build the .docx file. */
export async function buildDocx(doc: ResumeDocument): Promise<Blob> {
  const { layout, profile } = doc;
  const rtl = layout.direction === 'rtl';
  const accent = hex(layout.accentColor) ?? '14532D';
  const page = pageBoxMm(layout);
  const content = contentBoxMm(layout);
  const contentTwips = Math.round(content.widthMm * TWIP_PER_MM);

  const images = new Map<string, WordImage>();
  for (const src of collectImageSources(doc)) {
    const image = await toWordImage(src);
    if (image) images.set(src, image);
  }
  const ctx: Context = {
    basePt: layout.baseFontSizePt,
    rtl,
    mono: 'Consolas',
    images,
    maxImageWidthPx: Math.round((content.widthMm / 25.4) * 96),
    nextListInstance: 0,
  };
  const p = (options: ConstructorParameters<typeof Paragraph>[0] & object) => new Paragraph({ bidirectional: rtl, ...options });
  const text = (value: string, options: Partial<IRunOptions> = {}) => new TextRun({ ...options, text: value, rightToLeft: rtl });

  const children: (Paragraph | Table)[] = [];

  // Header: photo, name, headline, contacts.
  const photo = doc.photo ? images.get(doc.photo.dataUrl) : undefined;
  if (photo && doc.photo) {
    const widthPx = Math.round((doc.photo.widthMm / 25.4) * 96);
    children.push(
      p({
        alignment: doc.photo.align === 'center' ? AlignmentType.CENTER : doc.photo.align === 'end' ? AlignmentType.END : AlignmentType.START,
        children: [new ImageRun({ type: photo.type, data: photo.data, transformation: { width: widthPx, height: Math.round((widthPx * photo.height) / photo.width) } })],
      }),
    );
  }
  if (profile.fullName) {
    children.push(p({ children: [text(profile.fullName, { bold: true, size: Math.round(layout.baseFontSizePt * 2.2 * 2), ...styleRun(profile.nameStyle) })] }));
  }
  if (profile.headline) {
    children.push(p({ children: [text(profile.headline, { color: accent, size: Math.round(layout.baseFontSizePt * 1.1 * 2), ...styleRun(profile.headlineStyle) })] }));
  }
  const contacts: ParagraphChild[] = [];
  const addContact = (child: ParagraphChild) => {
    if (contacts.length > 0) contacts.push(text('  •  ', { color: 'A8A29E' }));
    contacts.push(child);
  };
  const linkRun = (label: string, href: string) =>
    isSafeUrl(href) ? new ExternalHyperlink({ link: href, children: [text(label, { style: 'Hyperlink' })] }) : text(label);
  if (profile.email) addContact(linkRun(profile.email, `mailto:${profile.email}`));
  if (profile.phone) addContact(text(profile.phone));
  if (profile.location) addContact(text(profile.location));
  if (profile.website) addContact(linkRun(profile.website.replace(/^https?:\/\//, ''), profile.website));
  for (const link of profile.links.filter((l) => l.url)) addContact(linkRun(link.label || link.url, link.url));
  if (contacts.length > 0) children.push(p({ spacing: { after: 120 }, children: contacts }));
  children.push(...blocksOf(profile.summaryHtml, ctx));

  // Sections.
  for (const section of doc.sections.filter((s) => s.visible)) {
    children.push(
      p({
        pageBreakBefore: section.breakBefore,
        keepNext: true,
        spacing: { before: 240, after: 100 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: accent, space: 2 } },
        children: [
          text(section.title.toLocaleUpperCase(doc.language), {
            bold: true,
            color: accent,
            size: Math.round(layout.baseFontSizePt * 1.1 * 2),
            characterSpacing: 10,
            ...styleRun(section.titleStyle),
          }),
        ],
      }),
    );
    for (const item of section.items.filter((i) => i.visible)) {
      if (item.title || item.dateRange) {
        const title = item.url ? linkRun(item.title, item.url) : text(item.title, { bold: true, ...styleRun(item.titleStyle) });
        children.push(
          p({
            pageBreakBefore: item.breakBefore,
            keepNext: true,
            spacing: { before: 120 },
            tabStops: [{ type: TabStopType.RIGHT, position: contentTwips }],
            children: [title, ...(item.dateRange ? [text(`\t${item.dateRange}`, { color: '57534E', size: Math.round(layout.baseFontSizePt * 0.9 * 2) })] : [])],
          }),
        );
      }
      const meta = [item.subtitle, item.location].filter(Boolean).join(' · ');
      if (meta) children.push(p({ keepNext: true, children: [text(meta, { color: '57534E', size: Math.round(layout.baseFontSizePt * 0.9 * 2) })] }));
      children.push(...blocksOf(item.descriptionHtml, ctx, styleRun(item.descriptionStyle ?? section.descriptionStyle)));
    }
  }

  const document_ = new Document({
    creator: profile.fullName || 'Open Vitae',
    lastModifiedBy: 'Open Vitae',
    title: profile.fullName ? `${profile.fullName} – Resume` : doc.name,
    description: profile.headline,
    styles: {
      default: {
        document: {
          run: { font: layout.fontFamily, size: Math.round(layout.baseFontSizePt * 2), rightToLeft: rtl },
          paragraph: { spacing: { line: Math.round(layout.lineHeight * 240), after: 60 } },
        },
      },
      characterStyles: [{ id: 'Hyperlink', name: 'Hyperlink', run: { color: accent, underline: {} } }],
    },
    numbering: {
      config: [
        { reference: 'ov-bullets', levels: listLevels('bullet') },
        { reference: 'ov-numbers', levels: listLevels('decimal') },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: {
              width: Math.round((layout.orientation === 'landscape' ? page.heightMm : page.widthMm) * TWIP_PER_MM),
              height: Math.round((layout.orientation === 'landscape' ? page.widthMm : page.heightMm) * TWIP_PER_MM),
              orientation: layout.orientation === 'landscape' ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT,
            },
            margin: (() => {
              const m = Math.round(content.marginMm * TWIP_PER_MM);
              return { top: m, right: m, bottom: m, left: m };
            })(),
          },
        },
        children,
      },
    ],
  });
  return Packer.toBlob(document_);
}

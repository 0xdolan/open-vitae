import { getFontEmbedCSS } from 'html-to-image';
import JSZip from 'jszip';

import type { ExportFormat } from '@/config/export';
import type { FontFaceSource } from '@/lib/fonts/registrar';
import { applyDigits } from '@/lib/digits';
import { pageBoxMm } from '@/lib/page-geometry';
import type { VersionSummary } from '@/lib/versions/repository';
import type { ResumeDocument } from '@/schema/resume';

import { buildDataFile, type BuiltFile } from './data-formats';
import { setJpegDpi, setPngDpi } from './dpi-metadata';
import { exportFileName } from './file-name';
import { fontEmbedCss } from './fonts-embed';
import {
  canvasToBlob,
  collectLinks,
  collectTextRuns,
  pixelRatioFor,
  renderPageCanvas,
  renderPageSvg,
} from './page-capture';

/**
 * Runs an export in the browser: draws the pages when the format needs
 * pictures, builds the file and returns it ready to download.
 */

export { DEFAULT_DPI, DPI_OPTIONS, PICTURE_FORMATS, type ExportFormat } from '@/config/export';

export interface ExportOptions {
  readonly format: ExportFormat;
  readonly dpi: number;
  /** JPEG quality, 0.5 to 1. */
  readonly jpegQuality: number;
  /** Which pages, for picture formats: all, or a page number from 1. */
  readonly pages: 'all' | number;
}

export interface ExportJob {
  readonly doc: ResumeDocument;
  readonly version: VersionSummary | null;
  readonly appVersion: string;
  readonly now: Date;
  /** The rendered page sheets at 100% zoom, in order. */
  readonly pageElements: readonly HTMLElement[];
  readonly fontSources: readonly FontFaceSource[];
  readonly options: ExportOptions;
  readonly onProgress?: (message: string) => void;
}

async function blobToBytes(blob: Blob): Promise<Uint8Array> {
  return new Uint8Array(await blob.arrayBuffer());
}

async function allFontCss(job: ExportJob, first: HTMLElement): Promise<string> {
  const [fromStylesheets, fromFaces] = await Promise.all([
    getFontEmbedCSS(first).catch(() => ''),
    fontEmbedCss(job.doc, job.fontSources),
  ]);
  return `${fromStylesheets}\n${fromFaces}`;
}

/** Wait until fonts and pictures on the pages are ready to draw. */
export async function pagesReady(pages: readonly HTMLElement[]): Promise<void> {
  await document.fonts.ready;
  const images = pages.flatMap((page) => Array.from(page.querySelectorAll('img')));
  await Promise.all(
    images.map((img) => (img.complete ? Promise.resolve() : img.decode().catch(() => undefined))),
  );
}

export async function runExport(job: ExportJob): Promise<BuiltFile> {
  const { doc, options, version, now } = job;
  const savedAt = version ? new Date(version.savedAt) : now;
  const base = (extension: string, page?: number) =>
    exportFileName(
      doc.profile.fullName || doc.name,
      version?.number ?? null,
      savedAt,
      extension,
    ).replace(
      new RegExp(`\\.${extension}$`),
      page === undefined ? `.${extension}` : `-page-${page}.${extension}`,
    );
  // "maya-okafor-v3-…-png.zip": the format in the name, so PNG and JPG zips never clash.
  const zipName = (extension: string) => base('zip').replace(/\.zip$/, `-${extension}.zip`);
  const progress = job.onProgress ?? (() => undefined);

  if (
    options.format === 'json' ||
    options.format === 'csv' ||
    options.format === 'xlsx' ||
    options.format === 'markdown'
  ) {
    return buildDataFile(doc, options.format, { version, appVersion: job.appVersion, now });
  }

  if (options.format === 'docx') {
    progress('Building the Word document…');
    const { buildDocx } = await import('./docx');
    return { fileName: base('docx'), blob: await buildDocx(applyDigits(doc)), warnings: [] };
  }

  if (options.format === 'icml') {
    const { buildIcml } = await import('./icml');
    return {
      fileName: base('icml'),
      blob: new Blob([buildIcml(applyDigits(doc))], {
        type: 'application/vnd.adobe.incopy-icml+xml',
      }),
      warnings: [
        'In InDesign, use File › Place to put the story into a text frame. Place the photo separately.',
      ],
    };
  }

  // Picture formats.
  const all = job.pageElements;
  if (all.length === 0) throw new Error('There are no pages to export.');
  const selected =
    options.pages === 'all' || options.format === 'pdf'
      ? all
      : all.slice(options.pages - 1, options.pages);
  const first = selected[0] as HTMLElement;
  await pagesReady(selected);
  progress('Preparing fonts…');
  const fontCSS = await allFontCss(job, first);
  const warnings: string[] = [];

  if (options.format === 'svg') {
    const files: { name: string; blob: Blob }[] = [];
    for (const [index, page] of selected.entries()) {
      progress(`Drawing page ${index + 1} of ${selected.length}…`);
      files.push({
        name: base('svg', index + 1),
        blob: new Blob([await renderPageSvg(page, fontCSS)], { type: 'image/svg+xml' }),
      });
    }
    warnings.push(
      'SVG pages show correctly in web browsers. Design apps such as Illustrator and Inkscape may not show the text, so use PDF for them.',
    );
    return packFiles(
      files,
      zipName('svg'),
      warnings,
      selected.length === 1 ? base('svg') : undefined,
    );
  }

  // Exact page size from the paper size (the laid-out page is rounded to whole pixels).
  const paper = pageBoxMm(doc.layout);
  const widthPx = (paper.widthMm / 25.4) * 96;
  const heightPx = (paper.heightMm / 25.4) * 96;
  const fit = pixelRatioFor(options.dpi, widthPx, heightPx);
  // Scale so the picture is exactly the paper size at the chosen resolution (2480 px for A4 at 300 DPI).
  const ratio = fit.limited
    ? fit.ratio
    : Math.round((paper.widthMm / 25.4) * options.dpi) / first.offsetWidth;
  const limited = fit.limited;
  const effectiveDpi = limited ? Math.round(fit.ratio * 96) : options.dpi;
  if (limited)
    warnings.push(
      `The resolution was lowered to about ${Math.round(ratio * 96)} DPI, the most this browser can draw for this page size.`,
    );

  if (options.format === 'pdf') {
    const { buildPdf } = await import('./pdf');
    const inputs = [];
    for (const [index, page] of selected.entries()) {
      progress(`Drawing page ${index + 1} of ${selected.length}…`);
      const canvas = await renderPageCanvas(page, { pixelRatio: ratio, fontEmbedCSS: fontCSS });
      inputs.push({
        image: await blobToBytes(await canvasToBlob(canvas, 'image/png')),
        imageType: 'png' as const,
        widthPx,
        heightPx,
        links: collectLinks(page),
        text: collectTextRuns(page),
      });
    }
    progress('Assembling the PDF…');
    const result = await buildPdf(inputs, {
      title: doc.profile.fullName ? `${doc.profile.fullName} – Resume` : doc.name,
      author: doc.profile.fullName,
      subject: doc.profile.headline,
      keywords: doc.sections
        .filter((s) => s.kind === 'skills')
        .flatMap((s) => s.items.map((i) => i.title))
        .filter(Boolean),
      language: doc.language,
      createdAt: now,
    });
    if (result.skippedCharacters > 0) {
      warnings.push(
        result.textCharacters > 0
          ? 'Text in non-Latin scripts looks right but cannot be selected or searched in this PDF. For fully selectable text, use Print preview › Save as PDF.'
          : 'This PDF looks exactly like the preview, but its text cannot be selected or searched. For selectable text in this script, use Print preview › Save as PDF.',
      );
    }
    return {
      fileName: base('pdf'),
      blob: new Blob([result.bytes as BlobPart], { type: 'application/pdf' }),
      warnings,
    };
  }

  // PNG or JPEG.
  const type = options.format === 'png' ? 'image/png' : 'image/jpeg';
  const extension = options.format === 'png' ? 'png' : 'jpg';
  const files: { name: string; blob: Blob }[] = [];
  for (const [index, page] of selected.entries()) {
    progress(`Drawing page ${index + 1} of ${selected.length}…`);
    const canvas = await renderPageCanvas(page, { pixelRatio: ratio, fontEmbedCSS: fontCSS });
    const number = options.pages === 'all' ? index + 1 : options.pages;
    const bytes = await blobToBytes(await canvasToBlob(canvas, type, options.jpegQuality));
    const tagged =
      type === 'image/png' ? setPngDpi(bytes, effectiveDpi) : setJpegDpi(bytes, effectiveDpi);
    files.push({ name: base(extension, number), blob: new Blob([tagged as BlobPart], { type }) });
  }
  return packFiles(files, zipName(extension), warnings);
}

/** One file as it is; several in a zip. */
async function packFiles(
  files: readonly { name: string; blob: Blob }[],
  zipName: string,
  warnings: string[],
  singleName?: string,
): Promise<BuiltFile> {
  if (files.length === 1) {
    const only = files[0] as { name: string; blob: Blob };
    return { fileName: singleName ?? only.name, blob: only.blob, warnings };
  }
  const zip = new JSZip();
  for (const file of files) zip.file(file.name, file.blob);
  const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/zip' });
  return {
    fileName: zipName,
    blob,
    warnings: [...warnings, `${files.length} pages in one zip file.`],
  };
}

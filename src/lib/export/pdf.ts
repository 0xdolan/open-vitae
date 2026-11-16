import {
  PDFDocument,
  PDFName,
  PDFString,
  StandardFonts,
  type PDFFont,
  type PDFPage,
} from 'pdf-lib';

import type { Box, PageLink, TextRun } from './page-capture';

/**
 * PDF assembly with pdf-lib. Each page is the picture of the rendered page at
 * the chosen resolution, so it looks exactly like the preview in every
 * script. On top of it:
 *
 * - clickable link areas for web, email and phone links;
 * - an invisible text layer for text in Latin script, so the PDF can be
 *   searched and read by applicant tracking systems (the standard PDF fonts
 *   cover Latin only; for other scripts use Print → Save as PDF, which keeps
 *   all text selectable);
 * - document information: title, author, subject, keywords and language.
 */

/** PDF points per CSS pixel (72 / 96). */
const PT_PER_PX = 0.75;

export interface PdfPageInput {
  /** PNG or JPEG bytes of the page picture. */
  readonly image: Uint8Array;
  readonly imageType: 'png' | 'jpeg';
  /** Page size in CSS pixels at 96 DPI. */
  readonly widthPx: number;
  readonly heightPx: number;
  readonly links: readonly PageLink[];
  readonly text: readonly TextRun[];
}

export interface PdfMetadata {
  readonly title: string;
  readonly author: string;
  readonly subject: string;
  readonly keywords: readonly string[];
  readonly language: string;
  readonly createdAt: Date;
}

export interface PdfResult {
  readonly bytes: Uint8Array;
  /** Characters left out of the text layer because the standard fonts cannot encode them. */
  readonly skippedCharacters: number;
  readonly textCharacters: number;
}

function addLink(pdf: PDFDocument, page: PDFPage, url: string, box: Box, pageHeightPt: number) {
  const x1 = box.x * PT_PER_PX;
  const y1 = pageHeightPt - (box.y + box.height) * PT_PER_PX;
  const annotation = pdf.context.obj({
    Type: 'Annot',
    Subtype: 'Link',
    Rect: [x1, y1, x1 + box.width * PT_PER_PX, y1 + box.height * PT_PER_PX],
    Border: [0, 0, 0],
    A: { Type: 'Action', S: 'URI', URI: PDFString.of(url) },
  });
  page.node.addAnnot(pdf.context.register(annotation));
}

function addTextRun(
  page: PDFPage,
  font: PDFFont,
  supported: ReadonlySet<number>,
  run: TextRun,
  pageHeightPt: number,
) {
  let text = '';
  let skipped = 0;
  for (const char of run.text) {
    if (supported.has(char.codePointAt(0) ?? 0)) text += char;
    else skipped += 1;
  }
  const visibleText = text.trim();
  if (visibleText === '') return { added: 0, skipped };
  const size = Math.max(1, run.fontSize * PT_PER_PX);
  // Stretch the font size so the invisible words line up with the picture.
  const natural = font.widthOfTextAtSize(text, size);
  const target = run.width * PT_PER_PX;
  const fitted =
    natural > 0 ? Math.min(size * 2, Math.max(size * 0.5, (size * target) / natural)) : size;
  const baseline = pageHeightPt - (run.y + run.height * 0.8) * PT_PER_PX;
  page.drawText(text, { x: run.x * PT_PER_PX, y: baseline, size: fitted, font, opacity: 0 });
  return { added: visibleText.length, skipped };
}

export async function buildPdf(
  pages: readonly PdfPageInput[],
  metadata: PdfMetadata,
): Promise<PdfResult> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(metadata.title, { showInWindowTitleBar: true });
  pdf.setAuthor(metadata.author);
  pdf.setSubject(metadata.subject);
  pdf.setKeywords([...metadata.keywords]);
  pdf.setLanguage(metadata.language);
  pdf.setCreator('Open Vitae');
  pdf.setProducer('Open Vitae with pdf-lib');
  pdf.setCreationDate(metadata.createdAt);
  pdf.setModificationDate(metadata.createdAt);

  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const supported = new Set(font.getCharacterSet());
  let skippedCharacters = 0;
  let textCharacters = 0;

  for (const input of pages) {
    const widthPt = input.widthPx * PT_PER_PX;
    const heightPt = input.heightPx * PT_PER_PX;
    const page = pdf.addPage([widthPt, heightPt]);
    const image =
      input.imageType === 'png' ? await pdf.embedPng(input.image) : await pdf.embedJpg(input.image);
    page.drawImage(image, { x: 0, y: 0, width: widthPt, height: heightPt });
    for (const run of input.text) {
      const { added, skipped } = addTextRun(page, font, supported, run, heightPt);
      textCharacters += added;
      skippedCharacters += skipped;
    }
    for (const link of input.links) {
      for (const box of link.boxes) addLink(pdf, page, link.url, box, heightPt);
    }
  }

  // Open at the first page, fitted to the window.
  pdf.catalog.set(PDFName.of('PageLayout'), PDFName.of('OneColumn'));
  const bytes = await pdf.save({ useObjectStreams: true });
  return { bytes, skippedCharacters, textCharacters };
}

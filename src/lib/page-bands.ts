import { DEFAULT_PAGE_BAND_TEXT, PAGE_BAND_TOKENS } from '@/config/layout';
import { toDigits } from '@/lib/digits';
import type { PageBand, ResumeLayout } from '@/schema/resume';

export type PageBandKind = 'header' | 'footer';

/** A new header or footer, switched on, showing "1 / 3". */
export function newPageBand(): PageBand {
  return { enabled: true, text: DEFAULT_PAGE_BAND_TEXT, align: 'center', firstPage: true };
}

/** Replace {page} and {pages}, then write digits in the resume's digit set. */
export function formatPageBand(
  text: string,
  page: number,
  pages: number,
  digits: ResumeLayout['digits'],
): string {
  const filled = text
    .replaceAll(PAGE_BAND_TOKENS.page, String(page))
    .replaceAll(PAGE_BAND_TOKENS.pages, String(pages));
  return digits ? toDigits(filled, digits) : filled;
}

/** The band to draw on a page, or undefined when it is off, empty or skipped on page 1. */
export function pageBandFor(
  layout: ResumeLayout,
  kind: PageBandKind,
  page: number,
): PageBand | undefined {
  const band = layout[kind];
  if (!band?.enabled || band.text.trim() === '') return undefined;
  if (page === 1 && !band.firstPage) return undefined;
  return band;
}

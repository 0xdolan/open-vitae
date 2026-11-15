import { CSS_PX_PER_MM, getPageDimensionsMm } from '@/config/page-sizes';
import type { ResumeLayout } from '@/schema/resume';

type PageLayout = Pick<ResumeLayout, 'pageSize' | 'orientation' | 'marginMm'>;

/** The sheet of paper, in millimetres. */
export function pageBoxMm(layout: PageLayout): { widthMm: number; heightMm: number } {
  return getPageDimensionsMm(layout.pageSize, layout.orientation);
}

/** Smallest content area kept even when margins are huge on a small page. */
const MIN_CONTENT_MM = 20;

/**
 * The area inside the margins, in millimetres. Margins are reduced if they
 * would leave less than 20 mm, so a resume can never become unprintable.
 */
export function contentBoxMm(layout: PageLayout): {
  widthMm: number;
  heightMm: number;
  marginMm: number;
} {
  const { widthMm, heightMm } = pageBoxMm(layout);
  const maxMargin = Math.max(0, (Math.min(widthMm, heightMm) - MIN_CONTENT_MM) / 2);
  const marginMm = Math.min(layout.marginMm, maxMargin);
  return { widthMm: widthMm - 2 * marginMm, heightMm: heightMm - 2 * marginMm, marginMm };
}

/** Width of the sheet in CSS pixels at 100% zoom. */
export function pageWidthPx(layout: PageLayout): number {
  return pageBoxMm(layout).widthMm * CSS_PX_PER_MM;
}

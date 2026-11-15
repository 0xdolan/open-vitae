export type PageSizeId =
  | 'a3'
  | 'a4'
  | 'a5'
  | 'b5'
  | 'letter'
  | 'legal'
  | 'tabloid'
  | 'executive';

export type Orientation = 'portrait' | 'landscape';

export interface PageSize {
  readonly id: PageSizeId;
  readonly label: string;
  /** Portrait width in millimetres. */
  readonly widthMm: number;
  /** Portrait height in millimetres. */
  readonly heightMm: number;
}

export const PAGE_SIZES: readonly PageSize[] = [
  { id: 'a4', label: 'A4', widthMm: 210, heightMm: 297 },
  { id: 'letter', label: 'Letter', widthMm: 215.9, heightMm: 279.4 },
  { id: 'a3', label: 'A3', widthMm: 297, heightMm: 420 },
  { id: 'a5', label: 'A5', widthMm: 148, heightMm: 210 },
  { id: 'b5', label: 'B5', widthMm: 176, heightMm: 250 },
  { id: 'legal', label: 'Legal', widthMm: 215.9, heightMm: 355.6 },
  { id: 'tabloid', label: 'Tabloid', widthMm: 279.4, heightMm: 431.8 },
  { id: 'executive', label: 'Executive', widthMm: 184.15, heightMm: 266.7 },
];

export const DEFAULT_PAGE_SIZE: PageSizeId = 'a4';
export const DEFAULT_DPI = 300;
export const MIN_DPI = 72;
export const MAX_DPI = 1200;

const MM_PER_INCH = 25.4;

export function getPageSize(id: PageSizeId): PageSize {
  const size = PAGE_SIZES.find((s) => s.id === id);
  if (!size) {
    throw new Error(`Unknown page size: ${id}`);
  }
  return size;
}

/** Page dimensions in millimetres for the given orientation. */
export function getPageDimensionsMm(
  id: PageSizeId,
  orientation: Orientation = 'portrait',
): { widthMm: number; heightMm: number } {
  const { widthMm, heightMm } = getPageSize(id);
  return orientation === 'portrait'
    ? { widthMm, heightMm }
    : { widthMm: heightMm, heightMm: widthMm };
}

/** Convert millimetres to whole pixels at the given DPI. */
export function mmToPx(mm: number, dpi: number = DEFAULT_DPI): number {
  if (!Number.isFinite(mm) || mm < 0) {
    throw new RangeError(`mm must be a non-negative number, got ${mm}`);
  }
  if (!Number.isFinite(dpi) || dpi < MIN_DPI || dpi > MAX_DPI) {
    throw new RangeError(`dpi must be between ${MIN_DPI} and ${MAX_DPI}, got ${dpi}`);
  }
  return Math.round((mm / MM_PER_INCH) * dpi);
}

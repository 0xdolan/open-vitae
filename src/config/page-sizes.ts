export const PAGE_SIZE_IDS = [
  'a4',
  'letter',
  'a3',
  'a5',
  'a6',
  'b4',
  'b5',
  'jis-b5',
  'legal',
  'tabloid',
  'executive',
  'statement',
  'folio',
] as const;

export type PageSizeId = (typeof PAGE_SIZE_IDS)[number];

export const ORIENTATIONS = ['portrait', 'landscape'] as const;

export type Orientation = (typeof ORIENTATIONS)[number];

export const PAGE_SIZE_GROUPS = [
  'International (ISO)',
  'North American',
  'Japanese (JIS)',
] as const;

export type PageSizeGroup = (typeof PAGE_SIZE_GROUPS)[number];

export interface PageSize {
  readonly id: PageSizeId;
  readonly label: string;
  readonly group: PageSizeGroup;
  /** Portrait width in millimetres. */
  readonly widthMm: number;
  /** Portrait height in millimetres. */
  readonly heightMm: number;
  /** The unit people usually quote this size in. */
  readonly unit: 'mm' | 'in';
}

const ISO = 'International (ISO)';
const US = 'North American';

/** Standard paper sizes. Sources: ISO 216, ANSI/ASME Y14.1, JIS P 0138. */
export const PAGE_SIZES: readonly PageSize[] = [
  { id: 'a3', label: 'A3', group: ISO, widthMm: 297, heightMm: 420, unit: 'mm' },
  { id: 'a4', label: 'A4', group: ISO, widthMm: 210, heightMm: 297, unit: 'mm' },
  { id: 'a5', label: 'A5', group: ISO, widthMm: 148, heightMm: 210, unit: 'mm' },
  { id: 'a6', label: 'A6', group: ISO, widthMm: 105, heightMm: 148, unit: 'mm' },
  { id: 'b4', label: 'B4', group: ISO, widthMm: 250, heightMm: 353, unit: 'mm' },
  { id: 'b5', label: 'B5', group: ISO, widthMm: 176, heightMm: 250, unit: 'mm' },
  { id: 'letter', label: 'Letter', group: US, widthMm: 215.9, heightMm: 279.4, unit: 'in' },
  { id: 'legal', label: 'Legal', group: US, widthMm: 215.9, heightMm: 355.6, unit: 'in' },
  {
    id: 'tabloid',
    label: 'Tabloid (Ledger)',
    group: US,
    widthMm: 279.4,
    heightMm: 431.8,
    unit: 'in',
  },
  { id: 'executive', label: 'Executive', group: US, widthMm: 184.15, heightMm: 266.7, unit: 'in' },
  {
    id: 'statement',
    label: 'Statement (Half Letter)',
    group: US,
    widthMm: 139.7,
    heightMm: 215.9,
    unit: 'in',
  },
  { id: 'folio', label: 'Folio', group: US, widthMm: 215.9, heightMm: 330.2, unit: 'in' },
  {
    id: 'jis-b5',
    label: 'B5 (JIS)',
    group: 'Japanese (JIS)',
    widthMm: 182,
    heightMm: 257,
    unit: 'mm',
  },
];

export const DEFAULT_PAGE_SIZE: PageSizeId = 'a4';
export const DEFAULT_DPI = 300;
export const MIN_DPI = 72;
export const MAX_DPI = 1200;

const MM_PER_INCH = 25.4;

/** CSS pixels per millimetre (CSS defines 96 px per inch). */
export const CSS_PX_PER_MM = 96 / MM_PER_INCH;

export function isPageSizeId(value: string): value is PageSizeId {
  return (PAGE_SIZE_IDS as readonly string[]).includes(value);
}

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

function trim(value: number): string {
  return String(Number(value.toFixed(2)));
}

/** "210 × 297 mm" or "8.5 × 11 in", in the unit the size is usually quoted in. */
export function describePageSize(size: PageSize): string {
  if (size.unit === 'in') {
    return `${trim(size.widthMm / MM_PER_INCH)} × ${trim(size.heightMm / MM_PER_INCH)} in`;
  }
  return `${trim(size.widthMm)} × ${trim(size.heightMm)} mm`;
}

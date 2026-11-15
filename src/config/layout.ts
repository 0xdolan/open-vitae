export const PAGE_BREAK_MODES = ['smart', 'manual'] as const;
export type PageBreakMode = (typeof PAGE_BREAK_MODES)[number];

export const HORIZONTAL_ALIGNS = ['start', 'center', 'end'] as const;
export type HorizontalAlign = (typeof HORIZONTAL_ALIGNS)[number];

export const PHOTO_SHAPES = ['square', 'rounded', 'circle'] as const;
export type PhotoShape = (typeof PHOTO_SHAPES)[number];

/** Validation limits. Shared by the schema and the editor UI. */
export const LIMITS = {
  sections: 50,
  itemsPerSection: 200,
  links: 20,
  /** Rich text including small embedded images. */
  htmlLength: 2_000_000,
  /** About 5 MB of base64 photo data. */
  photoDataUrlLength: 7_000_000,
  marginMm: { min: 0, max: 50 },
  baseFontSizePt: { min: 6, max: 24 },
  lineHeight: { min: 1, max: 3 },
  styleFontSizePt: { min: 4, max: 96 },
  photoWidthMm: { min: 10, max: 80 },
  /** Indent step for lists and indented paragraphs, in character widths ("spaces"). */
  indentCh: { min: 1, max: 12 },
  /** Optional limit on list nesting and paragraph indent levels. */
  maxDepth: { min: 1, max: 20 },
} as const;

export const DEFAULT_INDENT_CH = 4;

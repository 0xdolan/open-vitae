export const PAGE_BREAK_MODES = ['smart', 'manual'] as const;
export type PageBreakMode = (typeof PAGE_BREAK_MODES)[number];

export const HORIZONTAL_ALIGNS = ['start', 'center', 'end'] as const;
export type HorizontalAlign = (typeof HORIZONTAL_ALIGNS)[number];

export const PHOTO_SHAPES = ['square', 'rounded', 'circle'] as const;
export type PhotoShape = (typeof PHOTO_SHAPES)[number];

/** Corner rounding for each photo shape, as CSS border-radius. */
export const PHOTO_RADIUS: Readonly<Record<PhotoShape, string>> = {
  square: '0',
  rounded: '12%',
  circle: '50%',
};

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
  /** Text of the page header or footer. */
  pageBandText: 200,
  /** Soft length limit a person can set on the summary or item descriptions, in characters. */
  textLimit: { min: 50, max: 100_000 },
} as const;

/** Soft limit on the summary, in characters, when the resume sets none. */
export const DEFAULT_SUMMARY_LIMIT = 2280;
/** Soft limit on each item description, in characters, when the resume sets none. */
export const DEFAULT_DESCRIPTION_LIMIT = 500;

/** Colour of every icon on the page unless the resume or the icon sets another. */
export const DEFAULT_ICON_COLOR = '#000000';

/** The fixed contact icons, each of which can have its own colour. */
export const CONTACT_ICON_KINDS = ['email', 'phone', 'location', 'website'] as const;
export type ContactIconKind = (typeof CONTACT_ICON_KINDS)[number];

export const DEFAULT_INDENT_CH = 4;

/** Digit sets a resume can be drawn with: Western (0123), Arabic-Indic (٠١٢٣) and Persian (۰۱۲۳). */
export const DIGIT_SYSTEMS = ['latn', 'arab', 'arabext'] as const;
export type DigitSystem = (typeof DIGIT_SYSTEMS)[number];

/** Placeholders the page header and footer text can contain. */
export const PAGE_BAND_TOKENS = { page: '{page}', pages: '{pages}' } as const;

/** Text a new header or footer starts with. */
export const DEFAULT_PAGE_BAND_TEXT = '{page} / {pages}';

/** Header and footer text size relative to the resume's base size. */
export const PAGE_BAND_FONT_SCALE = 0.8;

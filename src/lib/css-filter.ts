/**
 * Allowlist filters for the inline styles and classes the rich text editor
 * produces. Anything not listed is dropped, so pasted or imported HTML cannot
 * position elements over the page, load remote resources or run expressions.
 */

const COLOR =
  /^(?:#[0-9a-f]{3,8}|rgba?\(\s*\d{1,3}%?\s*,\s*\d{1,3}%?\s*,\s*\d{1,3}%?\s*(?:,\s*(?:0|1|0?\.\d{1,3})\s*)?\))$/i;
const LENGTH = /^\d{1,4}(?:\.\d{1,3})?(?:pt|px|em|rem|%|ch)$/;
const LINE_HEIGHT = /^(?:\d(?:\.\d{1,3})?|\d{1,4}(?:\.\d{1,3})?(?:pt|px|em|rem|%))$/;
/** Font names with optional quotes and commas; no parentheses, semicolons or backslashes. */
const FONT_FAMILY = /^[\p{L}\p{N} "',._-]{1,200}$/u;
const TEXT_ALIGN = /^(?:left|right|center|justify|start|end)$/;
/** Paragraph indent level, used as calc(var(--ov-indent) * var(--ov-level)). */
const LEVEL = /^\d{1,2}$/;

const RULES: Readonly<Record<string, RegExp>> = {
  color: COLOR,
  'background-color': COLOR,
  'font-size': LENGTH,
  'font-family': FONT_FAMILY,
  'line-height': LINE_HEIGHT,
  'text-align': TEXT_ALIGN,
  width: LENGTH,
  'min-width': LENGTH,
  '--ov-level': LEVEL,
};

/** Keep only allowed declarations with safe values. Returns "" when nothing survives. */
export function filterStyle(style: string): string {
  const kept: string[] = [];
  for (const declaration of style.split(';')) {
    const colon = declaration.indexOf(':');
    if (colon === -1) continue;
    const property = declaration.slice(0, colon).trim().toLowerCase();
    const value = declaration
      .slice(colon + 1)
      .replace(/!important/gi, '')
      .trim();
    const rule = RULES[property];
    if (rule && value !== '' && rule.test(value)) {
      kept.push(`${property}: ${value}`);
    }
  }
  return kept.join('; ');
}

/** Code highlighting classes, code language markers and a few layout classes of our own. */
const CLASS_PATTERNS: readonly RegExp[] = [
  /^hljs(?:-[a-z0-9_-]{1,40})?$/,
  /^language-[a-z0-9+#_-]{1,30}$/,
  /^ov-(?:img-(?:start|center|end)|table-borderless)$/,
];

export function filterClasses(classNames: string): string {
  return classNames
    .split(/\s+/)
    .filter((name) => name !== '' && CLASS_PATTERNS.some((pattern) => pattern.test(name)))
    .join(' ');
}

/** Only embedded raster images: remote images would reveal the reader's IP address. */
const IMAGE_DATA_URL = /^data:image\/(?:png|jpeg|webp|gif);base64,[A-Za-z0-9+/]+={0,2}$/;

export function isAllowedImageSource(src: string): boolean {
  return IMAGE_DATA_URL.test(src);
}

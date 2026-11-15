/** Choices offered in the rich text editor toolbar. */

export const FONT_SIZES_PT = [6, 7, 8, 9, 10, 10.5, 11, 12, 13, 14, 16, 18, 20, 24, 28, 32, 36, 48] as const;

export const LINE_HEIGHTS = ['1', '1.15', '1.25', '1.4', '1.5', '1.75', '2', '2.5', '3'] as const;

/** Block styles: what the "Style" menu turns the current paragraph into. */
export const BLOCK_STYLES = [
  { id: 'paragraph', label: 'Normal text' },
  { id: 'heading-1', label: 'Heading 1' },
  { id: 'heading-2', label: 'Heading 2' },
  { id: 'heading-3', label: 'Heading 3' },
  { id: 'heading-4', label: 'Heading 4' },
  { id: 'blockquote', label: 'Quote' },
  { id: 'codeBlock', label: 'Code block' },
] as const;

export type BlockStyleId = (typeof BLOCK_STYLES)[number]['id'];

/**
 * Text presets: one click applies a combination of formatting. "accent" uses
 * the resume's accent colour at the moment it is applied.
 */
export const TEXT_PRESETS = [
  { id: 'accent', label: 'Accent colour' },
  { id: 'muted', label: 'Muted', color: '#57534e' },
  { id: 'highlight', label: 'Highlighted', background: '#fef08a' },
  { id: 'small', label: 'Small print', fontSize: '0.85em', color: '#57534e' },
  { id: 'large', label: 'Large', fontSize: '1.25em' },
  { id: 'keyword', label: 'Keyword', bold: true },
] as const;

export type TextPresetId = (typeof TEXT_PRESETS)[number]['id'];

/** Quick swatches next to the colour pickers. */
export const COLOR_SWATCHES = [
  '#1c1917', '#57534e', '#a8a29e', '#b91c1c', '#c2410c', '#a16207',
  '#15803d', '#0f766e', '#1d4ed8', '#6d28d9', '#be185d', '#ffffff',
] as const;

export const HIGHLIGHT_SWATCHES = [
  '#fef08a', '#bbf7d0', '#bae6fd', '#e9d5ff', '#fecdd3', '#fed7aa', '#e7e5e4',
] as const;

/** Export formats and options, kept apart from the exporters so the code loads only when used. */

export type DataFormat = 'json' | 'csv' | 'xlsx' | 'markdown';
export type ExportFormat = 'pdf' | 'docx' | 'icml' | 'png' | 'jpg' | 'svg' | DataFormat;

/** Resolutions offered for PDF, PNG and JPG. */
export const DPI_OPTIONS = [72, 150, 300, 600] as const;
export const DEFAULT_DPI = 300;

/** Formats made from pictures of the pages. */
export const PICTURE_FORMATS: readonly ExportFormat[] = ['pdf', 'png', 'jpg', 'svg'];

/** File types the import accepts. */
export const IMPORT_ACCEPT = '.json,.csv,.tsv,.xlsx,.md,.markdown,.txt';

import { EXPORT_FORMAT } from '@/lib/export/json';
import { buildResume, cloneResume } from '@/lib/resume-factory';
import { parseResume } from '@/lib/resume-parse';
import type { ResumeDocument } from '@/schema/resume';

import { CsvError, parseCsv } from './csv';
import { htmlToMarkdown, markdownToHtml } from './markdown';
import { markdownToResume } from './markdown-resume';
import { tableToResume, type TextCodec } from './table';
import { readXlsx, XlsxError } from './xlsx';

/**
 * Import a resume from a file chosen by the person: an Open Vitae JSON backup
 * (any version, upgraded on the way in), a CSV or Excel sheet in the Open
 * Vitae table format (or a simple one with Title, Section and Dates columns),
 * or a Markdown resume. Everything is read in the browser and checked against
 * the resume schema; rich text goes through the sanitiser.
 */

export type ImportFormat = 'json' | 'csv' | 'xlsx' | 'markdown';

export { IMPORT_ACCEPT } from '@/config/export';
export const MAX_IMPORT_BYTES = 10 * 1024 * 1024;

export const FORMAT_LABELS: Readonly<Record<ImportFormat, string>> = {
  json: 'JSON',
  csv: 'CSV',
  xlsx: 'Excel',
  markdown: 'Markdown',
};

export class ImportError extends Error {
  override readonly name = 'ImportError';
}

export interface ImportResult {
  readonly doc: ResumeDocument;
  readonly format: ImportFormat;
  readonly warnings: readonly string[];
}

/** Rich text in sheet cells is Markdown. */
export const MARKDOWN_CODEC: TextCodec = {
  toText: (html) => htmlToMarkdown(html),
  toHtml: (text) => markdownToHtml(text),
};

/** Work out the format from the file name, then from the first bytes. */
export function detectImportFormat(fileName: string, head: Uint8Array): ImportFormat | null {
  const extension = /\.([a-z0-9]+)$/i.exec(fileName)?.[1]?.toLowerCase();
  if (extension === 'json') return 'json';
  if (extension === 'csv' || extension === 'tsv') return 'csv';
  if (extension === 'xlsx') return 'xlsx';
  if (extension === 'md' || extension === 'markdown' || extension === 'txt') return 'markdown';
  if (head[0] === 0x50 && head[1] === 0x4b) return 'xlsx';
  const text = new TextDecoder().decode(head).replace(/^﻿/, '').trimStart();
  if (text.startsWith('{')) return 'json';
  if (text.startsWith('#')) return 'markdown';
  return null;
}

function baseName(fileName: string): string {
  return (
    fileName
      .replace(/\.[^.]+$/, '')
      .replace(/[-_]+/g, ' ')
      .trim() || 'Imported resume'
  );
}

function build(input: Parameters<typeof buildResume>[0]): ResumeDocument {
  try {
    return buildResume(input);
  } catch (error) {
    const detail = error instanceof Error && 'issues' in error ? ' Some values are not valid.' : '';
    throw new ImportError(`The file was read, but it does not make a valid resume.${detail}`);
  }
}

function fromJson(text: string): ResumeDocument {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new ImportError('This file is not valid JSON.');
  }
  const envelope = raw as { format?: unknown; resume?: unknown };
  const candidate =
    envelope && typeof envelope === 'object' && envelope.format === EXPORT_FORMAT
      ? envelope.resume
      : raw;
  const parsed = parseResume(candidate);
  if (!parsed.ok) throw new ImportError(`This is not an Open Vitae resume: ${parsed.error}`);
  // New ids, so importing the same file twice never clashes with an existing resume.
  return cloneResume(parsed.resume, parsed.resume.name);
}

/** Read a file into a new resume. Throws ImportError with a message for the person. */
export async function importResumeFile(file: File): Promise<ImportResult> {
  if (file.size > MAX_IMPORT_BYTES) throw new ImportError('This file is larger than 10 MB.');
  if (file.size === 0) throw new ImportError('This file is empty.');
  const bytes = new Uint8Array(await file.arrayBuffer());
  const format = detectImportFormat(file.name, bytes.subarray(0, 64));
  if (!format) throw new ImportError('Choose a JSON, CSV, Excel (.xlsx) or Markdown file.');
  const name = baseName(file.name);

  try {
    switch (format) {
      case 'json':
        return { doc: fromJson(new TextDecoder().decode(bytes)), format, warnings: [] };
      case 'csv': {
        const { input, warnings } = tableToResume(
          parseCsv(new TextDecoder().decode(bytes)),
          MARKDOWN_CODEC,
          name,
        );
        return { doc: build(input), format, warnings };
      }
      case 'xlsx': {
        const { input, warnings } = tableToResume(await readXlsx(bytes), MARKDOWN_CODEC, name);
        return { doc: build(input), format, warnings };
      }
      case 'markdown':
        return {
          doc: build(markdownToResume(new TextDecoder().decode(bytes), name)),
          format,
          warnings: [],
        };
    }
  } catch (error) {
    if (error instanceof ImportError) throw error;
    if (error instanceof CsvError || error instanceof XlsxError)
      throw new ImportError(error.message);
    throw new ImportError('This file could not be read.');
  }
}

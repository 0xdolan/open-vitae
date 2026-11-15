import { toCsv } from '@/lib/interchange/csv';
import { MARKDOWN_CODEC } from '@/lib/interchange/import-file';
import { resumeToMarkdown } from '@/lib/interchange/markdown-resume';
import { resumeToTable, TABLE_COLUMNS } from '@/lib/interchange/table';
import { writeXlsx, XLSX_MIME } from '@/lib/interchange/xlsx';
import type { VersionSummary } from '@/lib/versions/repository';
import type { ResumeDocument } from '@/schema/resume';

import { exportFileName } from './file-name';
import { createJsonExport } from './json';

import type { DataFormat } from '@/config/export';

export type { DataFormat } from '@/config/export';

export interface BuiltFile {
  readonly fileName: string;
  readonly blob: Blob;
  /** Things the person should know, e.g. what the format cannot hold. */
  readonly warnings: readonly string[];
}

export interface ExportContext {
  readonly version: VersionSummary | null;
  readonly appVersion: string;
  readonly now: Date;
}

const COLUMN_WIDTHS: Readonly<Record<(typeof TABLE_COLUMNS)[number], number>> = {
  Type: 9,
  Section: 18,
  Kind: 14,
  Title: 32,
  Subtitle: 24,
  Dates: 16,
  Location: 16,
  URL: 28,
  Details: 70,
  Hidden: 8,
};

function hasImages(doc: ResumeDocument): boolean {
  return [
    doc.profile.summaryHtml,
    ...doc.sections.flatMap((s) => s.items.map((i) => i.descriptionHtml)),
  ].some((html) => html.includes('<img'));
}

/** What a sheet cannot hold, said once. */
function sheetWarnings(doc: ResumeDocument): string[] {
  const warnings = [
    'Text colours, fonts and the photo are not part of this format; use JSON for a full backup.',
  ];
  if (hasImages(doc)) warnings.push('Images inside the text were left out.');
  return warnings;
}

export async function buildDataFile(
  doc: ResumeDocument,
  format: DataFormat,
  context: ExportContext,
): Promise<BuiltFile> {
  const savedAt = context.version ? new Date(context.version.savedAt) : context.now;
  const name = (extension: string) =>
    exportFileName(
      doc.profile.fullName || doc.name,
      context.version?.number ?? null,
      savedAt,
      extension,
    );

  switch (format) {
    case 'json': {
      const file = createJsonExport(doc, context.version, context.appVersion, context.now);
      return {
        fileName: file.fileName,
        blob: new Blob([file.content], { type: file.mimeType }),
        warnings: [],
      };
    }
    case 'csv': {
      const csv = toCsv(resumeToTable(doc, MARKDOWN_CODEC));
      return {
        fileName: name('csv'),
        blob: new Blob([csv], { type: 'text/csv;charset=utf-8' }),
        warnings: sheetWarnings(doc),
      };
    }
    case 'xlsx': {
      const { bytes, truncated } = await writeXlsx(resumeToTable(doc, MARKDOWN_CODEC), {
        sheetName: 'Resume',
        title: doc.profile.fullName || doc.name,
        widths: TABLE_COLUMNS.map((column) => COLUMN_WIDTHS[column]),
        rightToLeft: doc.layout.direction === 'rtl',
      });
      const warnings = sheetWarnings(doc);
      if (truncated > 0)
        warnings.push(
          `${truncated} very long ${truncated === 1 ? 'cell was' : 'cells were'} shortened to Excel's limit.`,
        );
      return {
        fileName: name('xlsx'),
        blob: new Blob([bytes as BlobPart], { type: XLSX_MIME }),
        warnings,
      };
    }
    case 'markdown':
      return {
        fileName: name('md'),
        blob: new Blob([resumeToMarkdown(doc)], { type: 'text/markdown;charset=utf-8' }),
        warnings: ['Colours, fonts, the photo and hidden sections are not part of Markdown.'],
      };
  }
}

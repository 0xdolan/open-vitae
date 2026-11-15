import { formatDateTime } from '@/lib/datetime';
import type { VersionSummary } from '@/lib/versions/repository';
import type { ResumeDocument } from '@/schema/resume';

import { exportFileName } from './file-name';

export const EXPORT_FORMAT = 'open-vitae';
export const EXPORT_FORMAT_VERSION = 1;

/** The file people download. The import screen (phase 8) reads exactly this. */
export interface JsonExportEnvelope {
  readonly format: typeof EXPORT_FORMAT;
  readonly formatVersion: typeof EXPORT_FORMAT_VERSION;
  readonly app: string;
  readonly exportedAt: string;
  readonly exportedAtText: string;
  readonly version: {
    readonly number: number;
    readonly savedAt: string;
    readonly savedAtText: string;
    readonly note: string;
  } | null;
  readonly resume: ResumeDocument;
}

export interface ExportFile {
  readonly fileName: string;
  readonly mimeType: string;
  readonly content: string;
}

export function createJsonExport(
  doc: ResumeDocument,
  version: VersionSummary | null,
  appVersion: string,
  now: Date = new Date(),
): ExportFile {
  const envelope: JsonExportEnvelope = {
    format: EXPORT_FORMAT,
    formatVersion: EXPORT_FORMAT_VERSION,
    app: `Open Vitae ${appVersion}`,
    exportedAt: now.toISOString(),
    exportedAtText: formatDateTime(now),
    version: version
      ? {
          number: version.number,
          savedAt: version.savedAt,
          savedAtText: formatDateTime(version.savedAt),
          note: version.note,
        }
      : null,
    resume: doc,
  };

  const savedAt = version ? new Date(version.savedAt) : now;
  return {
    fileName: exportFileName(doc.profile.fullName || doc.name, version?.number ?? null, savedAt, 'json'),
    mimeType: 'application/json',
    content: `${JSON.stringify(envelope, null, 2)}\n`,
  };
}

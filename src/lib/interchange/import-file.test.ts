// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import { createJsonExport } from '@/lib/export/json';
import { createResumeFromSample } from '@/samples';

import { toCsv } from './csv';
import { detectImportFormat, ImportError, importResumeFile, MARKDOWN_CODEC } from './import-file';
import { resumeToMarkdown } from './markdown-resume';
import { resumeToTable } from './table';
import { writeXlsx } from './xlsx';

const file = (content: BlobPart, name: string) => new File([content], name);

describe('import', () => {
  const sample = createResumeFromSample('finance', 'Finance');

  it('detects formats by name and content', () => {
    const bytes = (text: string) => new TextEncoder().encode(text);
    expect(detectImportFormat('cv.JSON', bytes(''))).toBe('json');
    expect(detectImportFormat('cv.tsv', bytes(''))).toBe('csv');
    expect(detectImportFormat('cv', new Uint8Array([0x50, 0x4b, 3, 4]))).toBe('xlsx');
    expect(detectImportFormat('cv', bytes('﻿{"a":1}'))).toBe('json');
    expect(detectImportFormat('cv', bytes('# Name'))).toBe('markdown');
    expect(detectImportFormat('cv.pdf', bytes('%PDF'))).toBeNull();
  });

  it('imports a JSON backup with new ids', async () => {
    const backup = createJsonExport(sample, null, 'test');
    const { doc, format } = await importResumeFile(file(backup.content, backup.fileName));
    expect(format).toBe('json');
    expect(doc.id).not.toBe(sample.id);
    expect(doc.sections[0]?.id).not.toBe(sample.sections[0]?.id);
    expect(doc.profile.fullName).toBe(sample.profile.fullName);
    expect(doc.layout).toEqual(sample.layout);
  });

  it('imports CSV and Excel exports', async () => {
    const table = resumeToTable(sample, MARKDOWN_CODEC);
    const fromCsv = await importResumeFile(file(toCsv(table), 'finance.csv'));
    const { bytes } = await writeXlsx(table);
    const fromXlsx = await importResumeFile(file(bytes as BlobPart, 'finance.xlsx'));
    for (const { doc, warnings } of [fromCsv, fromXlsx]) {
      expect(warnings).toEqual([]);
      expect(doc.name).toBe('Finance');
      expect(doc.layout.pageSize).toBe(sample.layout.pageSize);
      expect(doc.sections.map((s) => s.title)).toEqual(sample.sections.map((s) => s.title));
      expect(doc.sections[0]?.items[0]?.descriptionHtml).toBe(sample.sections[0]?.items[0]?.descriptionHtml);
    }
  });

  it('imports Markdown', async () => {
    const { doc, format } = await importResumeFile(file(resumeToMarkdown(sample), 'finance.md'));
    expect(format).toBe('markdown');
    expect(doc.profile.fullName).toBe(sample.profile.fullName);
  });

  it('explains what went wrong', async () => {
    await expect(importResumeFile(file('', 'x.json'))).rejects.toThrow('empty');
    await expect(importResumeFile(file('{nope', 'x.json'))).rejects.toThrow('not valid JSON');
    await expect(importResumeFile(file('{"name":"x"}', 'x.json'))).rejects.toThrow('not an Open Vitae resume');
    await expect(importResumeFile(file('%PDF-1.7', 'x.pdf'))).rejects.toThrow(ImportError);
    await expect(importResumeFile(file('a,"b', 'x.csv'))).rejects.toThrow('quote');
  });
});

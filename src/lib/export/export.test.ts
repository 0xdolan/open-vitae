import { describe, expect, it } from 'vitest';

import { fileTimestamp, formatDateTime, formatRelative } from '@/lib/datetime';
import { createResumeFromSample } from '@/samples';

import { exportFileName, slugify } from './file-name';
import { createJsonExport, EXPORT_FORMAT } from './json';

describe('slugify', () => {
  it('makes readable, safe names in any script', () => {
    expect(slugify('Maya Okafor')).toBe('maya-okafor');
    expect(slugify('  Senior / Lead: Engineer!  ')).toBe('senior-lead-engineer');
    expect(slugify('رزومه جدید')).toBe('رزومه-جدید');
    expect(slugify('***')).toBe('resume');
  });

  it('limits the length', () => {
    expect(slugify('a'.repeat(100)).length).toBe(60);
  });
});

describe('dates', () => {
  it('builds file-safe local timestamps', () => {
    expect(fileTimestamp(new Date(2026, 10, 14, 19, 5, 3))).toBe('2026-11-14_19-05-03');
  });

  it('formats full human-readable date and time', () => {
    const text = formatDateTime('2026-11-14T19:05:23Z', 'en-GB');
    expect(text).toContain('2026');
    expect(text).toContain('November');
    expect(text).toMatch(/\d{2}:\d{2}:\d{2}/);
  });

  it('formats relative time', () => {
    const now = new Date('2026-11-14T19:10:00Z');
    expect(formatRelative('2026-11-14T19:09:58Z', now, 'en')).toBe('now');
    expect(formatRelative('2026-11-14T19:07:00Z', now, 'en')).toBe('3 minutes ago');
    expect(formatRelative('2026-11-13T19:10:00Z', now, 'en')).toBe('yesterday');
  });
});

describe('exportFileName', () => {
  it('includes the name, version and save time', () => {
    const name = exportFileName('Maya Okafor', 12, new Date(2026, 10, 14, 19, 5, 23), 'json');
    expect(name).toBe('maya-okafor-v12-2026-11-14_19-05-23.json');
  });

  it('works without a version', () => {
    expect(exportFileName('CV', null, new Date(2026, 0, 2, 3, 4, 5), '.pdf')).toBe('cv-2026-01-02_03-04-05.pdf');
  });
});

describe('createJsonExport', () => {
  it('wraps the resume with format, app and version details', () => {
    const doc = createResumeFromSample('tech');
    const version = {
      id: 'v1',
      resumeId: doc.id,
      number: 3,
      savedAt: '2026-11-14T19:05:23.000Z',
      reason: 'autosave' as const,
      note: '',
      exportedAt: null,
      bytes: 100,
      contentHash: 'x',
      photoKey: null,
    };
    const file = createJsonExport(doc, version, '1.2.3', new Date('2026-11-14T20:00:00Z'));
    const parsed = JSON.parse(file.content) as Record<string, unknown>;

    expect(file.mimeType).toBe('application/json');
    expect(file.fileName).toMatch(/^maya-okafor-v3-2026-11-1\d_\d{2}-05-23\.json$/);
    expect(parsed).toMatchObject({
      format: EXPORT_FORMAT,
      formatVersion: 1,
      app: 'Open Vitae 1.2.3',
      exportedAt: '2026-11-14T20:00:00.000Z',
      version: { number: 3, savedAt: '2026-11-14T19:05:23.000Z' },
    });
    expect(typeof (parsed.version as Record<string, unknown>).savedAtText).toBe('string');
    expect((parsed.resume as { id: string }).id).toBe(doc.id);
  });
});

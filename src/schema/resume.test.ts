import { describe, expect, it } from 'vitest';

import { migrateResume, MigrationError } from '@/lib/migrations';
import { createBlankResume } from '@/lib/resume-factory';
import { parseResume } from '@/lib/resume-parse';
import { createResumeFromSample } from '@/samples';

import { resumeSchema, type ResumeDocument } from './resume';

function sample(): ResumeDocument {
  return createResumeFromSample('tech');
}

describe('resume schema', () => {
  it('accepts a sample resume', () => {
    expect(resumeSchema.safeParse(sample()).success).toBe(true);
  });

  it('rejects colours that could inject CSS', () => {
    const doc = sample();
    const bad = { ...doc, layout: { ...doc.layout, accentColor: 'red; background: url(x)' } };
    expect(resumeSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects font names that could inject CSS', () => {
    const doc = sample();
    const bad = { ...doc, layout: { ...doc.layout, fontFamily: 'Arial"; } body { display:none' } };
    expect(resumeSchema.safeParse(bad).success).toBe(false);
  });

  it('stores typed link text without judging it (links are checked when drawn)', () => {
    const doc = sample();
    const typed = { ...doc, profile: { ...doc.profile, website: 'javascript:alert(1)' } };
    expect(parseResume(typed).ok).toBe(true);
  });

  it('reports the field path of structural errors', () => {
    const doc = sample();
    const result = parseResume({ ...doc, layout: { ...doc.layout, accentColor: 'red' } });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('layout.accentColor');
  });

  it('limits the length of typed text', () => {
    const doc = sample();
    expect(resumeSchema.safeParse({ ...doc, profile: { ...doc.profile, email: 'a'.repeat(300) } }).success).toBe(false);
  });

  it('rejects photos that are not PNG, JPEG or WebP data URLs', () => {
    const doc = sample();
    const bad = {
      ...doc,
      photo: { dataUrl: 'data:image/svg+xml;base64,PHN2Zz4=', align: 'start', shape: 'circle', widthMm: 30 },
    };
    expect(resumeSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects duplicate ids', () => {
    const doc = sample();
    const [first, second] = doc.sections;
    if (!first || !second) throw new Error('sample needs two sections');
    const bad = { ...doc, sections: [first, { ...second, id: first.id }] };
    expect(resumeSchema.safeParse(bad).success).toBe(false);
  });

  it('drops unknown fields instead of storing them', () => {
    const result = resumeSchema.safeParse({ ...createBlankResume('x'), injected: '<script>' });
    expect(result.success).toBe(true);
    if (result.success) expect('injected' in result.data).toBe(false);
  });

  it('allows an empty name while renaming', () => {
    expect(resumeSchema.safeParse({ ...createBlankResume('x'), name: '' }).success).toBe(true);
  });
});

describe('migrateResume', () => {
  it('passes the current version through', () => {
    const doc = createBlankResume('x');
    expect(migrateResume(doc)).toEqual(doc);
  });

  it('runs migrations in order', () => {
    const migrations = {
      1: (d: Record<string, unknown>) => ({ ...d, added: 'v2' }),
      2: (d: Record<string, unknown>) => ({ ...d, added: `${String(d.added)}-v3` }),
    };
    expect(migrateResume({ schemaVersion: 1 }, migrations, 3)).toEqual({
      schemaVersion: 3,
      added: 'v2-v3',
    });
  });

  it('refuses files from a newer version of the app', () => {
    expect(() => migrateResume({ schemaVersion: 99 })).toThrow(MigrationError);
  });

  it.each([null, [], 'text', { schemaVersion: '1' }, { schemaVersion: 0 }, {}])(
    'refuses invalid input %j',
    (value) => {
      expect(() => migrateResume(value)).toThrow(MigrationError);
    },
  );

  it('reports a gap in the migration chain', () => {
    expect(() => migrateResume({ schemaVersion: 1 }, {}, 2)).toThrow(/No upgrade path/);
  });
});

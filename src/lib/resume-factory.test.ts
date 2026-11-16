import { describe, expect, it } from 'vitest';

import { createResumeFromSample } from '@/samples';

import {
  buildResume,
  cloneResume,
  createBlankResume,
  sortByUpdated,
  touch,
  uniqueName,
} from './resume-factory';

const NOW = new Date('2026-01-15T10:00:00.000Z');

function allIds(doc: ReturnType<typeof createBlankResume>): string[] {
  return [
    doc.id,
    ...doc.profile.links.map((l) => l.id),
    ...doc.sections.flatMap((s) => [s.id, ...s.items.map((i) => i.id)]),
  ];
}

describe('createBlankResume', () => {
  it('builds an A4, LTR, Manrope resume with three empty sections', () => {
    const doc = createBlankResume('Mine', 'ltr', NOW);
    expect(doc.layout).toMatchObject({
      pageSize: 'a4',
      direction: 'ltr',
      fontFamily: 'Manrope',
      pageBreaks: 'smart',
    });
    expect(doc.language).toBe('en');
    expect(doc.sections.map((s) => s.kind)).toEqual(['experience', 'education', 'skills']);
    expect(doc.sections[0]?.title).toBe('Experience');
    expect(doc.createdAt).toBe(NOW.toISOString());
  });

  it('builds an RTL resume with Sahel and Persian section titles', () => {
    const doc = createBlankResume('رزومه', 'rtl', NOW);
    expect(doc.layout).toMatchObject({ direction: 'rtl', fontFamily: 'Sahel' });
    expect(doc.language).toBe('fa');
    expect(doc.sections[0]?.title).toBe('سوابق کاری');
  });
});

describe('buildResume', () => {
  it('fills missing item fields with empty values', () => {
    const doc = buildResume({
      name: 'x',
      sections: [{ kind: 'custom', items: [{ title: 'Only a title' }] }],
    });
    expect(doc.sections[0]?.items[0]).toMatchObject({
      title: 'Only a title',
      subtitle: '',
      descriptionHtml: '',
      visible: true,
    });
  });

  it('throws on invalid input', () => {
    expect(() => buildResume({ name: 'x', layout: { accentColor: 'nope' } })).toThrow();
  });
});

describe('cloneResume', () => {
  it('copies content with completely new ids', () => {
    const original = createResumeFromSample('cloud');
    const copy = cloneResume(original, 'Copy', NOW);
    expect(copy.name).toBe('Copy');
    expect(copy.profile.fullName).toBe(original.profile.fullName);
    expect(copy.sections).toHaveLength(original.sections.length);

    const originalIds = new Set(allIds(original));
    for (const id of allIds(copy)) {
      expect(originalIds.has(id)).toBe(false);
    }
  });

  it('does not share objects with the original', () => {
    const original = createResumeFromSample('tech');
    const copy = cloneResume(original, 'Copy');
    copy.sections[0]?.items.pop();
    expect(original.sections[0]?.items.length).toBeGreaterThan(copy.sections[0]?.items.length ?? 0);
  });
});

describe('helpers', () => {
  it('touch updates only the timestamp', () => {
    const doc = createBlankResume('x', 'ltr', NOW);
    const later = new Date('2026-02-01T00:00:00.000Z');
    expect(touch(doc, later)).toEqual({ ...doc, updatedAt: later.toISOString() });
  });

  it('uniqueName appends the first free number', () => {
    expect(uniqueName('CV', [])).toBe('CV');
    expect(uniqueName('CV', ['CV'])).toBe('CV (2)');
    expect(uniqueName('CV', ['CV', 'CV (2)'])).toBe('CV (3)');
  });

  it('sortByUpdated puts the newest first', () => {
    const a = createBlankResume('a', 'ltr', new Date('2026-01-01T00:00:00Z'));
    const b = createBlankResume('b', 'ltr', new Date('2026-03-01T00:00:00Z'));
    expect(sortByUpdated([a, b]).map((d) => d.name)).toEqual(['b', 'a']);
  });
});

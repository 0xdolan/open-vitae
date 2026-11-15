import { describe, expect, it } from 'vitest';

import { buildResume } from '@/lib/resume-factory';
import { createResumeFromSample } from '@/samples';

import { guessSectionKind } from './section-kind';
import { resumeToTable, tableToResume, TABLE_COLUMNS, type TextCodec } from './table';

/** Keeps text as it is, so the table logic is tested on its own. */
const identity: TextCodec = { toText: (html) => html, toHtml: (text) => text };

describe('guessSectionKind', () => {
  it('recognises default titles in every language and common English headings', () => {
    expect(guessSectionKind('Experience')).toBe('experience');
    expect(guessSectionKind('Work Experience')).toBe('experience');
    expect(guessSectionKind('Licenses & Certifications')).toBe('certifications');
    expect(guessSectionKind('سوابق کاری')).toBe('experience');
    expect(guessSectionKind('الخبرة العملية')).toBe('experience');
    expect(guessSectionKind('خوێندن')).toBe('education');
    expect(guessSectionKind('Side quests')).toBe('custom');
  });
});

describe('table format', () => {
  it('round-trips a sample resume', () => {
    const doc = createResumeFromSample('tech', 'Tech');
    const hidden = {
      ...doc,
      sections: doc.sections.map((s, i) => (i === 1 ? { ...s, visible: false } : s)),
    };
    const table = resumeToTable(hidden, identity);
    expect(table[0]).toEqual([...TABLE_COLUMNS]);

    const { input, warnings } = tableToResume(table, identity, 'Fallback');
    expect(warnings).toEqual([]);
    const back = buildResume(input);
    expect(back.name).toBe('Tech');
    expect(back.profile).toMatchObject({
      fullName: doc.profile.fullName,
      email: doc.profile.email,
      summaryHtml: doc.profile.summaryHtml,
    });
    expect(back.profile.links.map((l) => [l.label, l.url])).toEqual(doc.profile.links.map((l) => [l.label, l.url]));
    expect(back.layout).toMatchObject({ pageSize: doc.layout.pageSize, fontFamily: doc.layout.fontFamily, accentColor: doc.layout.accentColor });
    expect(back.sections.map((s) => [s.kind, s.title, s.visible])).toEqual(
      hidden.sections.map((s) => [s.kind, s.title, s.visible]),
    );
    const strip = (s: (typeof doc.sections)[number]) =>
      s.items.map(({ title, subtitle, dateRange, location, url, descriptionHtml }) => ({ title, subtitle, dateRange, location, url, descriptionHtml }));
    expect(back.sections.map(strip)).toEqual(doc.sections.map(strip));
  });

  it('round-trips a right-to-left resume with its language and direction', () => {
    const doc = createResumeFromSample('kurdish', 'کوردی');
    const back = buildResume(tableToResume(resumeToTable(doc, identity), identity, 'x').input);
    expect(back).toMatchObject({ language: 'ckb', layout: { direction: 'rtl', fontFamily: 'Estedad' } });
    expect(back.sections[0]?.title).toBe('ئەزموونی کار');
  });

  it('accepts a hand-made sheet: any column order, no Type column, guessed kinds', () => {
    const { input, warnings } = tableToResume(
      [
        ['title', 'dates', 'section', 'details'],
        ['Barista', '2019 – 2020', 'Work history', 'Made coffee'],
        ['BA History', '2015 – 2019', 'Education', ''],
      ],
      identity,
      'Imported',
    );
    expect(warnings).toEqual([]);
    const doc = buildResume(input);
    expect(doc.name).toBe('Imported');
    expect(doc.sections.map((s) => [s.kind, s.title, s.items[0]?.title, s.items[0]?.dateRange])).toEqual([
      ['experience', 'Work history', 'Barista', '2019 – 2020'],
      ['education', 'Education', 'BA History', '2015 – 2019'],
    ]);
  });

  it('skips invalid settings and unknown rows with a warning instead of failing', () => {
    const { input, warnings } = tableToResume(
      [
        ['Type', 'Title', 'Details'],
        ['setting', 'Page size', 'napkin'],
        ['setting', 'Accent colour', 'red; background:url(x)'],
        ['setting', 'Font', 'Sahel'],
        ['planet', 'Mars', ''],
        ['profile', 'Shoe size', '44'],
      ],
      identity,
      'x',
    );
    expect(warnings).toHaveLength(4);
    expect(input.layout).toEqual({ fontFamily: 'Sahel' });
    expect(() => buildResume(input)).not.toThrow();
  });
});

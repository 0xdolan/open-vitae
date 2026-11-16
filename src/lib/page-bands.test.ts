import { describe, expect, it } from 'vitest';

import { createBlankResume } from '@/lib/resume-factory';
import { resumeSchema } from '@/schema/resume';

import { formatPageBand, newPageBand, pageBandFor } from './page-bands';

describe('page header and footer', () => {
  it('fills in the page number and page count', () => {
    expect(formatPageBand('Page {page} of {pages}', 2, 3, undefined)).toBe('Page 2 of 3');
    expect(formatPageBand('{page}/{pages} · {page}', 1, 4, undefined)).toBe('1/4 · 1');
  });

  it('writes digits in the resume digit set', () => {
    expect(formatPageBand('{page} / {pages}', 2, 12, 'arab')).toBe('٢ / ١٢');
    expect(formatPageBand('2026 · {page}', 3, 3, 'arabext')).toBe('۲۰۲۶ · ۳');
  });

  it('skips bands that are off, empty or hidden on the first page', () => {
    const layout = createBlankResume('Test').layout;
    expect(pageBandFor(layout, 'footer', 1)).toBeUndefined();
    const footer = { ...newPageBand(), firstPage: false };
    expect(pageBandFor({ ...layout, footer }, 'footer', 1)).toBeUndefined();
    expect(pageBandFor({ ...layout, footer }, 'footer', 2)).toEqual(footer);
    expect(
      pageBandFor({ ...layout, footer: { ...footer, text: '  ' } }, 'footer', 2),
    ).toBeUndefined();
    expect(
      pageBandFor({ ...layout, footer: { ...footer, enabled: false } }, 'footer', 2),
    ).toBeUndefined();
  });

  it('is optional in the schema and validated when present', () => {
    const doc = createBlankResume('Test');
    expect(resumeSchema.safeParse(doc).success).toBe(true);
    const withBands = {
      ...doc,
      layout: { ...doc.layout, header: newPageBand(), footer: newPageBand() },
    };
    expect(resumeSchema.safeParse(withBands).success).toBe(true);
    const tooLong = {
      ...doc,
      layout: { ...doc.layout, footer: { ...newPageBand(), text: 'x'.repeat(201) } },
    };
    expect(resumeSchema.safeParse(tooLong).success).toBe(false);
    const badAlign = {
      ...doc,
      layout: { ...doc.layout, footer: { ...newPageBand(), align: 'left' } },
    };
    expect(resumeSchema.safeParse(badAlign).success).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';

import {
  DEFAULT_PAGE_SIZE,
  getPageDimensionsMm,
  getPageSize,
  isPageSizeId,
  mmToPx,
  PAGE_SIZE_IDS,
  PAGE_SIZES,
} from './page-sizes';

describe('page sizes', () => {
  it('defaults to A4', () => {
    expect(DEFAULT_PAGE_SIZE).toBe('a4');
    expect(getPageSize('a4')).toMatchObject({ widthMm: 210, heightMm: 297 });
  });

  it('has exactly one entry per id, all in portrait', () => {
    const ids = PAGE_SIZES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect([...ids].sort()).toEqual([...PAGE_SIZE_IDS].sort());
    for (const size of PAGE_SIZES) {
      expect(size.heightMm).toBeGreaterThan(size.widthMm);
    }
  });

  it('recognises valid ids only', () => {
    expect(isPageSizeId('letter')).toBe(true);
    expect(isPageSizeId('a0')).toBe(false);
  });

  it('swaps dimensions for landscape', () => {
    expect(getPageDimensionsMm('a4', 'landscape')).toEqual({ widthMm: 297, heightMm: 210 });
  });

  it('converts millimetres to pixels', () => {
    // A4 at 300 DPI is the well-known 2480 x 3508.
    expect(mmToPx(210, 300)).toBe(2480);
    expect(mmToPx(297, 300)).toBe(3508);
    expect(mmToPx(25.4, 96)).toBe(96);
  });

  it('rejects out-of-range input', () => {
    expect(() => mmToPx(-1)).toThrow(RangeError);
    expect(() => mmToPx(210, 10)).toThrow(RangeError);
    expect(() => mmToPx(210, 5000)).toThrow(RangeError);
  });
});

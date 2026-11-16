import { describe, expect, it } from 'vitest';

import { contentBoxMm, pageBoxMm, pageWidthPx } from './page-geometry';

describe('page geometry', () => {
  it('gives the sheet and the content area inside the margins', () => {
    expect(pageBoxMm({ pageSize: 'a4', orientation: 'portrait', marginMm: 15 })).toEqual({
      widthMm: 210,
      heightMm: 297,
    });
    expect(contentBoxMm({ pageSize: 'a4', orientation: 'landscape', marginMm: 15 })).toEqual({
      widthMm: 267,
      heightMm: 180,
      marginMm: 15,
    });
  });

  it('shrinks margins that would leave no room for content', () => {
    // A6 is 105 mm wide: 50 mm margins would leave 5 mm, so they become 42.5 mm.
    expect(contentBoxMm({ pageSize: 'a6', orientation: 'portrait', marginMm: 50 })).toEqual({
      widthMm: 20,
      heightMm: 63,
      marginMm: 42.5,
    });
  });

  it('converts the sheet width to CSS pixels', () => {
    expect(Math.round(pageWidthPx({ pageSize: 'a4', orientation: 'portrait', marginMm: 0 }))).toBe(
      794,
    );
  });
});

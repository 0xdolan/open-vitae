import { describe, expect, it } from 'vitest';

import { filterClasses, filterStyle, isAllowedImageSource } from './css-filter';
import { searchEmoji, ALL_EMOJI } from './emoji';
import { findMatches, nextMatchIndex } from './find';
import { fitWithin, isAcceptedImageType } from './image';

describe('filterStyle', () => {
  it('keeps the formatting the editor produces', () => {
    expect(filterStyle('color: #b91c1c; background-color: rgb(254, 240, 138)')).toBe(
      'color: #b91c1c; background-color: rgb(254, 240, 138)',
    );
    expect(filterStyle('font-size: 12pt; line-height: 1.5; text-align: center')).toBe(
      'font-size: 12pt; line-height: 1.5; text-align: center',
    );
    expect(filterStyle('font-family: "Times New Roman", Tinos, serif')).toBe('font-family: "Times New Roman", Tinos, serif');
    expect(filterStyle('--ov-level: 3')).toBe('--ov-level: 3');
    expect(filterStyle('width: 50%; min-width: 25px')).toBe('width: 50%; min-width: 25px');
  });

  it('drops anything that could move, load or execute', () => {
    expect(filterStyle('position: fixed; top: 0')).toBe('');
    expect(filterStyle('background-image: url(https://evil.example/x.png)')).toBe('');
    expect(filterStyle('color: expression(alert(1))')).toBe('');
    // The harmless part survives; the attempt to break out is dropped.
    expect(filterStyle('font-family: x; } body { display: none')).toBe('font-family: x');
    expect(filterStyle('font-family: a(b)')).toBe('');
    expect(filterStyle('color: red')).toBe('');
    expect(filterStyle('--ov-level: 3; --other: 1')).toBe('--ov-level: 3');
  });

  it('ignores !important and odd spacing', () => {
    expect(filterStyle('  COLOR :  #000 !important ;;')).toBe('color: #000');
  });
});

describe('filterClasses', () => {
  it('keeps highlighting, language and layout classes only', () => {
    expect(filterClasses('hljs hljs-keyword language-ts ov-img-center')).toBe('hljs hljs-keyword language-ts ov-img-center');
    expect(filterClasses('fixed inset-0 z-50 hljs-string')).toBe('hljs-string');
    expect(filterClasses('ov-table-borderless ov-anything')).toBe('ov-table-borderless');
  });
});

describe('isAllowedImageSource', () => {
  it('accepts embedded raster images only', () => {
    expect(isAllowedImageSource('data:image/png;base64,iVBORw0KGgo=')).toBe(true);
    expect(isAllowedImageSource('data:image/webp;base64,UklGR')).toBe(true);
    expect(isAllowedImageSource('https://tracker.example/pixel.gif')).toBe(false);
    expect(isAllowedImageSource('data:image/svg+xml;base64,PHN2Zz4=')).toBe(false);
    expect(isAllowedImageSource('javascript:alert(1)')).toBe(false);
  });
});

describe('findMatches', () => {
  const chunks = [
    { text: 'Led the React migration. React rocks.', from: 1 },
    { text: 'react native', from: 50 },
  ];

  it('finds case-insensitive matches with document positions', () => {
    expect(findMatches(chunks, 'react')).toEqual([
      { from: 9, to: 14 },
      { from: 26, to: 31 },
      { from: 50, to: 55 },
    ]);
  });

  it('respects case and whole words', () => {
    expect(findMatches(chunks, 'React', { caseSensitive: true })).toHaveLength(2);
    expect(findMatches([{ text: 'cat category cat.', from: 0 }], 'cat', { wholeWord: true })).toEqual([
      { from: 0, to: 3 },
      { from: 13, to: 16 },
    ]);
  });

  it('works for Persian words and treats regex characters literally', () => {
    expect(findMatches([{ text: 'مهندس نرم‌افزار، مهندس', from: 0 }], 'مهندس', { wholeWord: true })).toHaveLength(2);
    expect(findMatches([{ text: 'C++ and C#', from: 0 }], 'C++')).toEqual([{ from: 0, to: 3 }]);
    expect(findMatches(chunks, '')).toEqual([]);
  });

  it('picks the next match after a position, wrapping around', () => {
    const matches = findMatches(chunks, 'react');
    expect(nextMatchIndex(matches, 10)).toBe(1);
    expect(nextMatchIndex(matches, 100)).toBe(0);
    expect(nextMatchIndex([], 0)).toBe(-1);
  });
});

describe('images', () => {
  it('fits large images inside the limit without stretching small ones', () => {
    expect(fitWithin(4000, 3000, 1600)).toEqual({ width: 1600, height: 1200 });
    expect(fitWithin(1000, 3000, 1600)).toEqual({ width: 533, height: 1600 });
    expect(fitWithin(800, 600, 1600)).toEqual({ width: 800, height: 600 });
    expect(fitWithin(0, 10, 1600)).toEqual({ width: 0, height: 0 });
  });

  it('accepts common raster formats only', () => {
    expect(isAcceptedImageType('image/jpeg')).toBe(true);
    expect(isAcceptedImageType('image/svg+xml')).toBe(false);
  });
});

describe('searchEmoji', () => {
  it('matches names and keywords', () => {
    expect(searchEmoji('graduation').map((e) => e.char)).toContain('🎓');
    const security = searchEmoji('security').map((e) => e.char);
    expect(security).toContain('🔒');
    expect(security).toContain('🛡️');
    expect(searchEmoji('')).toHaveLength(ALL_EMOJI.length);
    expect(searchEmoji('zzzz')).toEqual([]);
  });

  it('has no duplicate emoji', () => {
    const chars = ALL_EMOJI.map((e) => e.char);
    expect(new Set(chars).size).toBe(chars.length);
  });
});

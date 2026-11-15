// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import { joinRichPieces, splitRichHtml } from './rich-blocks';

/** Remove our markers so output can be compared with the input. */
const unmark = (html: string) => html.replace(/ data-ov-b="[^"]*"/g, '');

describe('splitRichHtml', () => {
  it('makes one piece per block and one per top-level list item', () => {
    const pieces = splitRichHtml('<p>Intro</p><ul><li>One</li><li>Two<ul><li>Nested</li></ul></li></ul><h3>End</h3>', 'body:x');
    expect(pieces.map((p) => p.key)).toEqual(['body:x:0', 'body:x:1', 'body:x:2', 'body:x:3']);
    expect(pieces[0]?.html).toBe('<p data-ov-b="body:x:0">Intro</p>');
    expect(pieces[2]?.html).toContain('Nested');
    expect(pieces[1]?.list).toMatchObject({ id: 1, number: 1 });
  });

  it('joins all pieces back into the original HTML', () => {
    const html = '<p>Intro</p><ol class="a" start="3"><li>One</li><li>Two</li></ol><table><tbody><tr><td>x</td></tr></tbody></table>';
    expect(unmark(joinRichPieces(splitRichHtml(html, 's')))).toBe(html);
  });

  it('keeps counting when a numbered list continues on another page', () => {
    const pieces = splitRichHtml('<ol><li>A</li><li>B</li><li>C</li></ol>', 's');
    expect(unmark(joinRichPieces(pieces.slice(0, 2)))).toBe('<ol><li>A</li><li>B</li></ol>');
    expect(unmark(joinRichPieces(pieces.slice(2)))).toBe('<ol start="3"><li>C</li></ol>');
  });

  it('keeps separate lists separate', () => {
    const pieces = splitRichHtml('<ul><li>A</li></ul><ul><li>B</li></ul>', 's');
    expect(unmark(joinRichPieces(pieces))).toBe('<ul><li>A</li></ul><ul><li>B</li></ul>');
  });

  it('wraps loose top-level text', () => {
    const pieces = splitRichHtml('Hello <strong>there</strong><p>Next</p>', 's');
    expect(pieces.map((p) => unmark(p.html))).toEqual(['<div>Hello <strong>there</strong></div>', '<p>Next</p>']);
  });

  it('returns nothing for empty input', () => {
    expect(splitRichHtml('', 's')).toEqual([]);
    expect(splitRichHtml('  \n ', 's')).toEqual([]);
  });

  it('keeps direction attributes and does not add anything but the marker', () => {
    const pieces = splitRichHtml('<p dir="rtl" style="text-align: center">سلام</p>', 's');
    expect(pieces[0]?.html).toBe('<p dir="rtl" style="text-align: center" data-ov-b="s:0">سلام</p>');
  });
});

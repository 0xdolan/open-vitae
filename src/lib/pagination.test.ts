import { describe, expect, it } from 'vitest';

import { createBlankResume } from '@/lib/resume-factory';
import type { ResumeDocument } from '@/schema/resume';

import { describeBlocks, paginate, type FlowBlock, type MeasuredBlock } from './pagination';

/** Stack blocks of the given heights with a fixed gap between them. */
function stack(entries: readonly [key: string, height: number][], gap = 0): MeasuredBlock[] {
  let y = 0;
  return entries.map(([key, height], index) => {
    if (index > 0) y += gap;
    const block = { key, top: y, bottom: y + height };
    y += height;
    return block;
  });
}

/** One section "s1" with entries "a", "b", "c"; "b" has three description blocks. */
function doc(overrides: { sectionBreak?: boolean; itemBreak?: string } = {}): ResumeDocument {
  const base = createBlankResume('Test', 'ltr');
  const item = (id: string) => ({
    id,
    visible: true,
    title: id,
    subtitle: '',
    dateRange: '',
    location: '',
    url: '',
    descriptionHtml: '',
    ...(overrides.itemBreak === id ? { breakBefore: true } : {}),
  });
  return {
    ...base,
    sections: [
      {
        id: 's1',
        kind: 'experience',
        title: 'Experience',
        visible: true,
        breakBefore: overrides.sectionBreak ?? false,
        items: [item('a'), item('b'), item('c')],
      },
    ],
  };
}

const keysOf = (pages: readonly { keys: readonly string[] }[]) => pages.map((p) => p.keys.join(' '));

describe('describeBlocks', () => {
  it('recognises block kinds and keeps headings with what follows', () => {
    const blocks = describeBlocks(
      doc(),
      stack([
        ['header', 50],
        ['summary:0', 20],
        ['title:s1', 10],
        ['head:a', 10],
        ['head:b', 10],
        ['body:b:0', 10],
      ]),
    );
    expect(blocks.map((b) => b.kind)).toEqual([
      'header',
      'summary',
      'section-title',
      'item-head',
      'item-head',
      'item-body',
    ]);
    expect(blocks.map((b) => b.keepWithNext)).toEqual([false, false, true, false, true, false]);
    expect(blocks[5]).toMatchObject({ itemId: 'b', sectionId: 's1' });
  });

  it('marks the first block of a section or entry that should start a new page', () => {
    const measured = stack([
      ['header', 10],
      ['title:s1', 10],
      ['head:a', 10],
      ['head:b', 10],
      ['body:b:0', 10],
    ]);
    expect(describeBlocks(doc({ sectionBreak: true }), measured).map((b) => b.breakBefore)).toEqual([
      false,
      true,
      false,
      false,
      false,
    ]);
    expect(describeBlocks(doc({ itemBreak: 'b' }), measured).map((b) => b.breakBefore)).toEqual([
      false,
      false,
      false,
      true,
      false,
    ]);
  });

  it('moves a break before a section\'s first entry to before its heading', () => {
    const blocks = describeBlocks(
      doc({ itemBreak: 'a' }),
      stack([
        ['header', 10],
        ['title:s1', 10],
        ['head:a', 10],
        ['body:a:0', 10],
      ]),
    );
    expect(blocks.map((b) => b.breakBefore)).toEqual([false, true, false, false]);
  });

  it('never asks for a break before the very first block', () => {
    const blocks = describeBlocks(doc({ sectionBreak: true }), stack([['title:s1', 10], ['head:a', 10]]));
    expect(blocks[0]?.breakBefore).toBe(false);
  });
});

describe('paginate', () => {
  const blocksFor = (entries: readonly [string, number][], d = doc()): FlowBlock[] =>
    describeBlocks(d, stack(entries));

  it('keeps everything on one page when it fits', () => {
    const pages = paginate(blocksFor([['header', 30], ['title:s1', 10], ['head:a', 10]]), {
      pageHeight: 100,
      mode: 'smart',
    });
    expect(keysOf(pages)).toEqual(['header title:s1 head:a']);
    expect(pages[0]).toMatchObject({ manualStart: false, tooTall: false, continued: false });
  });

  it('returns one empty page for an empty resume', () => {
    expect(paginate([], { pageHeight: 100, mode: 'smart' })).toEqual([
      { keys: [], manualStart: false, tooTall: false, continued: false },
    ]);
  });

  it('never leaves a section heading or entry title alone at the bottom of a page', () => {
    // Page holds 100px. The heading would fit at 90-100 but its entry would not.
    const pages = paginate(blocksFor([['header', 90], ['title:s1', 10], ['head:a', 10]]), {
      pageHeight: 100,
      mode: 'smart',
    });
    expect(keysOf(pages)).toEqual(['header', 'title:s1 head:a']);

    const entry = paginate(
      blocksFor([
        ['header', 85],
        ['head:b', 10],
        ['body:b:0', 10],
      ]),
      { pageHeight: 100, mode: 'smart' },
    );
    expect(keysOf(entry)).toEqual(['header', 'head:b body:b:0']);
  });

  it('prefers breaking between entries over splitting an entry when little space is lost', () => {
    const pages = paginate(
      blocksFor([
        ['header', 20],
        ['title:s1', 10],
        ['head:a', 50],
        ['head:b', 10],
        ['body:b:0', 5],
        ['body:b:1', 20],
      ]),
      { pageHeight: 100, mode: 'smart' },
    );
    // Splitting b after its first line would fill 95px; moving all of b leaves 20px empty.
    expect(keysOf(pages)).toEqual(['header title:s1 head:a', 'head:b body:b:0 body:b:1']);
  });

  it('splits a long entry rather than leaving most of a page empty', () => {
    const pages = paginate(
      blocksFor([
        ['header', 20],
        ['head:b', 10],
        ['body:b:0', 30],
        ['body:b:1', 30],
        ['body:b:2', 30],
      ]),
      { pageHeight: 100, mode: 'smart' },
    );
    expect(keysOf(pages)).toEqual(['header head:b body:b:0 body:b:1', 'body:b:2']);
  });

  it('counts the gap above the first block of a page', () => {
    // Each block is 30px with a 20px gap: 30 + 20 + 30 = 80 fits, a third would need 130.
    const pages = paginate(
      describeBlocks(
        doc(),
        stack(
          [
            ['head:a', 30],
            ['head:b', 30],
            ['head:c', 30],
          ],
          20,
        ),
      ),
      { pageHeight: 100, mode: 'smart' },
    );
    expect(keysOf(pages)).toEqual(['head:a head:b', 'head:c']);
  });

  it('honours manual breaks in smart mode', () => {
    const pages = paginate(blocksFor([['header', 10], ['title:s1', 10], ['head:a', 10]], doc({ sectionBreak: true })), {
      pageHeight: 1000,
      mode: 'smart',
    });
    expect(keysOf(pages)).toEqual(['header', 'title:s1 head:a']);
    expect(pages[1]?.manualStart).toBe(true);
  });

  it('in manual mode breaks only where asked, and carries overflow onto a continued page', () => {
    const entries: [string, number][] = [
      ['header', 90],
      ['title:s1', 10],
      ['head:a', 10],
      ['head:b', 10],
    ];
    const manual = paginate(blocksFor(entries), { pageHeight: 100, mode: 'manual' });
    // No keep-with-next in manual mode: the page is simply filled.
    expect(keysOf(manual)).toEqual(['header title:s1', 'head:a head:b']);
    expect(manual.map((p) => p.continued)).toEqual([false, true]);

    const withBreak = paginate(blocksFor(entries, doc({ itemBreak: 'b' })), { pageHeight: 1000, mode: 'manual' });
    expect(keysOf(withBreak)).toEqual(['header title:s1 head:a', 'head:b']);
    expect(withBreak.map((p) => [p.manualStart, p.continued])).toEqual([
      [false, false],
      [true, false],
    ]);
  });

  it('puts a block taller than a page on its own page and flags it', () => {
    const pages = paginate(blocksFor([['header', 10], ['head:a', 250], ['head:b', 10]]), {
      pageHeight: 100,
      mode: 'smart',
    });
    expect(keysOf(pages)).toEqual(['header', 'head:a', 'head:b']);
    expect(pages.map((p) => p.tooTall)).toEqual([false, true, false]);
  });

  it('tolerates sub-pixel rounding', () => {
    const pages = paginate(blocksFor([['header', 50], ['head:a', 50.3]]), { pageHeight: 100, mode: 'smart' });
    expect(pages).toHaveLength(1);
  });
});

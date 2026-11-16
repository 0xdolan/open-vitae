import type { PageBreakMode } from '@/config/layout';
import type { ResumeDocument } from '@/schema/resume';

/**
 * Pagination works on "blocks": the smallest pieces of a resume that are never
 * cut across two pages. The renderer marks each one with `data-ov-b="<key>"`:
 *
 *   header              name, headline and contact line
 *   summary:<n>         one paragraph, heading, table or list item of the summary
 *   title:<sectionId>   a section heading
 *   head:<itemId>       an entry's title, date and subtitle
 *   body:<itemId>:<n>   one paragraph, table or list item of an entry's description
 *
 * The preview measures the blocks once, this module decides where pages end,
 * and each page then renders only its own blocks. Nothing here touches the DOM.
 */

export type BlockKind = 'header' | 'summary' | 'section-title' | 'item-head' | 'item-body';

export interface MeasuredBlock {
  readonly key: string;
  /** Distance from the top of the content, in CSS pixels. */
  readonly top: number;
  readonly bottom: number;
}

export interface FlowBlock extends MeasuredBlock {
  readonly kind: BlockKind;
  readonly sectionId?: string;
  readonly itemId?: string;
  /** Never end a page right after this block. */
  readonly keepWithNext: boolean;
  /** The person asked for a new page to start here. */
  readonly breakBefore: boolean;
}

export interface PageSlice {
  /** Keys of the blocks on this page, in order. */
  readonly keys: readonly string[];
  /** The page starts here because of a manual break. */
  readonly manualStart: boolean;
  /** A single block is taller than the page and will be cut off. */
  readonly tooTall: boolean;
  /** Manual mode: the previous page was full, so the content continued here automatically. */
  readonly continued: boolean;
}

export interface PaginateOptions {
  /** Height available for content on one page (page height minus margins), in CSS pixels. */
  readonly pageHeight: number;
  readonly mode: PageBreakMode;
}

/** Rounding in layout can make a block that exactly fits look a fraction too tall. */
const TOLERANCE_PX = 0.5;

/** Relative cost of ending a page before each kind of block (smart mode). */
const BOUNDARY_COST: Readonly<Record<BlockKind, number>> = {
  header: 0,
  'section-title': 0,
  'item-head': 0.5,
  summary: 2,
  'item-body': 2,
};

/** How much one page-height of empty space weighs against the boundary costs. */
const WASTE_WEIGHT = 10;

/** Work out what kind each measured block is and which keep and break rules apply. */
export function describeBlocks(
  doc: ResumeDocument,
  measured: readonly MeasuredBlock[],
): FlowBlock[] {
  const sectionOfItem = new Map<string, string>();
  const sectionBreaks = new Set<string>();
  const itemBreaks = new Set<string>();
  for (const section of doc.sections) {
    if (section.breakBefore) sectionBreaks.add(section.id);
    for (const item of section.items) {
      sectionOfItem.set(item.id, section.id);
      if (item.breakBefore) itemBreaks.add(item.id);
    }
  }

  const parsed = measured.map((block): Omit<FlowBlock, 'keepWithNext' | 'breakBefore'> => {
    const [prefix = '', id = ''] = block.key.split(':');
    switch (prefix) {
      case 'title':
        return { ...block, kind: 'section-title', sectionId: id };
      case 'head':
        return { ...block, kind: 'item-head', itemId: id, sectionId: sectionOfItem.get(id) };
      case 'body':
        return { ...block, kind: 'item-body', itemId: id, sectionId: sectionOfItem.get(id) };
      case 'summary':
        return { ...block, kind: 'summary' };
      default:
        return { ...block, kind: 'header' };
    }
  });

  const described = parsed.map((block, index) => {
    const previous = parsed[index - 1];
    const next = parsed[index + 1];
    const firstOfSection = block.sectionId !== undefined && previous?.sectionId !== block.sectionId;
    const firstOfItem = block.itemId !== undefined && previous?.itemId !== block.itemId;
    const keepWithNext =
      next !== undefined &&
      (block.kind === 'section-title' ||
        (block.kind === 'item-head' && next.itemId === block.itemId));
    const breakBefore =
      index > 0 &&
      ((firstOfSection && sectionBreaks.has(block.sectionId ?? '')) ||
        (firstOfItem && itemBreaks.has(block.itemId ?? '')));
    return { ...block, keepWithNext, breakBefore };
  });

  // A break before the first entry of a section belongs before the section
  // heading: move each break back over anything that must stay with it.
  for (let index = described.length - 1; index > 0; index -= 1) {
    const block = described[index];
    const previous = described[index - 1];
    if (block?.breakBefore && previous?.keepWithNext) {
      described[index] = { ...block, breakBefore: false };
      described[index - 1] = { ...previous, breakBefore: index - 1 > 0 };
    }
  }
  return described;
}

/** Cost of ending a page after `blocks[index]`; Infinity when not allowed. */
function boundaryCost(blocks: readonly FlowBlock[], index: number): number {
  const block = blocks[index];
  const next = blocks[index + 1];
  if (!block || !next) return 0;
  if (block.keepWithNext) return Number.POSITIVE_INFINITY;
  // The first block of a new section is as good a place to break as a section heading.
  if (next.sectionId !== undefined && next.sectionId !== block.sectionId) return 0;
  return BOUNDARY_COST[next.kind];
}

/**
 * Split blocks into pages.
 *
 * Smart: fill each page, but choose the break that balances empty space at the
 * bottom of the page against splitting things that belong together. Section
 * headings and entry titles always stay with what follows. Manual breaks are
 * honoured too.
 *
 * Manual: pages end only at manual breaks. If a page is too full, the content
 * carries on to a new page at the last block that fits, and that page is
 * marked as continued so the editor can suggest adding a break.
 */
export function paginate(blocks: readonly FlowBlock[], options: PaginateOptions): PageSlice[] {
  const height = Math.max(1, options.pageHeight);
  const pages: PageSlice[] = [];
  let start = 0;
  let continued = false;

  while (start < blocks.length) {
    const first = blocks[start];
    if (!first) break;
    // Measure from the end of the previous block, so the gap above the first
    // block on the page is counted. Rendering never needs more than this.
    const origin = start === 0 ? 0 : (blocks[start - 1]?.bottom ?? first.top);
    const fits = (index: number) => (blocks[index]?.bottom ?? 0) - origin <= height + TOLERANCE_PX;

    // The furthest block that fits, stopping before a manual break.
    let last = start;
    while (last + 1 < blocks.length && !blocks[last + 1]?.breakBefore && fits(last + 1)) {
      last += 1;
    }
    const tooTall = !fits(start);
    const endsAtManualBreak = last + 1 >= blocks.length || Boolean(blocks[last + 1]?.breakBefore);

    if (!endsAtManualBreak && options.mode === 'smart') {
      let best = last;
      let bestScore = Number.POSITIVE_INFINITY;
      for (let index = start; index <= last; index += 1) {
        const used = (blocks[index]?.bottom ?? 0) - origin;
        const score = ((height - used) / height) * WASTE_WEIGHT + boundaryCost(blocks, index);
        if (score < bestScore) {
          bestScore = score;
          best = index;
        }
      }
      last = best;
    }

    pages.push({
      keys: blocks.slice(start, last + 1).map((block) => block.key),
      manualStart: first.breakBefore,
      tooTall,
      continued,
    });
    continued = options.mode === 'manual' && !endsAtManualBreak;
    start = last + 1;
  }

  return pages.length > 0
    ? pages
    : [{ keys: [], manualStart: false, tooTall: false, continued: false }];
}

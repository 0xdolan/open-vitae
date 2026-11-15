/**
 * Splits rich text into the pieces pagination may put on different pages, and
 * joins any subset of them back into HTML.
 *
 * A piece is one top-level paragraph, heading, table, code block, quote or
 * rule, or one item of a top-level list. Nested lists stay with their item.
 * When pieces from the same list are joined they share one list element, and a
 * numbered list that continues on the next page keeps counting from where it
 * stopped.
 *
 * Input must already be sanitised. The only thing added is our own
 * `data-ov-b` attribute, which marks each piece for measuring.
 *
 * Browser only: uses <template> for parsing.
 */

export interface RichPiece {
  /** Unique key, `<prefix>:<n>`. */
  readonly key: string;
  /** The piece's own HTML, including the data-ov-b marker. */
  readonly html: string;
  /** Set for list items: which list they belong to. */
  readonly list?: {
    readonly id: number;
    /** The list element without children, e.g. `<ol class="x"></ol>`. */
    readonly shell: string;
    /** Number shown on this item when the list is numbered. */
    readonly number: number;
  };
}

export const BLOCK_ATTRIBUTE = 'data-ov-b';

function parse(html: string): DocumentFragment {
  const template = document.createElement('template');
  template.innerHTML = html;
  return template.content;
}

function isInline(node: Node): boolean {
  if (node.nodeType === Node.TEXT_NODE) return true;
  if (!(node instanceof Element)) return false;
  return [
    'A',
    'B',
    'BDI',
    'BR',
    'CODE',
    'EM',
    'I',
    'IMG',
    'MARK',
    'S',
    'SMALL',
    'SPAN',
    'STRONG',
    'SUB',
    'SUP',
    'U',
  ].includes(node.tagName);
}

function listStart(list: Element): number {
  const value = Number.parseInt(list.getAttribute('start') ?? '1', 10);
  return Number.isFinite(value) ? value : 1;
}

/** Split sanitised rich text into pieces keyed `<prefix>:0`, `<prefix>:1`, … */
export function splitRichHtml(html: string, prefix: string): RichPiece[] {
  const pieces: RichPiece[] = [];
  let inline: Node[] = [];
  let listId = 0;

  const add = (element: Element, list?: RichPiece['list']) => {
    const key = `${prefix}:${pieces.length}`;
    element.setAttribute(BLOCK_ATTRIBUTE, key);
    pieces.push({ key, html: element.outerHTML, list });
  };

  // Loose text and inline elements at the top level are wrapped in a <div>.
  const flushInline = () => {
    if (inline.some((node) => (node.textContent ?? '').trim() !== '' || node instanceof Element)) {
      const wrapper = document.createElement('div');
      for (const node of inline) wrapper.append(node.cloneNode(true));
      add(wrapper);
    }
    inline = [];
  };

  for (const node of Array.from(parse(html).childNodes)) {
    if (isInline(node)) {
      inline.push(node);
      continue;
    }
    flushInline();
    if (!(node instanceof Element)) continue;

    if (node.tagName === 'UL' || node.tagName === 'OL') {
      listId += 1;
      const shell = node.cloneNode(false) as Element;
      shell.removeAttribute('start');
      const first = listStart(node);
      const items = Array.from(node.children).filter((child) => child.tagName === 'LI');
      items.forEach((item, index) => {
        add(item.cloneNode(true) as Element, {
          id: listId,
          shell: shell.outerHTML,
          number: first + index,
        });
      });
      continue;
    }
    add(node.cloneNode(true) as Element);
  }
  flushInline();
  return pieces;
}

/** Join pieces back into HTML. Consecutive items of one list share a list element. */
export function joinRichPieces(pieces: readonly RichPiece[]): string {
  let out = '';
  let index = 0;
  while (index < pieces.length) {
    const piece = pieces[index];
    if (!piece) break;
    if (!piece.list) {
      out += piece.html;
      index += 1;
      continue;
    }
    const { id, shell, number } = piece.list;
    let items = '';
    while (pieces[index]?.list?.id === id) {
      items += pieces[index]?.html ?? '';
      index += 1;
    }
    const list = parse(shell).firstElementChild;
    if (!list) continue;
    if (list.tagName === 'OL' && number !== 1) list.setAttribute('start', String(number));
    list.innerHTML = items;
    out += list.outerHTML;
  }
  return out;
}

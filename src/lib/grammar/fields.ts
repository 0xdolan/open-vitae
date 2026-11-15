import { updateItem, updateProfile, updateSection } from '@/lib/document-ops';
import { sanitizeHtml } from '@/lib/sanitize';
import type { ResumeDocument } from '@/schema/resume';

/** One piece of resume text that can be checked and corrected. */
export interface GrammarField {
  /** Stable key, e.g. "profile.headline" or "item:<section>:<item>:descriptionHtml". */
  readonly id: string;
  readonly kind: 'plain' | 'html';
  readonly value: string;
  /** Where it lives, for labels and for writing a correction back. */
  readonly target:
    | { readonly type: 'profile'; readonly key: 'headline' | 'summaryHtml' }
    | { readonly type: 'section'; readonly sectionId: string }
    | {
        readonly type: 'item';
        readonly sectionId: string;
        readonly itemId: string;
        readonly key: 'title' | 'subtitle' | 'descriptionHtml';
      };
}

/**
 * Text worth checking, in page order. Names, places, dates, addresses and
 * links are left out: they are proper nouns and numbers, not prose.
 */
export function grammarFields(doc: ResumeDocument): GrammarField[] {
  const fields: GrammarField[] = [];
  const add = (field: GrammarField) => {
    if (field.value.trim() !== '') fields.push(field);
  };
  add({
    id: 'profile.headline',
    kind: 'plain',
    value: doc.profile.headline,
    target: { type: 'profile', key: 'headline' },
  });
  add({
    id: 'profile.summaryHtml',
    kind: 'html',
    value: doc.profile.summaryHtml,
    target: { type: 'profile', key: 'summaryHtml' },
  });
  for (const section of doc.sections) {
    if (!section.visible) continue;
    add({
      id: `section:${section.id}`,
      kind: 'plain',
      value: section.title,
      target: { type: 'section', sectionId: section.id },
    });
    for (const item of section.items) {
      if (!item.visible) continue;
      for (const key of ['title', 'subtitle', 'descriptionHtml'] as const) {
        add({
          id: `item:${section.id}:${item.id}:${key}`,
          kind: key === 'descriptionHtml' ? 'html' : 'plain',
          value: item[key],
          target: { type: 'item', sectionId: section.id, itemId: item.id, key },
        });
      }
    }
  }
  return fields;
}

const BLOCKS = new Set([
  'P',
  'LI',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'BLOCKQUOTE',
  'PRE',
  'TD',
  'TH',
  'TR',
  'DIV',
  'UL',
  'OL',
  'TABLE',
]);
const SKIP = new Set(['CODE', 'PRE']);

/** Text nodes of an HTML fragment in document order, skipping code. */
function textNodes(root: Node): Text[] {
  const nodes: Text[] = [];
  const walk = (node: Node, skipped: boolean) => {
    for (const child of node.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) {
        if (!skipped) nodes.push(child as Text);
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        walk(child, skipped || SKIP.has((child as Element).tagName));
      }
    }
  };
  walk(root, false);
  return nodes;
}

function parse(html: string): HTMLElement {
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');
  return doc.body;
}

/** Where a run of plain text came from: a text node and its start in the plain text. */
interface Piece {
  readonly node: number;
  readonly start: number;
  readonly length: number;
}

/**
 * Plain text of an HTML field, with block elements on their own lines so
 * sentences do not run together, and a map back to each text node.
 */
export function plainTextOf(html: string): {
  readonly text: string;
  readonly pieces: readonly Piece[];
} {
  const body = parse(html);
  const nodes = textNodes(body);
  const pieces: Piece[] = [];
  let text = '';
  nodes.forEach((node, index) => {
    // A new line before text that starts a new block.
    let element: Node | null = node.parentNode;
    let startsBlock = false;
    while (element && element !== body) {
      if (
        BLOCKS.has((element as Element).tagName) &&
        element.firstChild &&
        textNodes(element)[0] === node
      )
        startsBlock = true;
      element = element.parentNode;
    }
    if (startsBlock && text !== '' && !text.endsWith('\n')) text += '\n';
    pieces.push({ node: index, start: text.length, length: node.data.length });
    text += node.data;
  });
  return { text, pieces };
}

/** The text sent for one field. */
export function fieldText(field: GrammarField): string {
  return field.kind === 'plain' ? field.value : plainTextOf(field.value).text;
}

/**
 * Replace `length` characters at `offset` of the field's text. Returns the new
 * value, or null when the span crosses formatting (part bold, part not) and
 * should be fixed by hand.
 */
export function replaceInField(
  field: GrammarField,
  offset: number,
  length: number,
  replacement: string,
): string | null {
  if (field.kind === 'plain') {
    if (offset < 0 || offset + length > field.value.length) return null;
    return field.value.slice(0, offset) + replacement + field.value.slice(offset + length);
  }
  const body = parse(field.value);
  const nodes = textNodes(body);
  const { pieces } = plainTextOf(field.value);
  const piece = pieces.find((p) => offset >= p.start && offset + length <= p.start + p.length);
  const node = piece ? nodes[piece.node] : undefined;
  if (!piece || !node) return null;
  const local = offset - piece.start;
  node.data = node.data.slice(0, local) + replacement + node.data.slice(local + length);
  return sanitizeHtml(body.innerHTML);
}

/** Write a corrected value back into the resume. */
export function setFieldValue(
  doc: ResumeDocument,
  field: GrammarField,
  value: string,
): ResumeDocument {
  const target = field.target;
  if (target.type === 'profile') return updateProfile(doc, { [target.key]: value });
  if (target.type === 'section') return updateSection(doc, target.sectionId, { title: value });
  return updateItem(doc, target.sectionId, target.itemId, { [target.key]: value });
}

/** All fields joined into one text (one request), with each field's span. */
export function joinFields(fields: readonly GrammarField[]): {
  readonly text: string;
  readonly spans: readonly { readonly start: number; readonly end: number }[];
} {
  let text = '';
  const spans: { start: number; end: number }[] = [];
  for (const field of fields) {
    if (text !== '') text += '\n\n';
    const part = fieldText(field);
    spans.push({ start: text.length, end: text.length + part.length });
    text += part;
  }
  return { text, spans };
}

/** Which field a match in the joined text belongs to, and where in it; null if it crosses fields. */
export function locate(
  spans: readonly { readonly start: number; readonly end: number }[],
  offset: number,
  length: number,
): { readonly field: number; readonly offset: number } | null {
  const index = spans.findIndex((s) => offset >= s.start && offset + length <= s.end);
  const span = spans[index];
  return span ? { field: index, offset: offset - span.start } : null;
}

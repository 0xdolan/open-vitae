/**
 * Conversion between the simple rich text the samples use (paragraphs and
 * bullet lists) and plain text with "- " bullets. This powers the basic
 * description editor until the full rich text editor arrives in phase 4.
 */

const SIMPLE_TAGS: ReadonlySet<string> = new Set(['p', 'ul', 'li', 'br']);

const ENTITIES: Readonly<Record<string, string>> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code: string) => {
    if (code.startsWith('#x') || code.startsWith('#X')) return String.fromCodePoint(parseInt(code.slice(2), 16));
    if (code.startsWith('#')) return String.fromCodePoint(parseInt(code.slice(1), 10));
    return ENTITIES[code.toLowerCase()] ?? match;
  });
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** True when the HTML uses only paragraphs, bullet lists and line breaks, with no attributes. */
export function isPlainCompatible(html: string): boolean {
  for (const match of html.matchAll(/<\/?([a-zA-Z][a-zA-Z0-9]*)([^>]*)>/g)) {
    const tag = (match[1] ?? '').toLowerCase();
    const attributes = (match[2] ?? '').trim();
    if (!SIMPLE_TAGS.has(tag) || (attributes !== '' && attributes !== '/')) return false;
  }
  return true;
}

export function htmlToPlain(html: string): string {
  const text = html
    .replace(/\r?\n/g, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li>/gi, '- ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/?ul>/gi, '\n')
    .replace(/<p>/gi, '')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '');
  return decodeEntities(text)
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const BULLET = /^\s*[-•*]\s+/;

export function plainToHtml(text: string): string {
  const blocks: string[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];

  const closeParagraph = () => {
    if (paragraph.length > 0) blocks.push(`<p>${paragraph.map(escapeHtml).join('<br>')}</p>`);
    paragraph = [];
  };
  const closeList = () => {
    if (list.length > 0) blocks.push(`<ul>${list.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`);
    list = [];
  };

  for (const rawLine of text.replace(/\r\n?/g, '\n').split('\n')) {
    const line = rawLine.trimEnd();
    if (line.trim() === '') {
      closeParagraph();
      closeList();
    } else if (BULLET.test(line)) {
      closeParagraph();
      list.push(line.replace(BULLET, ''));
    } else {
      closeList();
      paragraph.push(line.trim());
    }
  }
  closeParagraph();
  closeList();
  return blocks.join('');
}

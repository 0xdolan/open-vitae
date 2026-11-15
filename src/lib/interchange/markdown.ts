import { Marked } from 'marked';

import { sanitizeHtml } from '@/lib/sanitize';

/**
 * Rich text to Markdown and back, for CSV and Excel cells and Markdown files.
 * Markdown has no underline, sub- or superscript, so those stay as the
 * matching HTML tags, which Markdown allows. Colours, fonts and sizes are
 * not kept. Images are kept or dropped, as asked.
 *
 * Browser only (uses DOMParser).
 */

const marked = new Marked({ gfm: true, breaks: false, async: false });

/** Markdown to clean rich text. Raw HTML in the Markdown goes through the sanitiser like everything else. */
export function markdownToHtml(markdown: string): string {
  if (markdown.trim() === '') return '';
  const html = marked.parse(markdown, { async: false });
  return tidy(sanitizeHtml(html));
}

/** Remove the line breaks Markdown puts between block tags (not inside code). */
function tidy(html: string): string {
  const template = document.createElement('template');
  template.innerHTML = html;
  const walk = (node: Node) => {
    for (const child of Array.from(node.childNodes)) {
      if (
        child.nodeType === Node.TEXT_NODE &&
        (child.textContent ?? '').trim() === '' &&
        node.nodeName !== 'PRE' &&
        node.nodeName !== 'CODE'
      ) {
        const parentIsBlock =
          node === template.content ||
          /^(UL|OL|LI|TABLE|THEAD|TBODY|TR|BLOCKQUOTE|DIV)$/.test(node.nodeName);
        if (parentIsBlock) child.remove();
      } else if (child.nodeName !== 'PRE') {
        walk(child);
      }
    }
  };
  walk(template.content);
  return template.innerHTML.trim();
}

export interface ToMarkdownOptions {
  /** Keep images as Markdown images with their data URL (true) or leave them out. */
  readonly images?: boolean;
}

/** Escape text so Markdown shows it literally. */
function escapeText(text: string): string {
  return text.replace(/([\\`*_[\]<>|~])/g, '\\$1');
}

function escapeLineStart(line: string): string {
  return line.replace(
    /^(\s*)(#{1,6}\s|[-+]\s|\d+[.)]\s|>)/,
    (_m, space: string, marker: string) => `${space}\\${marker}`,
  );
}

function inline(node: Node, options: ToMarkdownOptions): string {
  if (node.nodeType === Node.TEXT_NODE)
    return escapeText((node.textContent ?? '').replace(/\s+/g, ' '));
  if (!(node instanceof Element)) return '';
  const inner = () =>
    Array.from(node.childNodes)
      .map((child) => inline(child, options))
      .join('');
  const wrap = (marker: string) => {
    const text = inner();
    const trimmed = text.trim();
    if (trimmed === '') return text;
    // Markers must touch the text: move surrounding spaces outside.
    const lead = text.slice(0, text.length - text.trimStart().length);
    const trail = text.slice(text.trimEnd().length);
    return `${lead}${marker}${trimmed}${marker}${trail}`;
  };
  switch (node.tagName) {
    case 'STRONG':
    case 'B':
      return wrap('**');
    case 'EM':
    case 'I':
      return wrap('*');
    case 'S':
    case 'DEL':
      return wrap('~~');
    case 'U':
      return `<u>${inner()}</u>`;
    case 'SUB':
      return `<sub>${inner()}</sub>`;
    case 'SUP':
      return `<sup>${inner()}</sup>`;
    case 'CODE': {
      const text = node.textContent ?? '';
      const fence = text.includes('`') ? '``' : '`';
      return `${fence}${text}${fence}`;
    }
    case 'A': {
      const href = node.getAttribute('href') ?? '';
      return href ? `[${inner()}](${href.replace(/[()\s]/g, encodeURIComponent)})` : inner();
    }
    case 'BR':
      return '\\\n';
    case 'IMG': {
      if (!options.images) return '';
      const src = node.getAttribute('src') ?? '';
      return src ? `![${escapeText(node.getAttribute('alt') ?? '')}](${src})` : '';
    }
    default:
      return inner();
  }
}

function list(element: Element, depth: number, options: ToMarkdownOptions): string {
  const ordered = element.tagName === 'OL';
  const start = Number.parseInt(element.getAttribute('start') ?? '1', 10) || 1;
  const lines: string[] = [];
  Array.from(element.children)
    .filter((child) => child.tagName === 'LI')
    .forEach((item, index) => {
      const marker = ordered ? `${start + index}.` : '-';
      const pad = ' '.repeat(marker.length + 1);
      const own: string[] = [];
      const nested: string[] = [];
      for (const child of Array.from(item.childNodes)) {
        if (child instanceof Element && (child.tagName === 'UL' || child.tagName === 'OL')) {
          nested.push(list(child, depth + 1, options));
        } else if (child instanceof Element && child.tagName === 'P') {
          own.push(
            Array.from(child.childNodes)
              .map((n) => inline(n, options))
              .join(''),
          );
        } else {
          own.push(inline(child, options));
        }
      }
      const text = own.join(' ').replace(/\s+/g, ' ').trim();
      lines.push(`${marker} ${text}`);
      for (const block of nested) lines.push(block.replace(/^/gm, pad));
    });
  return lines.join('\n');
}

function table(element: Element, options: ToMarkdownOptions): string {
  const rows = Array.from(element.querySelectorAll('tr')).map((tr) =>
    Array.from(tr.children).map((cell) =>
      Array.from(cell.childNodes)
        .map((n) =>
          n instanceof Element && n.tagName === 'P'
            ? Array.from(n.childNodes)
                .map((c) => inline(c, options))
                .join('')
            : inline(n, options),
        )
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim(),
    ),
  );
  if (rows.length === 0) return '';
  const width = Math.max(...rows.map((r) => r.length));
  const pad = (r: string[]) => [...r, ...Array<string>(width - r.length).fill('')];
  const [head = [], ...body] = rows;
  return [
    `| ${pad(head).join(' | ')} |`,
    `| ${Array<string>(width).fill('---').join(' | ')} |`,
    ...body.map((r) => `| ${pad(r).join(' | ')} |`),
  ].join('\n');
}

function block(node: Node, options: ToMarkdownOptions): string {
  if (!(node instanceof Element)) {
    const text = inline(node, options).trim();
    return text ? escapeLineStart(text) : '';
  }
  switch (node.tagName) {
    case 'H1':
    case 'H2':
    case 'H3':
    case 'H4':
    case 'H5':
    case 'H6':
      return `${'#'.repeat(Number(node.tagName[1]))} ${inline(node, options).trim()}`;
    case 'UL':
    case 'OL':
      return list(node, 0, options);
    case 'PRE': {
      const code = node.querySelector('code');
      const language = /language-([\w-]+)/.exec(code?.className ?? '')?.[1] ?? '';
      const text = (code ?? node).textContent ?? '';
      const fence = text.includes('```') ? '~~~' : '```';
      return `${fence}${language}\n${text.replace(/\n$/, '')}\n${fence}`;
    }
    case 'BLOCKQUOTE':
      return Array.from(node.childNodes)
        .map((child) => block(child, options))
        .filter(Boolean)
        .join('\n\n')
        .replace(/^/gm, '> ');
    case 'HR':
      return '---';
    case 'TABLE':
      return table(node, options);
    case 'P':
    case 'DIV':
    default:
      return escapeLineStart(inline(node, options).trim());
  }
}

/** Rich text (already sanitised) to Markdown. */
export function htmlToMarkdown(html: string, options: ToMarkdownOptions = {}): string {
  if (html.trim() === '') return '';
  const template = document.createElement('template');
  template.innerHTML = html;
  return Array.from(template.content.childNodes)
    .map((node) => block(node, options))
    .filter((text) => text !== '')
    .join('\n\n');
}

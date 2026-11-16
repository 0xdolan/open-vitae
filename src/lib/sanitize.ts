import DOMPurify from 'dompurify';

import { filterClasses, filterStyle, isAllowedImageSource } from '@/lib/css-filter';
import { isSafeUrl } from '@/lib/url';

/**
 * The only way user-supplied HTML reaches the page. Everything not listed is
 * removed: scripts, event handlers, iframes, forms, SVG, remote images and
 * unknown tags. Inline styles and classes go through strict allowlists
 * (src/lib/css-filter.ts). The rich text editor produces only what is listed.
 */
const ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'sub',
  'sup',
  'mark',
  'span',
  'ul',
  'ol',
  'li',
  'a',
  'code',
  'pre',
  'blockquote',
  'hr',
  'img',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'table',
  'colgroup',
  'col',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
];

const ALLOWED_ATTR = [
  'href',
  'title',
  'colspan',
  'rowspan',
  'colwidth',
  'dir',
  'lang',
  'style',
  'class',
  'src',
  'alt',
  'width',
  'start',
];

let hooksInstalled = false;

function installHooks(): void {
  if (hooksInstalled) return;
  hooksInstalled = true;
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (!(node instanceof Element)) return;

    const style = node.getAttribute('style');
    if (style !== null) {
      const safe = filterStyle(style);
      if (safe) node.setAttribute('style', safe);
      else node.removeAttribute('style');
    }

    const className = node.getAttribute('class');
    if (className !== null) {
      const safe = filterClasses(className);
      if (safe) node.setAttribute('class', safe);
      else node.removeAttribute('class');
    }

    if (node.tagName === 'IMG') {
      const src = node.getAttribute('src') ?? '';
      // Remote images would reveal the reader's IP address; only embedded images stay.
      if (!isAllowedImageSource(src)) node.removeAttribute('src');
      return;
    }

    if (node.tagName === 'A') {
      const href = node.getAttribute('href');
      if (!href || !isSafeUrl(href)) {
        node.removeAttribute('href');
        return;
      }
      // Links open outside the app and cannot reach back into it.
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer');
    }
  });
}

export function sanitizeHtml(html: string): string {
  if (html === '') return '';
  installHooks();
  // Do not set ALLOWED_URI_REGEXP: DOMPurify then tests every non-URL attribute
  // against it too, silently dropping dir="rtl", lang and colspan. Links and
  // images are checked by the hook above instead.
  const fragment = DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    RETURN_DOM_FRAGMENT: true,
  });
  // Images whose source was blocked (remote or unsafe) are removed entirely,
  // so no broken-image icon or tracking placeholder is left behind.
  for (const image of fragment.querySelectorAll('img:not([src])')) image.remove();
  const container = document.createElement('div');
  container.append(fragment);
  return container.innerHTML;
}

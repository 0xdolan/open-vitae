import DOMPurify from 'dompurify';

import { isSafeUrl } from '@/lib/url';

/**
 * The only way user-supplied HTML reaches the page. Everything not listed is
 * removed: scripts, event handlers, iframes, forms, styles and unknown tags.
 * The rich text editor (phase 4) extends this list, never bypasses it.
 */
const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'sub', 'sup', 'mark', 'span',
  'ul', 'ol', 'li', 'a', 'code', 'pre', 'blockquote', 'hr',
  'h3', 'h4', 'h5', 'h6',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
];

const ALLOWED_ATTR = ['href', 'title', 'colspan', 'rowspan', 'dir', 'lang'];

let hooksInstalled = false;

function installHooks(): void {
  if (hooksInstalled) return;
  hooksInstalled = true;
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName !== 'A') return;
    const href = node.getAttribute('href');
    if (!href || !isSafeUrl(href)) {
      node.removeAttribute('href');
      return;
    }
    // Links open outside the app and cannot reach back into it.
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer');
  });
}

export function sanitizeHtml(html: string): string {
  if (html === '') return '';
  installHooks();
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|tel:)/i,
    ALLOW_DATA_ATTR: false,
  });
}

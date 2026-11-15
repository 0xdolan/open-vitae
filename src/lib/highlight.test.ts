// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import { sanitizeHtml } from './sanitize';
import { CODE_LANGUAGES, getHighlighter, highlightCodeBlocks } from './highlight';

describe('code highlighting', () => {
  it('registers every offered language', () => {
    const hljs = getHighlighter();
    for (const { id } of CODE_LANGUAGES) {
      expect(hljs.getLanguage(id)).toBeDefined();
    }
  });

  it('colours code blocks and survives the sanitiser', () => {
    const html = '<pre><code class="language-typescript">const answer: number = 42;</code></pre>';
    const highlighted = sanitizeHtml(highlightCodeBlocks(sanitizeHtml(html)));
    expect(highlighted).toContain('class="hljs-keyword"');
    expect(highlighted).toContain('class="language-typescript hljs"');
    expect(highlighted).toContain('42');
  });

  it('escapes code instead of running it', () => {
    const html = '<pre><code class="language-xml">&lt;script&gt;alert(1)&lt;/script&gt;</code></pre>';
    const out = sanitizeHtml(highlightCodeBlocks(sanitizeHtml(html)));
    expect(out).not.toContain('<script');
    expect(out).toContain('&lt;');
  });

  it('leaves plain text and unknown languages alone', () => {
    const plain = '<pre><code class="language-plaintext">just text</code></pre>';
    expect(highlightCodeBlocks(plain)).toBe(plain);
    const unknown = '<pre><code class="language-cobol">MOVE 1 TO X.</code></pre>';
    expect(highlightCodeBlocks(unknown)).toBe(unknown);
    expect(highlightCodeBlocks('<p>No code</p>')).toBe('<p>No code</p>');
  });
});

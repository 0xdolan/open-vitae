// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import { htmlToMarkdown, markdownToHtml } from './markdown';

describe('markdown', () => {
  it('turns rich text into Markdown', () => {
    expect(
      htmlToMarkdown(
        '<p>Built <strong>fast</strong> and <em>accessible</em> apps.</p><ul><li>One</li><li>Two<ul><li>Nested</li></ul></li></ul>',
      ),
    ).toBe('Built **fast** and *accessible* apps.\n\n- One\n- Two\n  - Nested');
    expect(htmlToMarkdown('<ol start="3"><li><p>Three</p></li></ol>')).toBe('3. Three');
    expect(
      htmlToMarkdown(
        '<p>See <a href="https://example.com/a b">site</a>, <u>under</u>, H<sub>2</sub>O</p>',
      ),
    ).toBe('See [site](https://example.com/a%20b), <u>under</u>, H<sub>2</sub>O');
    expect(htmlToMarkdown('<pre><code class="language-ts">const a = 1;\n</code></pre>')).toBe(
      '```ts\nconst a = 1;\n```',
    );
  });

  it('escapes characters Markdown would treat as formatting', () => {
    expect(htmlToMarkdown('<p>5 * 3 = 15_000 [draft]</p>')).toBe('5 \\* 3 = 15\\_000 \\[draft\\]');
    expect(htmlToMarkdown('<p>- not a list</p>')).toBe('\\- not a list');
  });

  it('turns Markdown into clean rich text', () => {
    expect(markdownToHtml('Python, Go')).toBe('<p>Python, Go</p>');
    expect(markdownToHtml('- One\n- **Two**')).toBe(
      '<ul><li>One</li><li><strong>Two</strong></li></ul>',
    );
    expect(markdownToHtml('')).toBe('');
  });

  it('removes anything unsafe in Markdown', () => {
    const html = markdownToHtml(
      'Hi <script>alert(1)</script> [x](javascript:alert(1)) <img src=x onerror=alert(1)>',
    );
    expect(html).not.toMatch(/script|javascript|onerror/);
  });

  it('round-trips the formatting it supports', () => {
    const html =
      '<p>Led <strong>8</strong> people</p><ul><li>Cut costs by 40%</li><li>Shipped <em>v2</em></li></ul>';
    expect(markdownToHtml(htmlToMarkdown(html))).toBe(html);
  });

  it('keeps or drops images', () => {
    const html = '<p><img src="data:image/png;base64,AAAA" alt="logo"></p>';
    expect(htmlToMarkdown(html)).toBe('');
    expect(htmlToMarkdown(html, { images: true })).toBe('![logo](data:image/png;base64,AAAA)');
  });
});

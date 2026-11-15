// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import { sanitizeHtml } from './sanitize';

describe('sanitizeHtml', () => {
  it('keeps formatting', () => {
    const html = '<p><strong>Bold</strong> <em>italic</em> H<sub>2</sub>O x<sup>2</sup></p><ul><li>One</li></ul>';
    expect(sanitizeHtml(html)).toBe(html);
  });

  it('removes scripts and event handlers', () => {
    expect(sanitizeHtml('<p onclick="alert(1)">Hi</p><script>alert(1)</script>')).toBe('<p>Hi</p>');
    // Images are allowed now, but never with handlers or non-embedded sources.
    expect(sanitizeHtml('<img src="x" onerror="alert(1)">')).toBe('');
  });

  it('removes iframes, forms and inline styles', () => {
    expect(sanitizeHtml('<iframe src="https://example.com"></iframe><form><input></form>')).toBe('');
    expect(sanitizeHtml('<p style="position:fixed">x</p>')).toBe('<p>x</p>');
  });

  it('drops dangerous links but keeps the text', () => {
    expect(sanitizeHtml('<a href="javascript:alert(1)">click</a>')).toBe('<a>click</a>');
  });

  it('makes safe links open in a new tab without access to the app', () => {
    expect(sanitizeHtml('<a href="https://example.com">site</a>')).toBe(
      '<a href="https://example.com" target="_blank" rel="noopener noreferrer">site</a>',
    );
  });

  it('keeps direction and language attributes for bidi text', () => {
    expect(sanitizeHtml('<p dir="rtl" lang="fa">سلام</p>')).toBe('<p dir="rtl" lang="fa">سلام</p>');
  });

  it('keeps table cell spans', () => {
    const html = '<table><tbody><tr><td colspan="2">Wide</td></tr></tbody></table>';
    expect(sanitizeHtml(html)).toBe(html);
  });

  it('drops data: and vbscript: links', () => {
    expect(sanitizeHtml('<a href="data:text/html,x">a</a><a href="vbscript:x">b</a>')).toBe('<a>a</a><a>b</a>');
  });

  it('keeps the inline formatting the editor produces', () => {
    const html = '<p style="text-align: center"><span style="color: #b91c1c; font-size: 12pt">Red</span></p>';
    expect(sanitizeHtml(html)).toBe(html);
  });

  it('strips unsafe styles and classes but keeps the safe parts', () => {
    expect(sanitizeHtml('<p style="position: fixed; color: #000" class="fixed hljs">x</p>')).toBe(
      '<p style="color: #000" class="hljs">x</p>',
    );
    expect(sanitizeHtml('<p style="position: fixed" class="z-50">x</p>')).toBe('<p>x</p>');
  });

  it('keeps embedded images and drops remote ones', () => {
    const embedded = '<img src="data:image/png;base64,iVBORw0KGgo=" alt="Logo">';
    expect(sanitizeHtml(embedded)).toBe(embedded);
    expect(sanitizeHtml('<p>a<img src="https://tracker.example/p.gif" alt="x">b</p>')).toBe('<p>ab</p>');
  });

  it('keeps headings, code blocks and indent levels', () => {
    const html = '<h2>Title</h2><pre><code class="language-ts">const a = 1;</code></pre><p style="--ov-level: 2">Indented</p>';
    expect(sanitizeHtml(html)).toBe(html);
  });

  it('removes SVG and MathML entirely', () => {
    expect(sanitizeHtml('<svg><script>alert(1)</script></svg><math><mi>x</mi></math>ok')).toBe('ok');
  });
});

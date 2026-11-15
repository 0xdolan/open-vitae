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
});

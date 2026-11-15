import { describe, expect, it } from 'vitest';

import { clamp, formatBytes } from './format';
import { createId } from './id';
import { omitKey } from './object';
import { isSafeUrl, telUrl } from './url';

describe('isSafeUrl', () => {
  it.each([
    'https://example.com',
    'http://example.com/a?b=c',
    'mailto:a@example.com',
    'tel:+15550100',
  ])('accepts %s', (url) => {
    expect(isSafeUrl(url)).toBe(true);
  });

  it.each([
    'javascript:alert(1)',
    'JaVaScRiPt:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'vbscript:msgbox',
    '/relative/path',
    'example.com',
    ' https://example.com',
    '',
  ])('rejects %s', (url) => {
    expect(isSafeUrl(url)).toBe(false);
  });
});

describe('telUrl', () => {
  it('keeps digits and a leading plus', () => {
    expect(telUrl('+49 30 5550-1234')).toBe('tel:+493055501234');
  });
});

describe('createId', () => {
  it('returns url-safe ids of the requested length', () => {
    const id = createId();
    expect(id).toMatch(/^[A-Za-z0-9_-]{21}$/);
    expect(createId(8)).toHaveLength(8);
  });

  it('does not repeat', () => {
    const ids = new Set(Array.from({ length: 1000 }, () => createId()));
    expect(ids.size).toBe(1000);
  });
});

describe('formatBytes', () => {
  it('formats sizes', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(15 * 1024 * 1024)).toBe('15 MB');
    expect(formatBytes(-1)).toBe('—');
  });
});

describe('clamp', () => {
  it('keeps a value inside the range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
  });
});

describe('omitKey', () => {
  it('returns a copy without the key', () => {
    const original = { a: 1, b: 2 };
    expect(omitKey(original, 'a')).toEqual({ b: 2 });
    expect(original).toEqual({ a: 1, b: 2 });
  });
});

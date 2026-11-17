import { describe, expect, it } from 'vitest';

import { targetIndex } from '@/lib/sortable';
import { itemFieldLabels } from '@/config/sections';
import { parseRoute, routeHref } from '@/hooks/useHashRoute';

import { emailError, isValidEmail, urlError } from './field-validation';

describe('targetIndex (drop position while dragging)', () => {
  // Four items whose middles sit at 10, 30, 50 and 70 px.
  const middles = [10, 30, 50, 70];

  it('stays in place until the pointer passes a neighbour', () => {
    expect(targetIndex(25, middles, 1)).toBe(1);
    expect(targetIndex(35, middles, 1)).toBe(1);
  });

  it('moves down past the middles it crosses', () => {
    expect(targetIndex(55, middles, 0)).toBe(2);
    expect(targetIndex(500, middles, 0)).toBe(3);
  });

  it('moves up to the top', () => {
    expect(targetIndex(5, middles, 3)).toBe(0);
    expect(targetIndex(40, middles, 3)).toBe(2);
  });
});

describe('routes', () => {
  it('parses the library and editor routes', () => {
    expect(parseRoute('')).toEqual({ name: 'library' });
    expect(parseRoute('#/')).toEqual({ name: 'library' });
    expect(parseRoute('#/edit/abc_DEF-123')).toEqual({ name: 'editor', id: 'abc_DEF-123' });
  });

  it('ignores anything that is not a valid id', () => {
    expect(parseRoute('#/edit/<script>')).toEqual({ name: 'library' });
    expect(parseRoute('#/edit/')).toEqual({ name: 'library' });
  });

  it('builds links', () => {
    expect(routeHref({ name: 'editor', id: 'x1' })).toBe('#/edit/x1');
    expect(routeHref({ name: 'library' })).toBe('#/');
  });
});

describe('field validation', () => {
  it('explains invalid values and accepts valid or empty ones', () => {
    expect(emailError('not-an-email')).toBe('validation.email');
    expect(emailError('')).toBeNull();
    expect(emailError('maya@example.com')).toBeNull();
    expect(isValidEmail('maya@')).toBe(false);
    expect(urlError('javascript:alert(1)')).toBe('validation.url');
    expect(urlError('example.com')).toBe('validation.url');
    expect(urlError('https://example.com')).toBeNull();
    expect(urlError('')).toBeNull();
  });
});

describe('item field labels', () => {
  it('match what each section holds', () => {
    expect(itemFieldLabels('experience')).toMatchObject({
      title: 'field.jobTitle',
      subtitle: 'field.company',
    });
    expect(itemFieldLabels('languages')).toMatchObject({
      title: 'field.language',
      description: 'field.level',
    });
    expect(itemFieldLabels('custom')).toMatchObject({
      title: 'field.title',
      description: 'field.description',
    });
  });
});

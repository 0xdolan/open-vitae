import { describe, expect, it } from 'vitest';

import { formatZoom, MAX_ZOOM, MIN_ZOOM, stepZoom } from './preview';

describe('preview zoom', () => {
  it('steps to the next zoom level in either direction', () => {
    expect(stepZoom(1, 1)).toBe(1.1);
    expect(stepZoom(1, -1)).toBe(0.9);
    // From an in-between "fit" value, go to the nearest step.
    expect(stepZoom(0.8, 1)).toBe(0.9);
    expect(stepZoom(0.8, -1)).toBe(0.75);
  });

  it('stops at the limits', () => {
    expect(stepZoom(MAX_ZOOM, 1)).toBe(MAX_ZOOM);
    expect(stepZoom(MIN_ZOOM, -1)).toBe(MIN_ZOOM);
  });

  it('formats zoom as a percentage', () => {
    expect(formatZoom(0.667)).toBe('67%');
  });
});

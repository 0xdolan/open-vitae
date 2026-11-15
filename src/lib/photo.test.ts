import { describe, expect, it } from 'vitest';

import {
  clampCrop,
  cropZoom,
  effectiveDpi,
  initialCrop,
  maxZoom,
  nextRotation,
  outputSize,
  panCrop,
  PHOTO_ASPECTS,
  PHOTO_MIN_CROP_SIDE,
  pixelsForPrint,
  printQuality,
  resolveRatio,
  rotatedSize,
  zoomCrop,
} from './photo';

describe('photo crop', () => {
  it('starts with the largest crop of the chosen shape, a little above centre for portraits', () => {
    expect(initialCrop(1200, 1600, 1)).toEqual({ x: 0, y: 140, width: 1200, height: 1200, rotation: 0 });
    expect(initialCrop(1600, 1200, 1)).toEqual({ x: 200, y: 0, width: 1200, height: 1200, rotation: 0 });
    const portrait = initialCrop(2000, 1000, 4 / 5);
    expect(portrait.height).toBe(1000);
    expect(portrait.width).toBe(800);
  });

  it('uses the picture\'s own shape for "Original"', () => {
    const original = PHOTO_ASPECTS.find((a) => a.id === 'original');
    expect(original && resolveRatio(original, 300, 200)).toBe(1.5);
  });

  it('swaps width and height when rotated a quarter turn', () => {
    expect(rotatedSize(1200, 800, 90)).toEqual({ width: 800, height: 1200 });
    expect(rotatedSize(1200, 800, 180)).toEqual({ width: 1200, height: 800 });
    expect(nextRotation(270, 1)).toBe(0);
    expect(nextRotation(0, -1)).toBe(270);
  });

  it('keeps a crop inside the picture when panning', () => {
    const crop = initialCrop(1000, 1000, 1);
    const zoomed = zoomCrop(crop, 2, 1000, 1000);
    expect(zoomed).toMatchObject({ x: 250, y: 250, width: 500, height: 500 });
    expect(panCrop(zoomed, -400, 0, 1000, 1000).x).toBe(0);
    expect(panCrop(zoomed, 0, 900, 1000, 1000).y).toBe(500);
  });

  it('zooms around the centre and reports the zoom back', () => {
    const crop = zoomCrop(initialCrop(1000, 1000, 1), 4, 1000, 1000);
    expect(crop.width).toBe(250);
    expect(cropZoom(crop, 1000, 1000)).toBe(4);
    // Zooming out past 1 stays at the full picture.
    expect(zoomCrop(crop, 0.5, 1000, 1000).width).toBe(1000);
  });

  it('never zooms below the minimum crop size', () => {
    const crop = zoomCrop(initialCrop(1000, 1000, 1), 100, 1000, 1000);
    expect(crop.width).toBe(PHOTO_MIN_CROP_SIDE);
    expect(maxZoom(crop, 1000, 1000)).toBeCloseTo(1000 / PHOTO_MIN_CROP_SIDE);
  });

  it('shrinks an oversized crop and keeps its ratio', () => {
    const clamped = clampCrop({ x: -5, y: -5, width: 2000, height: 1000, rotation: 0 }, 1000, 1000);
    expect(clamped).toMatchObject({ x: 0, y: 0, width: 1000, height: 500 });
  });

  it('scales the finished photo down to the output limit, never up', () => {
    expect(outputSize({ x: 0, y: 0, width: 2000, height: 2500, rotation: 0 })).toEqual({ width: 800, height: 1000 });
    expect(outputSize({ x: 0, y: 0, width: 400, height: 400, rotation: 0 })).toEqual({ width: 400, height: 400 });
  });
});

describe('size guide', () => {
  it('works out pixels needed and print resolution', () => {
    expect(pixelsForPrint(35)).toBe(414);
    expect(effectiveDpi(414, 35)).toBe(300);
    expect(effectiveDpi(200, 35)).toBe(145);
  });

  it('rates print quality', () => {
    expect(printQuality(300)).toBe('good');
    expect(printQuality(180)).toBe('fair');
    expect(printQuality(120)).toBe('low');
  });
});

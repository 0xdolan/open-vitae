import type { PhotoCrop } from '@/schema/resume';

/**
 * Crop maths for the profile photo. Pure functions; the canvas work is in
 * photo-canvas.ts. Coordinates are source pixels after rotation.
 */

export type Rotation = PhotoCrop['rotation'];

export interface PhotoAspect {
  readonly id: 'square' | 'portrait' | 'passport' | 'original';
  readonly label: string;
  /** Width divided by height; null means "same as the picture". */
  readonly ratio: number | null;
}

export const PHOTO_ASPECTS: readonly PhotoAspect[] = [
  { id: 'square', label: 'Square', ratio: 1 },
  { id: 'portrait', label: 'Portrait 4:5', ratio: 4 / 5 },
  { id: 'passport', label: 'Passport 35 × 45 mm', ratio: 35 / 45 },
  { id: 'original', label: 'Original shape', ratio: null },
];

/** Largest side the uploaded picture is kept at (enough for any crop to print sharply). */
export const PHOTO_SOURCE_MAX_SIDE = 2400;
/** Largest side of the cropped photo: 80 mm at 300 DPI is 945 px. */
export const PHOTO_OUTPUT_MAX_SIDE = 1000;
/** A crop is never smaller than this, so zooming in stops before it turns to mush. */
export const PHOTO_MIN_CROP_SIDE = 64;
/** Files larger than this are refused before decoding. */
export const PHOTO_MAX_FILE_BYTES = 25 * 1024 * 1024;
/** Print resolution the size guide aims for. */
export const PRINT_DPI = 300;

const MM_PER_INCH = 25.4;

export function rotatedSize(
  width: number,
  height: number,
  rotation: Rotation,
): { width: number; height: number } {
  return rotation === 90 || rotation === 270 ? { width: height, height: width } : { width, height };
}

export function nextRotation(rotation: Rotation, direction: 1 | -1): Rotation {
  return ((((rotation + direction * 90) % 360) + 360) % 360) as Rotation;
}

/** The aspect ratio to use: a preset, or the picture's own shape. */
export function resolveRatio(aspect: PhotoAspect, imageWidth: number, imageHeight: number): number {
  return aspect.ratio ?? imageWidth / imageHeight;
}

/**
 * The largest crop of the given ratio, centred across. When the picture is
 * taller than the crop, the crop sits a little above centre, where faces are.
 */
export function initialCrop(
  imageWidth: number,
  imageHeight: number,
  ratio: number,
  rotation: Rotation = 0,
): PhotoCrop {
  let width = imageWidth;
  let height = width / ratio;
  if (height > imageHeight) {
    height = imageHeight;
    width = height * ratio;
  }
  const spareY = imageHeight - height;
  return {
    x: (imageWidth - width) / 2,
    y: spareY * 0.35,
    width,
    height,
    rotation,
  };
}

/** Keep a crop inside the picture and no smaller than the minimum, keeping its ratio. */
export function clampCrop(crop: PhotoCrop, imageWidth: number, imageHeight: number): PhotoCrop {
  const ratio = crop.width / crop.height;
  let width = crop.width;
  let height = crop.height;
  // Not larger than the picture.
  if (width > imageWidth) {
    width = imageWidth;
    height = width / ratio;
  }
  if (height > imageHeight) {
    height = imageHeight;
    width = height * ratio;
  }
  // Not smaller than the minimum (unless the picture itself is smaller).
  const minSide = Math.min(PHOTO_MIN_CROP_SIDE, imageWidth, imageHeight);
  if (Math.min(width, height) < minSide) {
    if (width < height) {
      width = minSide;
      height = width / ratio;
    } else {
      height = minSide;
      width = height * ratio;
    }
  }
  const x = Math.min(Math.max(0, crop.x), Math.max(0, imageWidth - width));
  const y = Math.min(Math.max(0, crop.y), Math.max(0, imageHeight - height));
  return { ...crop, x, y, width, height };
}

/** Move the crop by a number of source pixels. */
export function panCrop(
  crop: PhotoCrop,
  dx: number,
  dy: number,
  imageWidth: number,
  imageHeight: number,
): PhotoCrop {
  return clampCrop({ ...crop, x: crop.x + dx, y: crop.y + dy }, imageWidth, imageHeight);
}

/**
 * Zoom relative to the largest possible crop: 1 shows as much as fits, 2 shows
 * half the width. Zooms around the centre of the current crop.
 */
export function zoomCrop(
  crop: PhotoCrop,
  zoom: number,
  imageWidth: number,
  imageHeight: number,
): PhotoCrop {
  const ratio = crop.width / crop.height;
  const full = initialCrop(imageWidth, imageHeight, ratio, crop.rotation);
  const width = full.width / Math.max(1, zoom);
  const height = width / ratio;
  const centreX = crop.x + crop.width / 2;
  const centreY = crop.y + crop.height / 2;
  return clampCrop(
    { ...crop, x: centreX - width / 2, y: centreY - height / 2, width, height },
    imageWidth,
    imageHeight,
  );
}

/** The current zoom of a crop, as zoomCrop understands it. */
export function cropZoom(crop: PhotoCrop, imageWidth: number, imageHeight: number): number {
  const full = initialCrop(imageWidth, imageHeight, crop.width / crop.height, crop.rotation);
  return full.width / crop.width;
}

/** The highest zoom allowed before the crop would go below the minimum size. */
export function maxZoom(crop: PhotoCrop, imageWidth: number, imageHeight: number): number {
  const full = initialCrop(imageWidth, imageHeight, crop.width / crop.height, crop.rotation);
  const minSide = Math.min(PHOTO_MIN_CROP_SIDE, imageWidth, imageHeight);
  return Math.max(1, Math.min(full.width, full.height) / minSide);
}

/** Pixel size of the finished photo: the crop, scaled down to the output limit, never up. */
export function outputSize(
  crop: PhotoCrop,
  maxSide = PHOTO_OUTPUT_MAX_SIDE,
): { width: number; height: number } {
  const scale = Math.min(1, maxSide / Math.max(crop.width, crop.height));
  return {
    width: Math.max(1, Math.round(crop.width * scale)),
    height: Math.max(1, Math.round(crop.height * scale)),
  };
}

/** Pixels needed across `widthMm` to print at `dpi`. */
export function pixelsForPrint(widthMm: number, dpi = PRINT_DPI): number {
  return Math.ceil((widthMm / MM_PER_INCH) * dpi);
}

/** The resolution the photo will print at when shown `widthMm` wide. */
export function effectiveDpi(photoWidthPx: number, widthMm: number): number {
  return widthMm > 0 ? Math.round(photoWidthPx / (widthMm / MM_PER_INCH)) : 0;
}

export type PrintQuality = 'good' | 'fair' | 'low';

/** 250 DPI and up looks sharp; 150 is acceptable; below that it may look soft. */
export function printQuality(dpi: number): PrintQuality {
  if (dpi >= 250) return 'good';
  if (dpi >= 150) return 'fair';
  return 'low';
}

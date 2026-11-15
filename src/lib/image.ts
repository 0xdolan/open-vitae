/** Largest side of an image embedded in rich text, in pixels. */
export const MAX_EMBEDDED_IMAGE_SIDE = 1600;
/** Largest embedded image after compression, in bytes of data URL. */
export const MAX_EMBEDDED_IMAGE_BYTES = 1_500_000;

const ACCEPTED_TYPES: ReadonlySet<string> = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
]);

export function isAcceptedImageType(type: string): boolean {
  return ACCEPTED_TYPES.has(type);
}

/** Scale (width, height) down to fit inside `max` on its longer side; never scales up. */
export function fitWithin(
  width: number,
  height: number,
  max: number,
): { width: number; height: number } {
  if (width <= 0 || height <= 0) return { width: 0, height: 0 };
  const scale = Math.min(1, max / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

export class ImageError extends Error {
  override readonly name = 'ImageError';
}

export function loadImage(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new ImageError('This file could not be read as an image.'));
    };
    img.src = url;
  });
}

/**
 * Read an image file in the browser, shrink it to a sensible size and return
 * it as a data URL. Nothing is uploaded. Re-encoding through a canvas also
 * strips metadata such as GPS location from photos.
 */
export async function imageFileToDataUrl(file: File): Promise<string> {
  if (!isAcceptedImageType(file.type)) {
    throw new ImageError('Use a PNG, JPEG, WebP or GIF image.');
  }
  const img = await loadImage(file);
  const { width, height } = fitWithin(img.naturalWidth, img.naturalHeight, MAX_EMBEDDED_IMAGE_SIDE);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new ImageError('This browser cannot process images.');
  context.drawImage(img, 0, 0, width, height);

  // Keep transparency for PNG; photos compress far better as WebP or JPEG.
  const type = file.type === 'image/png' ? 'image/png' : 'image/webp';
  let dataUrl = canvas.toDataURL(type, 0.85);
  if (!dataUrl.startsWith(`data:${type}`)) dataUrl = canvas.toDataURL('image/jpeg', 0.85);
  if (dataUrl.length > MAX_EMBEDDED_IMAGE_BYTES) dataUrl = canvas.toDataURL('image/jpeg', 0.7);
  if (dataUrl.length > MAX_EMBEDDED_IMAGE_BYTES) {
    throw new ImageError('This image is too large even after compression. Try a smaller one.');
  }
  return dataUrl;
}

import { LIMITS } from '@/config/layout';
import { fitWithin, ImageError, loadImage } from '@/lib/image';
import type { PhotoCrop } from '@/schema/resume';

import { outputSize, PHOTO_MAX_FILE_BYTES, PHOTO_SOURCE_MAX_SIDE, type Rotation } from './photo';

/**
 * Canvas work for the profile photo. Everything happens in the browser: the
 * file is decoded, shrunk and re-encoded (which also removes metadata such as
 * GPS location), and nothing is uploaded.
 */

export interface PhotoSource {
  readonly dataUrl: string;
  readonly width: number;
  readonly height: number;
}

function context2d(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const context = canvas.getContext('2d');
  if (!context) throw new ImageError('This browser cannot process images.');
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  return context;
}

/** Encode as WebP where supported, otherwise JPEG, within the stored size limit. */
function encode(canvas: HTMLCanvasElement): string {
  for (const quality of [0.92, 0.85, 0.75, 0.6]) {
    let dataUrl = canvas.toDataURL('image/webp', quality);
    if (!dataUrl.startsWith('data:image/webp')) dataUrl = canvas.toDataURL('image/jpeg', quality);
    if (dataUrl.length <= LIMITS.photoDataUrlLength) return dataUrl;
  }
  throw new ImageError('This photo is too large to store. Try a smaller picture.');
}

function loadDataUrl(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new ImageError('The photo could not be read.'));
    img.src = dataUrl;
  });
}

/** Read a picture file and keep a shrunk copy as the photo's source. */
export async function readPhotoFile(file: File): Promise<PhotoSource> {
  if (!file.type.startsWith('image/'))
    throw new ImageError('Choose a picture file, such as JPEG, PNG or WebP.');
  if (file.size > PHOTO_MAX_FILE_BYTES)
    throw new ImageError('This file is larger than 25 MB. Choose a smaller picture.');
  const img = await loadImage(file);
  const { width, height } = fitWithin(img.naturalWidth, img.naturalHeight, PHOTO_SOURCE_MAX_SIDE);
  if (width === 0) throw new ImageError('This picture is empty.');
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  // Browsers apply the camera's orientation (EXIF) when decoding, so the picture is upright here.
  context2d(canvas).drawImage(img, 0, 0, width, height);
  return { dataUrl: encode(canvas), width, height };
}

/** Draw an image turned by a quarter, half or three-quarter turn. */
export function rotateImage(
  img: CanvasImageSource & { width: number; height: number },
  rotation: Rotation,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const quarter = rotation === 90 || rotation === 270;
  canvas.width = quarter ? img.height : img.width;
  canvas.height = quarter ? img.width : img.height;
  const context = context2d(canvas);
  context.translate(canvas.width / 2, canvas.height / 2);
  context.rotate((rotation * Math.PI) / 180);
  context.drawImage(img, -img.width / 2, -img.height / 2);
  return canvas;
}

/** The source picture, rotated, ready to show in the crop dialog. */
export async function loadRotatedSource(
  source: PhotoSource,
  rotation: Rotation,
): Promise<HTMLCanvasElement> {
  const img = await loadDataUrl(source.dataUrl);
  return rotateImage(img, rotation);
}

/** Produce the finished photo from the rotated source and the crop. */
export function renderCrop(rotated: HTMLCanvasElement, crop: PhotoCrop): string {
  const { width, height } = outputSize(crop);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = context2d(canvas);
  // A white base, so transparent pictures do not turn black in JPEG.
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, width, height);
  context.drawImage(rotated, crop.x, crop.y, crop.width, crop.height, 0, 0, width, height);
  return encode(canvas);
}

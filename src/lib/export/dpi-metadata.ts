/**
 * Records the resolution inside PNG and JPEG files, so a 300 DPI export of an
 * A4 page opens in other apps and prints at exactly A4. Browsers leave this
 * out when they save a canvas. Pure functions on bytes.
 */

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

let crcTable: Uint32Array | null = null;

function crc32(bytes: Uint8Array): number {
  if (!crcTable) {
    crcTable = new Uint32Array(256);
    for (let n = 0; n < 256; n += 1) {
      let c = n;
      for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      crcTable[n] = c >>> 0;
    }
  }
  let crc = 0xffffffff;
  for (const byte of bytes) crc = (crcTable[(crc ^ byte) & 0xff] as number) ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

const u32 = (value: number) => [
  (value >>> 24) & 0xff,
  (value >>> 16) & 0xff,
  (value >>> 8) & 0xff,
  value & 0xff,
];
const readU32 = (bytes: Uint8Array, offset: number) =>
  (((bytes[offset] ?? 0) << 24) |
    ((bytes[offset + 1] ?? 0) << 16) |
    ((bytes[offset + 2] ?? 0) << 8) |
    (bytes[offset + 3] ?? 0)) >>>
  0;

function isPng(bytes: Uint8Array): boolean {
  return PNG_SIGNATURE.every((value, index) => bytes[index] === value);
}

/** Set the pHYs chunk of a PNG (pixels per metre). Returns the bytes unchanged if they are not a PNG. */
export function setPngDpi(bytes: Uint8Array, dpi: number): Uint8Array {
  if (!isPng(bytes)) return bytes;
  const perMetre = Math.round(dpi / 0.0254);
  const type = [0x70, 0x48, 0x59, 0x73]; // "pHYs"
  const body = new Uint8Array([...type, ...u32(perMetre), ...u32(perMetre), 1]);
  const chunk = new Uint8Array([...u32(9), ...body, ...u32(crc32(body))]);

  const parts: Uint8Array[] = [bytes.subarray(0, 8)];
  let offset = 8;
  let inserted = false;
  while (offset + 8 <= bytes.length) {
    const length = readU32(bytes, offset);
    const end = offset + 12 + length;
    const name = String.fromCharCode(...bytes.subarray(offset + 4, offset + 8));
    if (name !== 'pHYs') parts.push(bytes.subarray(offset, end));
    if (name === 'IHDR' && !inserted) {
      parts.push(chunk);
      inserted = true;
    }
    offset = end;
  }
  const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let position = 0;
  for (const part of parts) {
    out.set(part, position);
    position += part.length;
  }
  return out;
}

/** Read the DPI stored in a PNG, or null. */
export function readPngDpi(bytes: Uint8Array): number | null {
  if (!isPng(bytes)) return null;
  let offset = 8;
  while (offset + 8 <= bytes.length) {
    const length = readU32(bytes, offset);
    const name = String.fromCharCode(...bytes.subarray(offset + 4, offset + 8));
    if (name === 'pHYs' && bytes[offset + 16] === 1)
      return Math.round(readU32(bytes, offset + 8) * 0.0254);
    offset += 12 + length;
  }
  return null;
}

/** Set the JFIF density of a JPEG (dots per inch), adding a JFIF header if there is none. */
export function setJpegDpi(bytes: Uint8Array, dpi: number): Uint8Array {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return bytes;
  const density = Math.max(1, Math.min(0xffff, Math.round(dpi)));
  const hasJfif =
    bytes[2] === 0xff &&
    bytes[3] === 0xe0 &&
    String.fromCharCode(...bytes.subarray(6, 11)) === 'JFIF\0';
  if (hasJfif) {
    const out = new Uint8Array(bytes);
    out[13] = 1;
    out[14] = density >> 8;
    out[15] = density & 0xff;
    out[16] = density >> 8;
    out[17] = density & 0xff;
    return out;
  }
  const app0 = [
    0xff,
    0xe0,
    0x00,
    0x10,
    0x4a,
    0x46,
    0x49,
    0x46,
    0x00,
    0x01,
    0x02,
    1,
    density >> 8,
    density & 0xff,
    density >> 8,
    density & 0xff,
    0,
    0,
  ];
  const out = new Uint8Array(bytes.length + app0.length);
  out.set(bytes.subarray(0, 2), 0);
  out.set(app0, 2);
  out.set(bytes.subarray(2), 2 + app0.length);
  return out;
}

/** Read the DPI stored in a JPEG's JFIF header, or null. */
export function readJpegDpi(bytes: Uint8Array): number | null {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[3] !== 0xe0) return null;
  if (String.fromCharCode(...bytes.subarray(6, 11)) !== 'JFIF\0' || bytes[13] !== 1) return null;
  return ((bytes[14] ?? 0) << 8) | (bytes[15] ?? 0);
}

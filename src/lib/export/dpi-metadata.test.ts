import { describe, expect, it } from 'vitest';

import { readJpegDpi, readPngDpi, setJpegDpi, setPngDpi } from './dpi-metadata';

/** The smallest valid PNG: one white pixel. */
const PNG = Uint8Array.from(
  atob(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
  ),
  (c) => c.charCodeAt(0),
);

describe('DPI metadata', () => {
  it('writes and reads the resolution of a PNG', () => {
    expect(readPngDpi(PNG)).toBeNull();
    const tagged = setPngDpi(PNG, 300);
    expect(readPngDpi(tagged)).toBe(300);
    expect(tagged.length).toBe(PNG.length + 21);
    // Setting it again replaces the chunk instead of adding a second one.
    const again = setPngDpi(tagged, 150);
    expect(readPngDpi(again)).toBe(150);
    expect(again.length).toBe(tagged.length);
    // The IHDR chunk still comes first.
    expect(String.fromCharCode(...again.subarray(12, 16))).toBe('IHDR');
    expect(String.fromCharCode(...again.subarray(37, 41))).toBe('pHYs');
  });

  it('writes the resolution into an existing JFIF header or adds one', () => {
    const withJfif = new Uint8Array([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 1, 1, 0, 0, 1, 0, 1, 0, 0,
      0xff, 0xd9,
    ]);
    expect(readJpegDpi(withJfif)).toBeNull();
    expect(readJpegDpi(setJpegDpi(withJfif, 300))).toBe(300);

    const bare = new Uint8Array([0xff, 0xd8, 0xff, 0xdb, 0x00, 0x02, 0xff, 0xd9]);
    const added = setJpegDpi(bare, 600);
    expect(readJpegDpi(added)).toBe(600);
    expect(added.length).toBe(bare.length + 18);
    expect(Array.from(added.subarray(20))).toEqual([0xff, 0xdb, 0x00, 0x02, 0xff, 0xd9]);
  });

  it('leaves other files alone', () => {
    const text = new TextEncoder().encode('not an image');
    expect(setPngDpi(text, 300)).toBe(text);
    expect(setJpegDpi(text, 300)).toBe(text);
  });
});

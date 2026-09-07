import { describe, it, expect } from 'vitest';
import { unsharpMask, adjustColors, autoLevels, crc32 } from './imageEngine';

/** Minimal ImageData shim — the engines only touch { data, width, height }. */
function makeImageData(width: number, height: number, fill: (x: number, y: number) => [number, number, number]): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const [r, g, b] = fill(x, y);
      data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = 255;
    }
  }
  return { data, width, height, colorSpace: 'srgb' } as ImageData;
}

describe('imageEngine: crc32 (PNG pHYs chunk integrity)', () => {
  it('matches the known CRC-32 of "IEND" and empty input', () => {
    // CRC-32 (IEEE) of the 4-byte string "IEND" is 0xAE426082
    expect(crc32(new Uint8Array([0x49, 0x45, 0x4e, 0x44]))).toBe(0xae426082);
    expect(crc32(new Uint8Array([]))).toBe(0);
  });

  it('is deterministic and differs for different bytes', () => {
    const a = crc32(new Uint8Array([1, 2, 3]));
    const b = crc32(new Uint8Array([1, 2, 3]));
    const c = crc32(new Uint8Array([1, 2, 4]));
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });
});

describe('imageEngine: adjustColors (real brightness/contrast/saturation)', () => {
  it('increases brightness toward white', () => {
    const img = makeImageData(2, 2, () => [100, 100, 100]);
    adjustColors(img, 50, 0, 0);
    expect(img.data[0]).toBeGreaterThan(100);
  });

  it('decreases brightness toward black', () => {
    const img = makeImageData(2, 2, () => [150, 150, 150]);
    adjustColors(img, -50, 0, 0);
    expect(img.data[0]).toBeLessThan(150);
  });

  it('clamps to 0..255 at extremes', () => {
    const img = makeImageData(1, 1, () => [250, 250, 250]);
    adjustColors(img, 100, 100, 0);
    expect(img.data[0]).toBeLessThanOrEqual(255);
    const dark = makeImageData(1, 1, () => [5, 5, 5]);
    adjustColors(dark, -100, 0, 0);
    expect(dark.data[0]).toBeGreaterThanOrEqual(0);
  });

  it('reduces saturation toward grayscale (equalises channels)', () => {
    const img = makeImageData(1, 1, () => [200, 80, 40]);
    adjustColors(img, 0, 0, -100);
    // at -100% saturation all channels converge to luma
    expect(Math.abs(img.data[0] - img.data[1])).toBeLessThanOrEqual(1);
    expect(Math.abs(img.data[1] - img.data[2])).toBeLessThanOrEqual(1);
  });

  it('increases contrast away from the midpoint', () => {
    const img = makeImageData(1, 1, () => [160, 160, 160]);
    adjustColors(img, 0, 60, 0);
    expect(img.data[0]).toBeGreaterThan(160); // above midpoint pushed higher
  });
});

describe('imageEngine: autoLevels (histogram stretch)', () => {
  it('stretches a compressed tonal range toward full 0..255', () => {
    // all pixels clustered 100..120 → after levels, darkest ≈ 0, brightest ≈ 255
    const img = makeImageData(10, 1, (x) => [100 + x * 2, 100 + x * 2, 100 + x * 2]);
    autoLevels(img);
    expect(img.data[0]).toBeLessThanOrEqual(5);
    const last = (img.width - 1) * 4;
    expect(img.data[last]).toBeGreaterThanOrEqual(250);
  });
});

describe('imageEngine: unsharpMask (real sharpening)', () => {
  it('returns input unchanged when amount is 0', () => {
    const img = makeImageData(4, 4, (x, y) => [(x * y) % 255, 0, 0]);
    const before = img.data[0];
    unsharpMask(img, 0, 1);
    expect(img.data[0]).toBe(before);
  });

  it('increases local edge contrast at a hard boundary', () => {
    // left half black, right half white → sharpening overshoots near the edge
    const img = makeImageData(8, 1, (x) => (x < 4 ? [0, 0, 0] : [255, 255, 255]));
    const edgeDarkBefore = img.data[3 * 4]; // last dark pixel (x=3)
    unsharpMask(img, 150, 1);
    // the dark pixel adjacent to the edge should get darker or stay at 0, and
    // the bright pixel adjacent should get brighter or clamp at 255 — verify
    // the mask did not wash out the edge (contrast preserved/increased).
    const edgeDarkAfter = img.data[3 * 4];
    const edgeBrightAfter = img.data[4 * 4];
    expect(edgeDarkAfter).toBeLessThanOrEqual(edgeDarkBefore);
    expect(edgeBrightAfter).toBe(255);
  });

  it('keeps all channels within 0..255', () => {
    const img = makeImageData(6, 6, (x, y) => [(x * 40) % 256, (y * 40) % 256, 128]);
    unsharpMask(img, 200, 2);
    for (let i = 0; i < img.data.length; i++) {
      expect(img.data[i]).toBeGreaterThanOrEqual(0);
      expect(img.data[i]).toBeLessThanOrEqual(255);
    }
  });
});

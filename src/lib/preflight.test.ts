import { describe, it, expect } from 'vitest';
import { readEmbeddedDpi, runPreflight, type PreflightInput } from './preflight';

/** Build a minimal PNG buffer containing a pHYs chunk declaring the given DPI. */
function pngWithPhys(dpi: number, unit = 1): ArrayBuffer {
  const ppu = Math.round(dpi / 0.0254); // DPI -> pixels per metre
  const bytes: number[] = [];
  const push32 = (n: number) => { bytes.push((n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255); };
  const pushStr = (s: string) => { for (const c of s) bytes.push(c.charCodeAt(0)); };
  // 8-byte PNG signature
  pushStr('\x89PNG\r\n\x1a\n');
  // pHYs chunk: length(9) + "pHYs" + xPPU(4) + yPPU(4) + unit(1) + CRC(4)
  push32(9);
  pushStr('pHYs');
  push32(ppu);
  push32(ppu);
  bytes.push(unit);
  push32(0); // CRC (not validated by the reader)
  // trailing IEND chunk so the walk has a well-formed stop point
  push32(0);
  pushStr('IEND');
  push32(0);
  const ab = new ArrayBuffer(bytes.length);
  const u8 = new Uint8Array(ab);
  u8.set(bytes);
  return ab;
}

/** Build a minimal JPEG buffer with a JFIF APP0 density segment. */
function jpegWithJfif(density: number, units = 1): ArrayBuffer {
  const bytes: number[] = [];
  const push16 = (n: number) => { bytes.push((n >>> 8) & 255, n & 255); };
  push16(0xffd8); // SOI
  push16(0xffe0); // APP0
  push16(16);     // segment length
  bytes.push(0x4a, 0x46, 0x49, 0x46, 0x00); // "JFIF\0"
  bytes.push(1, 2); // version
  bytes.push(units); // density units (1 = dpi)
  push16(density);  // X density
  push16(density);  // Y density
  bytes.push(0, 0); // thumbnail dims
  push16(0xffd9);   // EOI marker so the buffer is a realistic length
  const ab = new ArrayBuffer(bytes.length);
  new Uint8Array(ab).set(bytes);
  return ab;
}

describe('preflight: readEmbeddedDpi', () => {
  it('reads DPI from a PNG pHYs chunk', () => {
    expect(readEmbeddedDpi(pngWithPhys(300), 'photo.png')).toBe(300);
    expect(readEmbeddedDpi(pngWithPhys(72), 'shot.png')).toBe(72);
  });

  it('returns null for a PNG pHYs with unknown unit', () => {
    expect(readEmbeddedDpi(pngWithPhys(300, 0), 'photo.png')).toBeNull();
  });

  it('reads DPI from a JPEG JFIF APP0 (dots per inch)', () => {
    expect(readEmbeddedDpi(jpegWithJfif(300, 1), 'a.jpg')).toBe(300);
  });

  it('converts dots-per-cm JPEG density to DPI', () => {
    // 118 dpcm ≈ 300 dpi
    expect(readEmbeddedDpi(jpegWithJfif(118, 2), 'a.jpeg')).toBe(300);
  });

  it('returns null for non-image / unrecognised buffers', () => {
    const txt = new TextEncoder().encode('this is not an image at all').buffer;
    expect(readEmbeddedDpi(txt, 'notes.txt')).toBeNull();
    expect(readEmbeddedDpi(txt, 'photo.jpg')).toBeNull(); // fails SOI check
  });
});

function input(overrides: Partial<PreflightInput> = {}): PreflightInput {
  return {
    fileName: 'art.png',
    fileSizeMb: 4,
    format: 'image/png',
    widthPx: 2480,
    heightPx: 3508,
    embeddedDpi: 300,
    hasAlpha: false,
    printWidthMm: 210,
    printHeightMm: 297,
    hasBleed: true,
    colorMode: 'CMYK',
    ...overrides,
  };
}

describe('preflight: runPreflight', () => {
  it('passes a print-ready A4 CMYK file at 300 DPI', () => {
    const r = runPreflight(input());
    expect(r.effectiveDpi).toBeCloseTo(300, 0);
    expect(r.overallStatus).toBe('Pass');
    expect(r.preflightScore).toBeGreaterThanOrEqual(85);
    expect(r.checklistResults.find((c) => c.checkItem === 'Resolution & DPI')!.status).toBe('Pass');
  });

  it('fails a low-resolution file for the same print size', () => {
    const r = runPreflight(input({ widthPx: 600, heightPx: 800 }));
    expect(r.effectiveDpi).toBeLessThan(100);
    const res = r.checklistResults.find((c) => c.checkItem === 'Resolution & DPI')!;
    expect(res.status).toBe('Fail');
    expect(r.autoFixActions.length).toBeGreaterThan(0);
  });

  it('fails and drops score when bleed is missing', () => {
    const r = runPreflight(input({ hasBleed: false }));
    expect(r.checklistResults.find((c) => c.checkItem === 'Bleed & Trim Margins')!.status).toBe('Fail');
    expect(r.preflightScore).toBeLessThan(100);
  });

  it('warns on RGB and on lossy JPEG format', () => {
    const r = runPreflight(input({ colorMode: 'RGB', format: 'image/jpeg' }));
    expect(r.checklistResults.find((c) => c.checkItem === 'Color Space')!.status).toBe('Warning');
    expect(r.checklistResults.find((c) => c.checkItem === 'File Format')!.status).toBe('Warning');
  });

  it('warns when an alpha channel is present', () => {
    const r = runPreflight(input({ hasAlpha: true }));
    expect(r.checklistResults.find((c) => c.checkItem === 'Transparency')!.status).toBe('Warning');
  });

  it('clamps score to 0..100 and issues a certificate id', () => {
    const r = runPreflight(input({ widthPx: 50, heightPx: 50, hasBleed: false, colorMode: 'RGB', format: 'jpg' }));
    expect(r.preflightScore).toBeGreaterThanOrEqual(0);
    expect(r.preflightScore).toBeLessThanOrEqual(100);
    expect(r.certificate.certificateId).toMatch(/^PR-/);
    expect(r.certificate.inspector).toContain('deterministic');
  });
});

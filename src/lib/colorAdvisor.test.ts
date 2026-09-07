import { describe, it, expect } from 'vitest';
import {
  parseHex,
  rgbToHex,
  rgbToCmyk,
  cmykToRgb,
  rgbToLab,
  labToRgb,
  deltaE76,
  nearestPantone,
  isLikelyOutOfGamut,
  maxCmykChromaAtHue,
  analyzeColor,
  runColorAdvisor,
} from './colorAdvisor';

describe('colorAdvisor: hex parsing', () => {
  it('parses 6-digit, 3-digit and #-prefixed hex', () => {
    expect(parseHex('#FF0000')).toEqual({ r: 255, g: 0, b: 0 });
    expect(parseHex('ff0000')).toEqual({ r: 255, g: 0, b: 0 });
    expect(parseHex('#F00')).toEqual({ r: 255, g: 0, b: 0 });
    expect(parseHex('  #00ff00  ')).toEqual({ r: 0, g: 255, b: 0 });
  });

  it('rejects invalid hex', () => {
    expect(parseHex('#GGGGGG')).toBeNull();
    expect(parseHex('12345')).toBeNull();
    expect(parseHex('')).toBeNull();
  });

  it('round-trips rgbToHex', () => {
    expect(rgbToHex({ r: 255, g: 0, b: 0 })).toBe('#FF0000');
    expect(rgbToHex({ r: 0, g: 0, b: 0 })).toBe('#000000');
    expect(rgbToHex({ r: 255, g: 255, b: 255 })).toBe('#FFFFFF');
    // clamps out-of-range channels
    expect(rgbToHex({ r: 300, g: -20, b: 128 })).toBe('#FF0080');
  });
});

describe('colorAdvisor: RGB -> CMYK', () => {
  it('converts primaries and extremes with black generation', () => {
    expect(rgbToCmyk({ r: 255, g: 255, b: 255 })).toEqual({ c: 0, m: 0, y: 0, k: 0 });
    expect(rgbToCmyk({ r: 0, g: 0, b: 0 })).toEqual({ c: 0, m: 0, y: 0, k: 100 });
    expect(rgbToCmyk({ r: 255, g: 0, b: 0 })).toEqual({ c: 0, m: 100, y: 100, k: 0 });
    expect(rgbToCmyk({ r: 0, g: 255, b: 255 })).toEqual({ c: 100, m: 0, y: 0, k: 0 });
  });

  it('inverts approximately via cmykToRgb', () => {
    const rgb = { r: 200, g: 30, b: 90 };
    const back = cmykToRgb(rgbToCmyk(rgb));
    // rounding to whole percentages means up to a couple units of drift
    expect(Math.abs(back.r - rgb.r)).toBeLessThanOrEqual(3);
    expect(Math.abs(back.g - rgb.g)).toBeLessThanOrEqual(3);
    expect(Math.abs(back.b - rgb.b)).toBeLessThanOrEqual(3);
  });
});

describe('colorAdvisor: Lab & deltaE', () => {
  it('computes white L*≈100 and black L*≈0', () => {
    const white = rgbToLab({ r: 255, g: 255, b: 255 });
    const black = rgbToLab({ r: 0, g: 0, b: 0 });
    expect(white[0]).toBeCloseTo(100, 0);
    expect(black[0]).toBeCloseTo(0, 0);
  });

  it('deltaE is 0 for identical colours and symmetric', () => {
    const a = { r: 10, g: 200, b: 90 };
    const b = { r: 240, g: 20, b: 200 };
    expect(deltaE76(a, a)).toBeCloseTo(0, 6);
    expect(deltaE76(a, b)).toBeCloseTo(deltaE76(b, a), 6);
    expect(deltaE76(a, b)).toBeGreaterThan(0);
  });
});

describe('colorAdvisor: Pantone & gamut', () => {
  it('finds the nearest Pantone by deltaE', () => {
    const match = nearestPantone(parseHex('#E4002B')!);
    expect(match.name).toBe('Pantone 185 C');
    expect(match.deltaE).toBeCloseTo(0, 1);
  });

  it('flags vivid RGB as out-of-gamut', () => {
    const vivid = parseHex('#00FF00')!;
    const res = isLikelyOutOfGamut(vivid, rgbToCmyk(vivid));
    expect(res.out).toBe(true);
    expect(res.shift).toBeGreaterThan(6);
  });

  it('treats a mid grey as in-gamut', () => {
    const grey = parseHex('#808080')!;
    const res = isLikelyOutOfGamut(grey, rgbToCmyk(grey));
    expect(res.out).toBe(false);
  });
});

describe('colorAdvisor: Lab round-trip & gamut silhouette', () => {
  it('labToRgb inverts rgbToLab for in-gamut colours', () => {
    for (const hex of ['#FF0000', '#00FF00', '#0000FF', '#808080', '#C8102E', '#2E8B57']) {
      const rgb = parseHex(hex)!;
      const [L, a, b] = rgbToLab(rgb);
      const back = labToRgb(L, a, b);
      // allow ±1 for rounding through the gamma curve
      expect(Math.abs(back.r - rgb.r)).toBeLessThanOrEqual(1);
      expect(Math.abs(back.g - rgb.g)).toBeLessThanOrEqual(1);
      expect(Math.abs(back.b - rgb.b)).toBeLessThanOrEqual(1);
    }
  });

  it('maxCmykChromaAtHue interpolates between anchors and wraps 360', () => {
    expect(maxCmykChromaAtHue(196)).toBeCloseTo(51, 0); // cyan anchor
    expect(maxCmykChromaAtHue(196 + 360)).toBeCloseTo(51, 0);
    expect(maxCmykChromaAtHue(-164)).toBeCloseTo(51, 0); // negative wrap
    // midway between anchors is bounded by its neighbours
    const mid = maxCmykChromaAtHue(245);
    expect(mid).toBeGreaterThan(0);
  });
});

describe('colorAdvisor: real gamut clipping (regression for dead round-trip model)', () => {
  it('clips a vivid out-of-gamut colour and reports a real press preview', () => {
    // Pure sRGB green (#00FF00) has Lab chroma ~120 at hue ~136, far beyond the
    // ~62 CMYK green the press can reproduce, so it MUST be flagged.
    const vivid = parseHex('#00FF00')!;
    const res = isLikelyOutOfGamut(vivid);
    expect(res.out).toBe(true);
    expect(res.shift).toBeGreaterThan(6);
    // the clipped preview must differ from the source and be less saturated
    expect(res.clippedRgb).not.toEqual(vivid);
    const srcC = chromaOf(vivid);
    const clipC = chromaOf(res.clippedRgb);
    expect(clipC).toBeLessThan(srcC);
  });

  it('analyzeColor reports a duller correctedHex for an out-of-gamut colour', () => {
    const a = analyzeColor('#00FF00')!;
    expect(a.inGamut).toBe(false);
    expect(a.correctedHex).not.toBe('#00FF00');
    expect(a.gamutWarning).toMatch(/gamut/i);
  });

  it('analyzeColor leaves in-gamut colours unchanged in the press preview', () => {
    const a = analyzeColor('#808080')!;
    expect(a.inGamut).toBe(true);
    expect(a.correctedHex).toBe('#808080');
  });

  it('runColorAdvisor counts out-of-gamut colours in its status', () => {
    const res = runColorAdvisor(['#00FF00', '#808080'], 'Coated Art Paper');
    expect(res.gamutStatus).toMatch(/outside standard CMYK gamut/i);
    expect(res.analyzedColors.filter((c) => !c.inGamut)).toHaveLength(1);
  });
});

function chromaOf(rgb: { r: number; g: number; b: number }): number {
  const [, a, b] = rgbToLab(rgb);
  return Math.sqrt(a * a + b * b);
}

describe('colorAdvisor: analyzeColor & runColorAdvisor', () => {
  it('analyzeColor returns null on bad hex, full record on good hex', () => {
    expect(analyzeColor('not-a-colour')).toBeNull();
    const a = analyzeColor('#FF0000');
    expect(a).not.toBeNull();
    expect(a!.cmyk).toEqual({ c: 0, m: 100, y: 100, k: 0 });
    expect(a!.totalInkCoverage).toBe(200);
    expect(a!.cmykString).toContain('M: 100%');
    expect(a!.sourceHex).toBe('#FF0000');
  });

  it('aggregates gamut status and TAC across colours', () => {
    const res = runColorAdvisor(['#FF0000', '#00FF00', '#bogus'], 'Coated Art Paper');
    expect(res.analyzedColors).toHaveLength(2); // invalid hex filtered out
    expect(res.maxTotalInkCoverage).toBeGreaterThan(0);
    expect(res.gamutStatus).toMatch(/colours/i);
    expect(res.pressProfileRecommendation).toContain('GRACoL');
  });

  it('reports no valid colours when all inputs are invalid', () => {
    const res = runColorAdvisor(['zzz', '12'], 'Coated');
    expect(res.analyzedColors).toHaveLength(0);
    expect(res.gamutStatus).toMatch(/No valid hex/i);
  });

  it('applies a lower TAC limit for uncoated stock', () => {
    const coated = runColorAdvisor(['#000000'], 'Coated Art Paper');
    const uncoated = runColorAdvisor(['#000000'], 'Uncoated Offset');
    expect(coated.tacAdvice).toContain('300%');
    expect(uncoated.tacAdvice).toContain('240%');
  });
});

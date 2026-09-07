import { describe, it, expect } from 'vitest';
import { runPrintDoctor, diagnoseImageStats, type ImageStats } from './printDoctor';

function stats(overrides: Partial<ImageStats> = {}): ImageStats {
  return {
    fileName: 'photo.jpg',
    widthPx: 2480,
    heightPx: 3508,
    format: 'image/jpeg',
    fileSizeMb: 3,
    meanBrightness: 128,
    brightnessStdDev: 55,
    meanSaturation: 0.4,
    sharpnessScore: 0.25,
    overexposedPct: 1,
    underexposedPct: 1,
    ...overrides,
  };
}

describe('printDoctor: symptom rule base', () => {
  it('matches banding keywords', () => {
    const r = runPrintDoctor({ issueDescription: 'There is banding across the sheet', printType: 'Offset', paperType: 'Coated' });
    expect(r.findings.some((f) => /banding/i.test(f.title))).toBe(true);
  });

  it('matches blurry-text keywords', () => {
    const r = runPrintDoctor({ issueDescription: 'fine text looks blurry and soft', printType: 'Digital', paperType: 'Bond' });
    expect(r.findings.some((f) => /blurry/i.test(f.title))).toBe(true);
  });

  it('matches ghosting and hickey defects', () => {
    const ghost = runPrintDoctor({ issueDescription: 'ghosting appears behind solids', printType: '', paperType: '' });
    expect(ghost.findings.some((f) => /ghost/i.test(f.title))).toBe(true);
    const hickey = runPrintDoctor({ issueDescription: 'small hickeys / spots everywhere', printType: '', paperType: '' });
    expect(hickey.findings.some((f) => /hickey/i.test(f.title))).toBe(true);
  });

  it('falls back to a guidance finding when nothing matches', () => {
    const r = runPrintDoctor({ issueDescription: 'everything looks fine to me', printType: '', paperType: '' });
    expect(r.findings).toHaveLength(1);
    expect(r.findings[0].category).toBe('General');
    expect(r.findings[0].severity).toBe('Info');
  });

  it('sorts findings by severity (Critical before Info)', () => {
    const r = runPrintDoctor({
      issueDescription: 'banding',
      printType: '',
      paperType: '',
      imageStats: stats({ widthPx: 200, heightPx: 300 }), // far too low → Critical resolution
      targetPrintWidthMm: 210,
      targetDpi: 300,
    });
    const order = ['Critical', 'Major', 'Minor', 'Info'];
    const ranks = r.findings.map((f) => order.indexOf(f.severity));
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
    expect(r.findings[0].severity).toBe('Critical');
  });
});

describe('printDoctor: image statistics diagnosis', () => {
  it('flags insufficient resolution as Critical below 150 DPI', () => {
    const findings = diagnoseImageStats(stats({ widthPx: 500 }), 210, 300);
    const res = findings.find((f) => f.category === 'Resolution')!;
    expect(res.severity).toBe('Critical');
  });

  it('reports resolution OK when pixels are sufficient', () => {
    const findings = diagnoseImageStats(stats({ widthPx: 2480 }), 210, 300);
    const res = findings.find((f) => f.category === 'Resolution')!;
    expect(res.severity).toBe('Info');
  });

  it('flags soft images and over-sharpened images', () => {
    expect(diagnoseImageStats(stats({ sharpnessScore: 0.01 }), 210, 300).some((f) => f.category === 'Sharpness' && f.severity === 'Major')).toBe(true);
    expect(diagnoseImageStats(stats({ sharpnessScore: 0.9 }), 210, 300).some((f) => f.category === 'Sharpness' && f.severity === 'Minor')).toBe(true);
  });

  it('flags over/under exposure and flat contrast', () => {
    expect(diagnoseImageStats(stats({ meanBrightness: 220, overexposedPct: 30 }), 210, 300).some((f) => /Overexposed/i.test(f.title))).toBe(true);
    expect(diagnoseImageStats(stats({ meanBrightness: 20, underexposedPct: 40 }), 210, 300).some((f) => /Underexposed/i.test(f.title))).toBe(true);
    expect(diagnoseImageStats(stats({ brightnessStdDev: 10 }), 210, 300).some((f) => f.category === 'Contrast')).toBe(true);
  });

  it('notes near-grayscale content', () => {
    const findings = diagnoseImageStats(stats({ meanSaturation: 0.02 }), 210, 300);
    expect(findings.some((f) => f.category === 'Color' && /grayscale/i.test(f.title))).toBe(true);
  });

  it('attaches imageStats to the report when provided', () => {
    const s = stats();
    const r = runPrintDoctor({ issueDescription: 'banding', printType: '', paperType: '', imageStats: s });
    expect(r.imageStats).toEqual(s);
    expect(r.analyzedAt).toMatch(/\d{4}-\d{2}-\d{2}T/);
  });
});

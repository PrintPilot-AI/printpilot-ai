import { describe, it, expect } from 'vitest';
import {
  PRINT_SIZE_MAP,
  mmToPx,
  effectiveDpi,
  recommendedDpi,
  upsPerSheet,
  mmToInch,
  inchToMm,
} from './printSpecs';

describe('printSpecs — exact print dimensions', () => {
  it('stores the required ISO/US/card/passport sizes exactly', () => {
    expect(PRINT_SIZE_MAP['a3']).toMatchObject({ widthMm: 297, heightMm: 420 });
    expect(PRINT_SIZE_MAP['a4']).toMatchObject({ widthMm: 210, heightMm: 297 });
    expect(PRINT_SIZE_MAP['a5']).toMatchObject({ widthMm: 148, heightMm: 210 });
    expect(PRINT_SIZE_MAP['a6']).toMatchObject({ widthMm: 105, heightMm: 148 });
    expect(PRINT_SIZE_MAP['letter']).toMatchObject({ widthMm: 215.9, heightMm: 279.4 });
    expect(PRINT_SIZE_MAP['legal']).toMatchObject({ widthMm: 215.9, heightMm: 355.6 });
    expect(PRINT_SIZE_MAP['executive']).toMatchObject({ widthMm: 184.15, heightMm: 266.7 });
    expect(PRINT_SIZE_MAP['us-business-card']).toMatchObject({ widthMm: 88.9, heightMm: 50.8 });
    expect(PRINT_SIZE_MAP['cr80']).toMatchObject({ widthMm: 85.6, heightMm: 53.98 });
    expect(PRINT_SIZE_MAP['icao-passport']).toMatchObject({ widthMm: 35, heightMm: 45 });
  });

  it('converts mm <-> inch at 25.4', () => {
    expect(mmToInch(25.4)).toBeCloseTo(1, 6);
    expect(inchToMm(1)).toBeCloseTo(25.4, 6);
  });

  it('computes real mm -> pixel at DPI', () => {
    // A4 width at 300 DPI = 210 / 25.4 * 300 = 2480.31 -> 2480
    expect(mmToPx(210, 300)).toBe(2480);
    // ICAO 35mm at 300 DPI = 413.4 -> 413
    expect(mmToPx(35, 300)).toBe(413);
    // 45mm at 300 DPI = 531.496 -> 531 (round)
    expect(mmToPx(45, 300)).toBe(531);
  });

  it('computes effective DPI from pixels and physical size', () => {
    // 2480px over 210mm => ~300 DPI
    expect(Math.round(effectiveDpi(2480, 210))).toBe(300);
    expect(effectiveDpi(100, 0)).toBe(0);
  });

  it('recommends DPI by viewing distance', () => {
    expect(recommendedDpi(88.9, 50.8)).toBe(300); // business card
    expect(recommendedDpi(210, 297)).toBe(300); // A4
    expect(recommendedDpi(457.2, 609.6)).toBe(200); // 18x24 poster, long edge exactly 24in
    expect(recommendedDpi(609.6, 914.4)).toBe(150); // 24x36 poster, long edge 36in
    expect(recommendedDpi(400, 500)).toBe(200); // ~19.7in long edge
  });

  it('nests US business cards onto an A4 sheet (choosing the best orientation)', () => {
    const r = upsPerSheet(88.9, 50.8, 210, 297, 0);
    // Unrotated item on portrait sheet: 2×5 = 10 ups. Rotating either the item
    // or the sheet yields 3×4 = 12 ups, so the optimiser must find 12.
    expect(r.ups).toBe(12);
    expect(r.columns * r.rows).toBe(12);
    expect(r.columns).toBeGreaterThan(0);
    expect(r.rows).toBeGreaterThan(0);
  });

  it('keeps the unrotated orientation when it is optimal', () => {
    // A6 (105×148) onto A4 (210×297): 2×2 either way; assert it is stable and correct.
    const r = upsPerSheet(105, 148, 210, 297, 0);
    expect(r.ups).toBe(4);
    expect(r.columns * r.rows).toBe(4);
  });

  it('returns 0 ups when the item cannot fit', () => {
    const r = upsPerSheet(500, 500, 210, 297, 0);
    expect(r.ups).toBe(0);
  });
});

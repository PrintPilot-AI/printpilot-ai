import { describe, it, expect } from 'vitest';
import { estimateCost, DEFAULT_RATES, FINISHING_RATES_PER_1000, type CostInput } from './costEstimator';

function base(overrides: Partial<CostInput> = {}): CostInput {
  return {
    itemName: 'Business cards',
    quantity: 1000,
    pagesPerItem: 2,
    itemWidthMm: 88.9,
    itemHeightMm: 50.8,
    sheetWidthMm: 320,
    sheetHeightMm: 450,
    paperGsm: 350,
    paperType: 'Art Card',
    colorType: '4/4 CMYK Double Sided',
    finishing: ['Gloss Lamination'],
    turnaroundDays: 3,
    ...overrides,
  };
}

describe('costEstimator: validation', () => {
  it('throws on non-positive quantity', () => {
    expect(() => estimateCost(base({ quantity: 0 }))).toThrow(/positive/i);
    expect(() => estimateCost(base({ quantity: -5 }))).toThrow(/positive/i);
    expect(() => estimateCost(base({ quantity: NaN }))).toThrow(/positive/i);
  });

  it('throws when the item does not fit the parent sheet', () => {
    expect(() => estimateCost(base({ itemWidthMm: 500, itemHeightMm: 500, sheetWidthMm: 320, sheetHeightMm: 450 })))
      .toThrow(/does not fit/i);
  });
});

describe('costEstimator: arithmetic integrity', () => {
  it('produces a coherent, positive breakdown', () => {
    const c = estimateCost(base());
    expect(c.totalBaseProductionCost).toBeGreaterThan(0);
    expect(c.suggestedRetailPrice).toBeGreaterThan(c.totalBaseProductionCost);
    expect(c.perUnitPrice).toBeGreaterThan(0);
    expect(c.paperWeightKg).toBeGreaterThan(0);
    // total = sum of components (each rounded to cents)
    const sum =
      c.estimatedRawPaperCost +
      c.estimatedPlateAndPrepressCost +
      c.estimatedInkSolventCost +
      c.estimatedFinishingCost +
      c.labourAndMachineCost +
      c.rushSurcharge;
    expect(Math.abs(sum - c.totalBaseProductionCost)).toBeLessThanOrEqual(0.05);
  });

  it('sheet optimisation reflects real nesting', () => {
    const c = estimateCost(base());
    const so = c.sheetOptimization;
    expect(so.upsPerSheet).toBeGreaterThan(0);
    expect(so.totalParentSheetsRequired).toBe(so.sheetsBeforeSpoilage + so.spoilageAllowanceSheets);
    expect(so.spoilageAllowanceSheets).toBeGreaterThan(0); // 6% default spoilage
  });

  it('double-sided costs more ink than single-sided', () => {
    const dbl = estimateCost(base({ colorType: '4/4 CMYK Double Sided' }));
    const sgl = estimateCost(base({ colorType: '4/0 CMYK Single Sided' }));
    expect(dbl.estimatedInkSolventCost).toBeGreaterThan(sgl.estimatedInkSolventCost);
  });

  it('finishing cost scales with quantity and per-op rate', () => {
    const c = estimateCost(base({ quantity: 2000, finishing: ['Spot UV'] }));
    // Spot UV = $45 per 1000 → 2000 items = $90
    expect(c.estimatedFinishingCost).toBeCloseTo((2000 / 1000) * FINISHING_RATES_PER_1000['Spot UV'], 2);
  });

  it('unknown finishing operations fall back to a base trade rate', () => {
    const c = estimateCost(base({ quantity: 1000, finishing: ['Laser Cut Doilies'] }));
    expect(c.estimatedFinishingCost).toBeCloseTo(20, 2);
  });

  it('applies a rush surcharge under 3 days and none at/over 3', () => {
    const rush = estimateCost(base({ turnaroundDays: 1 }));
    const std = estimateCost(base({ turnaroundDays: 3 }));
    expect(rush.rushSurcharge).toBeGreaterThan(0);
    expect(std.rushSurcharge).toBe(0);
  });

  it('applies volume-tier margin targets', () => {
    expect(estimateCost(base({ quantity: 500 })).estimatedProfitMargin).toBe('40%');
    expect(estimateCost(base({ quantity: 1000 })).estimatedProfitMargin).toBe('35%');
    expect(estimateCost(base({ quantity: 5000 })).estimatedProfitMargin).toBe('30%');
  });

  it('honours custom rate overrides', () => {
    const cheap = estimateCost(base({ rates: { ...DEFAULT_RATES, paperPricePerTonne: 0 } }));
    expect(cheap.estimatedRawPaperCost).toBe(0);
  });

  it('always returns at least one savings tip', () => {
    expect(estimateCost(base()).costSavingsTips.length).toBeGreaterThan(0);
  });
});

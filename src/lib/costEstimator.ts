/**
 * Print Cost Estimator — deterministic commercial print costing model.
 *
 * Every figure is computed from published-style unit rates:
 *   paper cost = sheets used × sheet area × GSM-derived weight × $/tonne
 *   plate/prepress, ink, finishing, labour and machine time are additive
 *   rate cards. Volume discounts and spoilage are modelled explicitly.
 *
 * Rates are editable inputs with sensible defaults, so results are transparent
 * and reproducible — not invented numbers.
 */

import { upsPerSheet } from './printSpecs';

export interface CostInput {
  itemName: string;
  quantity: number;
  pagesPerItem: number; // e.g. 8 for an 8-page brochure
  itemWidthMm: number;
  itemHeightMm: number;
  sheetWidthMm: number;
  sheetHeightMm: number;
  paperGsm: number;
  paperType: string;
  colorType: '4/0 CMYK Single Sided' | '4/4 CMYK Double Sided' | '1/1 Black & White' | '2/2 Two-Colour';
  finishing: string[];
  turnaroundDays: number;
  // Rate card (defaults provided)
  rates?: Partial<CostRates>;
}

export interface CostRates {
  paperPricePerTonne: number; // $ per tonne of stock
  plateCostPerColourSide: number; // per plate / imaging
  prepressSetup: number; // one-off file prep, imposition, proofing
  inkCostPer1000Sheets4c: number; // full CMYK coverage cost
  machineRunCostPer1000Sheets: number; // press time
  labourRatePerHour: number;
  sheetsPerHour: number; // press speed
  spoilagePct: number; // make-ready + running waste
  rushMultiplierPerDayUnder3: number; // expediting surcharge
}

export const DEFAULT_RATES: CostRates = {
  paperPricePerTonne: 1400,
  plateCostPerColourSide: 12,
  prepressSetup: 45,
  inkCostPer1000Sheets4c: 22,
  machineRunCostPer1000Sheets: 55,
  labourRatePerHour: 38,
  sheetsPerHour: 6000,
  spoilagePct: 6,
  rushMultiplierPerDayUnder3: 0.08,
};

/** Per-operation finishing cost, per 1000 finished items (typical trade rates). */
export const FINISHING_RATES_PER_1000: Record<string, number> = {
  'Thermal Velvet Lamination': 28,
  'Gloss Lamination': 22,
  'Matte Lamination': 22,
  'Spot UV': 45,
  'Foil Stamping': 70,
  'Embossing / Debossing': 60,
  'Die Cutting': 55,
  'Creasing / Scoring': 18,
  'Saddle Stitching': 35,
  'Perfect Binding': 90,
  'Corner Rounding': 12,
  'Drilling / Hole Punch': 10,
};

export interface SheetOptimization {
  upsPerSheet: number;
  columns: number;
  rows: number;
  itemRotated: boolean;
  sheetsBeforeSpoilage: number;
  spoilageAllowanceSheets: number;
  totalParentSheetsRequired: number;
  paperWastePercent: string;
}

export interface CostBreakdown {
  estimatedRawPaperCost: number;
  estimatedPlateAndPrepressCost: number;
  estimatedInkSolventCost: number;
  estimatedFinishingCost: number;
  labourAndMachineCost: number;
  rushSurcharge: number;
  totalBaseProductionCost: number;
  suggestedRetailPrice: number;
  estimatedProfitMargin: string;
  perUnitPrice: number;
  sheetOptimization: SheetOptimization;
  costSavingsTips: string[];
  paperWeightKg: number;
}

function colourFactor(colorType: CostInput['colorType']): number {
  switch (colorType) {
    case '4/4 CMYK Double Sided': return 2;
    case '4/0 CMYK Single Sided': return 1;
    case '2/2 Two-Colour': return 1; // 2 colours × 2 sides ≈ 4 colour passes ≈ full CMYK cost
    case '1/1 Black & White': return 0.35;
    default: return 1;
  }
}

export function estimateCost(input: CostInput): CostBreakdown {
  const rates = { ...DEFAULT_RATES, ...(input.rates || {}) };
  if (!Number.isFinite(input.quantity) || input.quantity <= 0) {
    throw new Error('Quantity must be a positive number.');
  }

  // --- Sheet utilisation (real nesting math) ---
  const nesting = upsPerSheet(input.itemWidthMm, input.itemHeightMm, input.sheetWidthMm, input.sheetHeightMm, 3 /* 3mm gutter for grip+trim */);
  if (nesting.ups === 0) {
    throw new Error(`Item (${input.itemWidthMm} × ${input.itemHeightMm}mm) does not fit on the parent sheet (${input.sheetWidthMm} × ${input.sheetHeightMm}mm).`);
  }

  const sheetsForPages = Math.max(1, Math.ceil(input.pagesPerItem / 2)); // sheets per finished item (2 pages per side-imposition unit)
  const sheetsBeforeSpoilage = Math.ceil((input.quantity * sheetsForPages) / nesting.ups);
  const spoilageSheets = Math.ceil(sheetsBeforeSpoilage * (rates.spoilagePct / 100));
  const totalSheets = sheetsBeforeSpoilage + spoilageSheets;
  const paperWastePercent = ((spoilageSheets / totalSheets) * 100).toFixed(1);

  // --- Paper cost by real weight: area(m²) × GSM(g/m²) ---
  const sheetAreaM2 = (input.sheetWidthMm / 1000) * (input.sheetHeightMm / 1000);
  const paperWeightKg = sheetAreaM2 * input.paperGsm * totalSheets / 1000; // g -> kg
  const paperCost = (paperWeightKg / 1000) * rates.paperPricePerTonne;

  // --- Plates + prepress ---
  const colourSides = input.colorType.includes('Double') || input.colorType === '2/2 Two-Colour' ? 2 : 1;
  const plateCost = rates.plateCostPerColourSide * colourSides * Math.max(1, sheetsForPages);
  const prepressCost = plateCost + rates.prepressSetup;

  // --- Ink ---
  const cf = colourFactor(input.colorType);
  const inkCost = (totalSheets / 1000) * rates.inkCostPer1000Sheets4c * cf;

  // --- Machine + labour ---
  const runHours = totalSheets / rates.sheetsPerHour;
  const machineCost = (totalSheets / 1000) * rates.machineRunCostPer1000Sheets * cf;
  const labourCost = runHours * rates.labourRatePerHour * 1.5; // operator + finishing helper

  // --- Finishing ---
  let finishingCost = 0;
  for (const op of input.finishing) {
    const rate = FINISHING_RATES_PER_1000[op] ?? 20; // unknown ops get a base trade rate
    finishingCost += (input.quantity / 1000) * rate;
  }

  const baseCost = paperCost + prepressCost + inkCost + machineCost + labourCost + finishingCost;

  // --- Rush surcharge ---
  let rushSurcharge = 0;
  if (input.turnaroundDays > 0 && input.turnaroundDays < 3) {
    rushSurcharge = baseCost * rates.rushMultiplierPerDayUnder3 * (3 - input.turnaroundDays);
  }

  const total = baseCost + rushSurcharge;

  // --- Volume discount tiers applied to retail markup ---
  let marginTarget = 0.40;
  if (input.quantity >= 5000) marginTarget = 0.30;
  else if (input.quantity >= 1000) marginTarget = 0.35;

  const suggestedRetail = total / (1 - marginTarget);
  const perUnit = suggestedRetail / input.quantity;

  // --- Savings tips derived from the actual numbers ---
  const tips: string[] = [];
  const utilization = (nesting.ups * input.itemWidthMm * input.itemHeightMm) / (input.sheetWidthMm * input.sheetHeightMm);
  if (utilization < 0.75) {
    tips.push(`Sheet utilisation is only ${(utilization * 100).toFixed(0)}% (${nesting.ups}-up). A smaller parent sheet or a rotated gang-run layout could cut paper cost (~$${paperCost.toFixed(2)}).`);
  }
  if (spoilageSheets > 0) {
    tips.push(`Spoilage allowance is ${spoilageSheets} sheets (${paperWastePercent}%). Reducing make-ready waste by 1% saves ~$${((paperCost + machineCost) * 0.01 / (rates.spoilagePct / 100 || 1) ).toFixed(2)}.`);
  }
  if (rushSurcharge > 0) {
    tips.push(`Turnaround of ${input.turnaroundDays} day(s) adds a $${rushSurcharge.toFixed(2)} rush surcharge — standard 3-day service removes it.`);
  }
  if (input.colorType === '4/4 CMYK Double Sided' && input.pagesPerItem > 2) {
    tips.push('Gang-run multiple jobs on the same sheet to share plate and make-ready cost across customers.');
  }
  if (tips.length === 0) {
    tips.push('Layout is efficient. Consider ordering in the next volume tier (1,000+ / 5,000+) to reach a lower retail margin target.');
  }

  const round = (n: number) => Math.round(n * 100) / 100;

  return {
    estimatedRawPaperCost: round(paperCost),
    estimatedPlateAndPrepressCost: round(prepressCost),
    estimatedInkSolventCost: round(inkCost),
    estimatedFinishingCost: round(finishingCost),
    labourAndMachineCost: round(machineCost + labourCost),
    rushSurcharge: round(rushSurcharge),
    totalBaseProductionCost: round(total),
    suggestedRetailPrice: round(suggestedRetail),
    estimatedProfitMargin: `${Math.round(marginTarget * 100)}%`,
    perUnitPrice: round(perUnit),
    sheetOptimization: {
      upsPerSheet: nesting.ups,
      columns: nesting.columns,
      rows: nesting.rows,
      itemRotated: nesting.itemRotated,
      sheetsBeforeSpoilage,
      spoilageAllowanceSheets: spoilageSheets,
      totalParentSheetsRequired: totalSheets,
      paperWastePercent: `${paperWastePercent}%`,
    },
    costSavingsTips: tips,
    paperWeightKg: round(paperWeightKg),
  };
}

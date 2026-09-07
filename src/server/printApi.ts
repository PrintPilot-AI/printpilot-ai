/**
 * Deterministic print-toolkit API.
 *
 * These handlers run the SAME pure engines the browser uses, so results are
 * identical whether computed client-side or server-side. They contain no
 * network calls, no model inference and no fabricated output — every value is
 * derived arithmetically from the request payload.
 */

import { runPrintDoctor, type ImageStats, type DoctorReport } from '../lib/printDoctor';
import { runPreflight, type PreflightInput, type PreflightResult } from '../lib/preflight';
import { estimateCost, type CostInput, type CostBreakdown } from '../lib/costEstimator';
import { runColorAdvisor, type ColorAdviceResult } from '../lib/colorAdvisor';
import { buildPosterLayout, posterToSvg, type PosterInput, type PosterLayout } from '../lib/posterEngine';

function num(value: unknown, fallback = 0): number {
  const n = typeof value === 'number' ? value : parseFloat(String(value ?? ''));
  return Number.isFinite(n) ? n : fallback;
}

function str(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function bool(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

export interface ApiHandlers {
  doctor(body: any): DoctorReport;
  preflight(body: any): PreflightResult;
  cost(body: any): CostBreakdown;
  color(body: any): ColorAdviceResult;
  poster(body: any): { layout: PosterLayout; svg: string };
}

export const apiHandlers: ApiHandlers = {
  doctor(body) {
    const imageStats: ImageStats | null = body?.imageStats && typeof body.imageStats === 'object'
      ? {
          fileName: str(body.imageStats.fileName),
          widthPx: num(body.imageStats.widthPx),
          heightPx: num(body.imageStats.heightPx),
          format: str(body.imageStats.format),
          fileSizeMb: num(body.imageStats.fileSizeMb),
          meanBrightness: num(body.imageStats.meanBrightness),
          brightnessStdDev: num(body.imageStats.brightnessStdDev),
          meanSaturation: num(body.imageStats.meanSaturation),
          sharpnessScore: num(body.imageStats.sharpnessScore),
          overexposedPct: num(body.imageStats.overexposedPct),
          underexposedPct: num(body.imageStats.underexposedPct),
        }
      : null;

    return runPrintDoctor({
      issueDescription: str(body?.issueDescription),
      printType: str(body?.printType, 'General Printing'),
      paperType: str(body?.paperType, 'Standard Stock'),
      imageStats,
      targetPrintWidthMm: body?.targetPrintWidthMm !== undefined ? num(body.targetPrintWidthMm, 210) : undefined,
      targetDpi: body?.targetDpi !== undefined ? num(body.targetDpi, 300) : undefined,
    });
  },

  preflight(body) {
    const input: PreflightInput = {
      fileName: str(body?.fileName, 'upload'),
      fileSizeMb: num(body?.fileSizeMb),
      format: str(body?.format, 'application/octet-stream'),
      widthPx: num(body?.widthPx),
      heightPx: num(body?.heightPx),
      embeddedDpi: body?.embeddedDpi == null ? null : num(body.embeddedDpi),
      hasAlpha: typeof body?.hasAlpha === 'boolean' ? body.hasAlpha : null,
      printWidthMm: num(body?.printWidthMm, 210),
      printHeightMm: num(body?.printHeightMm, 297),
      hasBleed: bool(body?.hasBleed, false),
      colorMode: ['RGB', 'CMYK', 'Grayscale'].includes(str(body?.colorMode)) ? body.colorMode : 'RGB',
    };
    return runPreflight(input);
  },

  cost(body) {
    const input: CostInput = {
      itemName: str(body?.itemName, 'Print job'),
      quantity: num(body?.quantity, 0),
      pagesPerItem: Math.max(1, Math.round(num(body?.pagesPerItem, 2))),
      itemWidthMm: num(body?.itemWidthMm, 210),
      itemHeightMm: num(body?.itemHeightMm, 297),
      sheetWidthMm: num(body?.sheetWidthMm, 320),
      sheetHeightMm: num(body?.sheetHeightMm, 450),
      paperGsm: num(body?.paperGsm, 150),
      paperType: str(body?.paperType, 'Art Card'),
      colorType: str(body?.colorType, '4/4 CMYK Double Sided') as CostInput['colorType'],
      finishing: Array.isArray(body?.finishing) ? body.finishing.map((f: unknown) => str(f)) : [],
      turnaroundDays: num(body?.turnaroundDays, 3),
    };
    return estimateCost(input);
  },

  color(body) {
    const colors = Array.isArray(body?.rgbColors)
      ? body.rgbColors.map((c: unknown) => str(c)).filter(Boolean)
      : str(body?.rgbColors).split(',').map((c) => c.trim()).filter(Boolean);
    return runColorAdvisor(colors, str(body?.targetSubstrate, 'Coated Art Paper'));
  },

  poster(body) {
    const input: PosterInput = {
      title: str(body?.title, 'Poster'),
      subtitle: str(body?.subtitle, ''),
      category: str(body?.category, 'Event'),
      colorSchemeId: str(body?.colorSchemeId, 'neon'),
      sizeId: str(body?.sizeId, 'photo-18x24'),
      eventDate: str(body?.eventDate, ''),
      location: str(body?.location, ''),
      includeCropMarks: bool(body?.includeCropMarks, true),
    };
    const layout = buildPosterLayout(input);
    return { layout, svg: posterToSvg(layout) };
  },
};

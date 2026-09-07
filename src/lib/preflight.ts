/**
 * Pre-flight Checker — deterministic print-readiness evaluation of a real
 * uploaded file. Uses actual metadata read from the file (dimensions, format,
 * size; embedded DPI from JFIF/PNG pHYs chunks where present).
 */

import { effectiveDpi, recommendedDpi } from './printSpecs';

export type CheckStatus = 'Pass' | 'Warning' | 'Fail';

export interface ChecklistItem {
  checkItem: string;
  status: CheckStatus;
  detail: string;
}

export interface FileMetadata {
  fileName: string;
  fileSizeMb: number;
  format: string;
  widthPx: number;
  heightPx: number;
  embeddedDpi: number | null; // read from file headers when present
  hasAlpha: boolean | null;
}

export interface PreflightInput extends FileMetadata {
  printWidthMm: number;
  printHeightMm: number;
  hasBleed: boolean;
  colorMode: 'RGB' | 'CMYK' | 'Grayscale';
}

export interface PreflightResult {
  overallStatus: CheckStatus;
  preflightScore: number;
  effectiveDpi: number;
  checklistResults: ChecklistItem[];
  autoFixActions: string[];
  certificate: {
    certificateId: string;
    timestamp: string;
    inspector: string;
  };
}

/**
 * Read embedded DPI from a JPEG (JFIF APP0 density) or PNG (pHYs chunk) file.
 * Returns null when the file carries no density metadata (common for
 * screenshots and web images).
 */
export function readEmbeddedDpi(buffer: ArrayBuffer, fileName: string): number | null {
  const view = new DataView(buffer);
  const lower = fileName.toLowerCase();

  if (lower.endsWith('.png') && buffer.byteLength > 33) {
    // Walk chunks looking for pHYs
    let offset = 8; // skip PNG signature
    while (offset + 12 <= buffer.byteLength) {
      const len = view.getUint32(offset);
      const type = String.fromCharCode(
        view.getUint8(offset + 4), view.getUint8(offset + 5),
        view.getUint8(offset + 6), view.getUint8(offset + 7),
      );
      if (type === 'pHYs' && len >= 9) {
        const xPPU = view.getUint32(offset + 8);
        const unit = view.getUint8(offset + 16);
        if (unit === 1 && xPPU > 0) {
          return Math.round(xPPU * 0.0254); // pixels/metre -> DPI
        }
        return null;
      }
      if (type === 'IDAT') break;
      offset += 12 + len;
    }
    return null;
  }

  if ((lower.endsWith('.jpg') || lower.endsWith('.jpeg')) && buffer.byteLength > 20) {
    if (view.getUint16(0) !== 0xffd8) return null;
    // JFIF APP0: identifier "JFIF\0" at 6..10, version at 11..12, density
    // units at 13, Xdensity at 14..15 (all offsets include the 2-byte SOI).
    if (view.getUint16(2) === 0xffe0) {
      const units = view.getUint8(13);
      const xDensity = view.getUint16(14);
      if (units === 1 && xDensity > 0) return xDensity; // dots per inch
      if (units === 2 && xDensity > 0) return Math.round(xDensity * 2.54); // dots per cm
    }
    // EXIF APP1 with XResolution is rarer for print; fall through
    return null;
  }

  return null;
}

export function runPreflight(input: PreflightInput): PreflightResult {
  const checklist: ChecklistItem[] = [];
  const autoFix: string[] = [];
  let score = 100;

  const effDpi = Math.round(effectiveDpi(input.widthPx, input.printWidthMm));
  const targetDpi = recommendedDpi(input.printWidthMm, input.printHeightMm);

  // 1. Resolution
  if (effDpi >= targetDpi) {
    checklist.push({
      checkItem: 'Resolution & DPI',
      status: 'Pass',
      detail: `${effDpi} DPI effective at ${input.printWidthMm}mm width — meets the ${targetDpi} DPI target for this print size.`,
    });
  } else if (effDpi >= targetDpi * 0.6) {
    score -= 20;
    checklist.push({
      checkItem: 'Resolution & DPI',
      status: 'Warning',
      detail: `${effDpi} DPI is below the ${targetDpi} DPI target for ${input.printWidthMm} × ${input.printHeightMm}mm. Acceptable only for longer viewing distances.`,
    });
    autoFix.push(`Upscale ~${Math.ceil((targetDpi / effDpi) * 10) / 10}x with the Image Enhancer or reduce trim size to ${Math.round(input.widthPx / targetDpi * 25.4)}mm width.`);
  } else {
    score -= 40;
    checklist.push({
      checkItem: 'Resolution & DPI',
      status: 'Fail',
      detail: `${effDpi} DPI is far below the ${targetDpi} DPI requirement. The print will show visible pixelation.`,
    });
    autoFix.push(`Re-export the source at higher resolution — minimum ${Math.round((input.printWidthMm / 25.4) * targetDpi)}px wide for ${targetDpi} DPI.`);
  }

  // 2. Embedded DPI metadata
  if (input.embeddedDpi !== null && input.embeddedDpi < 72) {
    score -= 5;
    checklist.push({
      checkItem: 'Embedded DPI Metadata',
      status: 'Warning',
      detail: `File declares ${input.embeddedDpi} DPI in its header. Layout apps may place it larger than intended.`,
    });
    autoFix.push('Set the embedded density tag to 300 DPI on export (pixel dimensions must support it).');
  } else {
    checklist.push({
      checkItem: 'Embedded DPI Metadata',
      status: 'Pass',
      detail: input.embeddedDpi !== null
        ? `Header declares ${input.embeddedDpi} DPI (physical placement is governed by effective DPI above).`
        : 'No density tag in file — placement must be set explicitly at trim size in the layout app.',
    });
  }

  // 3. Color mode
  if (input.colorMode === 'CMYK') {
    checklist.push({ checkItem: 'Color Space', status: 'Pass', detail: 'File is CMYK — press ready.' });
  } else if (input.colorMode === 'Grayscale') {
    checklist.push({ checkItem: 'Color Space', status: 'Pass', detail: 'Grayscale K-only file — no RGB conversion risk.' });
  } else {
    score -= 15;
    checklist.push({
      checkItem: 'Color Space',
      status: 'Warning',
      detail: 'File is RGB. It will be converted to CMYK at the RIP; vibrant RGB blues/greens may shift duller.',
    });
    autoFix.push('Convert to CMYK with GRACoL2013 or FOGRA39 profile before submitting, and soft-proof the conversion.');
  }

  // 4. Bleed
  if (input.hasBleed) {
    checklist.push({ checkItem: 'Bleed & Trim Margins', status: 'Pass', detail: '3mm bleed confirmed by operator.' });
  } else {
    score -= 20;
    checklist.push({
      checkItem: 'Bleed & Trim Margins',
      status: 'Fail',
      detail: 'No bleed declared. Full-bleed prints risk white edges after guillotine cutting (±1mm tolerance).',
    });
    autoFix.push(`Extend the artwork canvas to ${input.printWidthMm + 6} × ${input.printHeightMm + 6}mm (3mm bleed per side) and keep text ≥ 5mm inside trim.`);
  }

  // 5. Format
  const lossyWebFormats = ['image/jpeg', 'image/webp', 'jpeg', 'jpg', 'webp'];
  if (lossyWebFormats.some((f) => input.format.toLowerCase().includes(f))) {
    score -= 5;
    checklist.push({
      checkItem: 'File Format',
      status: 'Warning',
      detail: `${input.format} is lossy-compressed. Check for JPEG artefacts around sharp edges and text.`,
    });
    autoFix.push('Re-save as PNG/TIFF from the original source if artefacts are visible at 100% zoom.');
  } else {
    checklist.push({ checkItem: 'File Format', status: 'Pass', detail: `${input.format} — lossless or vector container suitable for print.` });
  }

  // 6. Alpha channel
  if (input.hasAlpha === true) {
    checklist.push({
      checkItem: 'Transparency',
      status: 'Warning',
      detail: 'Image contains an alpha channel. Transparency must be flattened against the final substrate colour before RIP.',
    });
    autoFix.push('Flatten transparency onto the intended paper/background colour and re-export.');
  }

  // 7. File size sanity
  if (input.fileSizeMb > 200) {
    score -= 5;
    checklist.push({ checkItem: 'File Size', status: 'Warning', detail: `${input.fileSizeMb.toFixed(1)} MB is very large — verify upload bandwidth and RIP processing limits.` });
  } else {
    checklist.push({ checkItem: 'File Size', status: 'Pass', detail: `${input.fileSizeMb.toFixed(2)} MB within normal handling limits.` });
  }

  score = Math.max(0, Math.min(100, score));
  const overallStatus: CheckStatus = score >= 85 ? 'Pass' : score >= 60 ? 'Warning' : 'Fail';

  return {
    overallStatus,
    preflightScore: score,
    effectiveDpi: effDpi,
    checklistResults: checklist,
    autoFixActions: autoFix,
    certificate: {
      certificateId: `PR-${Date.now().toString(36).toUpperCase()}`,
      timestamp: new Date().toISOString(),
      inspector: 'PrintPilot Pre-flight Engine v2 (deterministic)',
    },
  };
}

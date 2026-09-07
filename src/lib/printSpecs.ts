/**
 * Canonical print specifications and unit conversions.
 * All physical sizes are stored in millimetres; pixel sizes are always derived
 * with a real mm -> inch -> pixel conversion at the requested DPI.
 */

export const MM_PER_INCH = 25.4;

export interface PrintSizeSpec {
  id: string;
  name: string;
  widthMm: number;
  heightMm: number;
  category: 'ISO Standard' | 'US Standard' | 'Photo' | 'Card' | 'ID Photo' | 'Large Format';
  description: string;
}

export const PRINT_SIZES: PrintSizeSpec[] = [
  { id: 'a2', name: 'A2', widthMm: 420, heightMm: 594, category: 'ISO Standard', description: 'Posters, flip charts, large presentation boards' },
  { id: 'a3', name: 'A3', widthMm: 297, heightMm: 420, category: 'ISO Standard', description: 'Large posters, architectural drawings, ledger prints' },
  { id: 'a4', name: 'A4', widthMm: 210, heightMm: 297, category: 'ISO Standard', description: 'Global commercial standard for letters, reports, brochures' },
  { id: 'a5', name: 'A5', widthMm: 148, heightMm: 210, category: 'ISO Standard', description: 'Notepads, flyers, pocket booklets, invites' },
  { id: 'a6', name: 'A6', widthMm: 105, heightMm: 148, category: 'ISO Standard', description: 'Postcards, table tents, pocket cards' },
  { id: 'letter', name: 'US Letter', widthMm: 215.9, heightMm: 279.4, category: 'US Standard', description: 'Standard North American office & business documents' },
  { id: 'legal', name: 'US Legal', widthMm: 215.9, heightMm: 355.6, category: 'US Standard', description: 'Contracts, legal briefs, extended accounting statements' },
  { id: 'executive', name: 'Executive', widthMm: 184.15, heightMm: 266.7, category: 'US Standard', description: 'Corporate stationery, executive memo sheets' },
  { id: 'photo-4x6', name: 'Photo 4 × 6 in', widthMm: 101.6, heightMm: 152.4, category: 'Photo', description: 'Standard photographic portrait prints' },
  { id: 'photo-5x7', name: 'Photo 5 × 7 in', widthMm: 127, heightMm: 177.8, category: 'Photo', description: 'Enlarged photo prints & greeting cards' },
  { id: 'us-business-card', name: 'US Business Card', widthMm: 88.9, heightMm: 50.8, category: 'Card', description: 'US standard business card (3.5 × 2 in)' },
  { id: 'cr80', name: 'CR80 ID Card', widthMm: 85.6, heightMm: 53.98, category: 'Card', description: 'ISO/IEC 7810 ID-1 plastic card standard' },
  { id: 'icao-passport', name: 'ICAO Passport Photo', widthMm: 35, heightMm: 45, category: 'ID Photo', description: 'ICAO Doc 9303 passport / visa photo (35 × 45 mm)' },
  { id: 'photo-18x24', name: 'Poster 18 × 24 in', widthMm: 457.2, heightMm: 609.6, category: 'Large Format', description: 'Retail / event poster stock' },
  { id: 'photo-24x36', name: 'Poster 24 × 36 in', widthMm: 609.6, heightMm: 914.4, category: 'Large Format', description: 'Large format display poster' },
];

export const PRINT_SIZE_MAP: Record<string, PrintSizeSpec> = PRINT_SIZES.reduce(
  (acc, spec) => {
    acc[spec.id] = spec;
    return acc;
  },
  {} as Record<string, PrintSizeSpec>,
);

export function mmToInch(mm: number): number {
  return mm / MM_PER_INCH;
}

export function inchToMm(inch: number): number {
  return inch * MM_PER_INCH;
}

/** Real physical-size -> pixel conversion: px = (mm / 25.4) * dpi */
export function mmToPx(mm: number, dpi: number): number {
  return Math.round((mm / MM_PER_INCH) * dpi);
}

export function pxToMm(px: number, dpi: number): number {
  return (px / dpi) * MM_PER_INCH;
}

/** Effective DPI of an image of `px` pixels printed at `mm` physical width/height. */
export function effectiveDpi(px: number, mm: number): number {
  if (mm <= 0) return 0;
  return px / mmToInch(mm);
}

export interface PixelSize {
  widthPx: number;
  heightPx: number;
}

export function sizeAtDpi(spec: PrintSizeSpec, dpi: number): PixelSize {
  return { widthPx: mmToPx(spec.widthMm, dpi), heightPx: mmToPx(spec.heightMm, dpi) };
}

export function getSize(id: string): PrintSizeSpec | undefined {
  return PRINT_SIZE_MAP[id];
}

/**
 * DPI recommended for a print of the given physical size, based on typical
 * viewing distance (hand-held prints need more resolution than banners).
 */
export function recommendedDpi(widthMm: number, heightMm: number): number {
  const longestInch = mmToInch(Math.max(widthMm, heightMm));
  // Round to 2 dp so exact inch boundaries (e.g. 609.6mm = 24in) classify
  // into the smaller-viewing-distance tier rather than spilling over by float
  // epsilon.
  const inch = Math.round(longestInch * 100) / 100;
  if (inch <= 12) return 300; // hand-held: cards, photos, A4/A3
  if (inch <= 24) return 200; // posters viewed at ~1 m
  return 150; // large format / banners viewed from several metres
}

/** Add a bleed of `bleedMm` on every edge. */
export function withBleed(widthMm: number, heightMm: number, bleedMm: number): PixelSize & { widthMm: number; heightMm: number } {
  return {
    widthMm: widthMm + bleedMm * 2,
    heightMm: heightMm + bleedMm * 2,
    widthPx: mmToPx(widthMm + bleedMm * 2, 300),
    heightPx: mmToPx(heightMm + bleedMm * 2, 300),
  };
}

/**
 * How many copies of `itemMm` fit on a `sheetMm` parent sheet.
 * Tries both item orientations and both sheet orientations and keeps the best.
 */
export function upsPerSheet(
  itemWidthMm: number,
  itemHeightMm: number,
  sheetWidthMm: number,
  sheetHeightMm: number,
  gapMm = 0,
): { ups: number; columns: number; rows: number; itemRotated: boolean } {
  const itemOrientations: [number, number, boolean][] = [
    [itemWidthMm, itemHeightMm, false],
    [itemHeightMm, itemWidthMm, true],
  ];
  const sheetOrientations: [number, number][] = [
    [sheetWidthMm, sheetHeightMm],
    [sheetHeightMm, sheetWidthMm],
  ];

  let best = { ups: 0, columns: 0, rows: 0, itemRotated: false };
  for (const [iw, ih, rotated] of itemOrientations) {
    for (const [sw, sh] of sheetOrientations) {
      const columns = Math.floor((sw + gapMm) / (iw + gapMm));
      const rows = Math.floor((sh + gapMm) / (ih + gapMm));
      const ups = Math.max(0, columns) * Math.max(0, rows);
      if (ups > best.ups) best = { ups, columns, rows, itemRotated: rotated };
    }
  }
  return best;
}

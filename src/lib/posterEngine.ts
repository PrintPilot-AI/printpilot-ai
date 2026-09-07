/**
 * Poster Generator — deterministic local design engine.
 *
 * Builds a structured poster layout (palette, type scale, grid zones, crop
 * marks, bleed) from user inputs. Colour palettes are derived deterministically
 * from the chosen scheme + a stable hash of the title, so results are
 * reproducible. All user text is escaped wherever it is written into an SVG
 * string; the React preview renders SVG as elements (never innerHTML).
 *
 * No AI, no external image service.
 */

import { mmToPx, PRINT_SIZE_MAP, PrintSizeSpec } from './printSpecs';

export interface PosterPalette {
  background: string;
  primary: string;
  secondary: string;
  accent: string;
  text: string;
}

export interface PosterInput {
  title: string;
  subtitle: string;
  category: string;
  colorSchemeId: string;
  sizeId: string; // key into PRINT_SIZE_MAP
  eventDate: string;
  location: string;
  includeCropMarks: boolean;
}

export interface PosterLayout {
  spec: PrintSizeSpec;
  widthMm: number;
  heightMm: number;
  bleedMm: number;
  dpi: number;
  widthPx: number; // at dpi, trim size
  heightPx: number;
  bleedWidthPx: number;
  bleedHeightPx: number;
  palette: PosterPalette;
  // Normalized (0..1) layout zones within the trim box
  zones: {
    header: { x: number; y: number; w: number; h: number };
    hero: { x: number; y: number; w: number; h: number };
    details: { x: number; y: number; w: number; h: number };
    footer: { x: number; y: number; w: number; h: number };
  };
  title: string;
  subtitle: string;
  category: string;
  eventDate: string;
  location: string;
  recommendedPaper: string;
  fontStackHeader: string;
  fontStackBody: string;
}

export const COLOR_SCHEMES: Record<string, { name: string; palette: PosterPalette }> = {
  neon: {
    name: 'Neon Vibrant',
    palette: { background: '#0F0B2E', primary: '#7C3AED', secondary: '#06B6D4', accent: '#F59E0B', text: '#FFFFFF' },
  },
  corporate: {
    name: 'Corporate Blue',
    palette: { background: '#0B2545', primary: '#1D4ED8', secondary: '#38BDF8', accent: '#F1F5F9', text: '#FFFFFF' },
  },
  warm: {
    name: 'Warm Sunset',
    palette: { background: '#2B0F0E', primary: '#E85D2F', secondary: '#F2A65A', accent: '#FFE1C4', text: '#FFF7F0' },
  },
  mono: {
    name: 'Monochrome Minimal',
    palette: { background: '#FFFFFF', primary: '#111111', secondary: '#555555', accent: '#000000', text: '#111111' },
  },
  eco: {
    name: 'Eco Green',
    palette: { background: '#0B2A1B', primary: '#2E8B57', secondary: '#8BC34A', accent: '#F4E1A4', text: '#F2FFF6' },
  },
};

/** Stable 32-bit string hash (djb2). Deterministic across runs. */
export function hashString(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = (h * 33) ^ s.charCodeAt(i);
  }
  return (h >>> 0);
}

/** Nudge a hex colour's lightness deterministically (used for gradient variety). */
export function shiftHex(hex: string, amount: number): string {
  const n = parseInt(hex.replace('#', ''), 16);
  let r = (n >> 16) & 255;
  let g = (n >> 8) & 255;
  let b = n & 255;
  r = Math.max(0, Math.min(255, Math.round(r + amount)));
  g = Math.max(0, Math.min(255, Math.round(g + amount)));
  b = Math.max(0, Math.min(255, Math.round(b + amount)));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
}

export function buildPosterLayout(input: PosterInput): PosterLayout {
  const spec = PRINT_SIZE_MAP[input.sizeId] || PRINT_SIZE_MAP['photo-18x24'];
  const scheme = COLOR_SCHEMES[input.colorSchemeId] || COLOR_SCHEMES.neon;

  // Deterministic palette variation from the title hash
  const h = hashString(input.title || 'poster');
  const variation = ((h % 40) - 20); // ±20 lightness
  const palette: PosterPalette = {
    background: scheme.palette.background,
    primary: shiftHex(scheme.palette.primary, variation * 0.4),
    secondary: scheme.palette.secondary,
    accent: scheme.palette.accent,
    text: scheme.palette.text,
  };

  const dpi = 300;
  const bleedMm = 3;
  const widthPx = mmToPx(spec.widthMm, dpi);
  const heightPx = mmToPx(spec.heightMm, dpi);

  const gsm = spec.widthMm * spec.heightMm > 200 * 300 ? 200 : 250;

  return {
    spec,
    widthMm: spec.widthMm,
    heightMm: spec.heightMm,
    bleedMm,
    dpi,
    widthPx,
    heightPx,
    bleedWidthPx: mmToPx(spec.widthMm + bleedMm * 2, dpi),
    bleedHeightPx: mmToPx(spec.heightMm + bleedMm * 2, dpi),
    palette,
    zones: {
      header: { x: 0.06, y: 0.05, w: 0.88, h: 0.12 },
      hero: { x: 0.06, y: 0.2, w: 0.88, h: 0.42 },
      details: { x: 0.06, y: 0.66, w: 0.88, h: 0.2 },
      footer: { x: 0.06, y: 0.9, w: 0.88, h: 0.06 },
    },
    title: input.title,
    subtitle: input.subtitle,
    category: input.category,
    eventDate: input.eventDate,
    location: input.location,
    recommendedPaper: `${gsm} GSM Gloss Art Paper (or ${gsm - 30} GSM Matte for reduced glare)`,
    fontStackHeader: "'Helvetica Neue', Arial Black, sans-serif",
    fontStackBody: "'Helvetica Neue', Arial, sans-serif",
  };
}

/** Escape text for safe inclusion in an SVG/HTML string. */
function esc(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Serialize the poster to a standalone SVG string for download.
 * Uses a 0..1000 x 0..H viewBox scaled to the trim aspect. All user text is
 * escaped. No <script>, no event handlers, no foreignObject.
 */
export function posterToSvg(layout: PosterLayout, viewBoxW = 800): string {
  const ratio = layout.heightMm / layout.widthMm;
  const W = viewBoxW;
  const H = Math.round(viewBoxW * ratio);
  const p = layout.palette;
  const z = layout.zones;

  const px = (frac: number) => Math.round(frac * W);
  const py = (frac: number) => Math.round(frac * H);

  const titleSize = Math.round(W * 0.075);
  const subSize = Math.round(W * 0.035);
  const catSize = Math.round(W * 0.028);
  const detailSize = Math.round(W * 0.03);

  const lines: string[] = [];
  lines.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${layout.widthMm}mm" height="${layout.heightMm}mm">`);
  lines.push(`<rect x="0" y="0" width="${W}" height="${H}" fill="${p.background}"/>`);
  // Hero decorative band (deterministic geometric)
  lines.push(`<rect x="${px(z.hero.x)}" y="${py(z.hero.y)}" width="${px(z.hero.w)}" height="${py(z.hero.h)}" fill="${p.primary}" opacity="0.85"/>`);
  lines.push(`<circle cx="${px(z.hero.x + z.hero.w * 0.78)}" cy="${py(z.hero.y + z.hero.h * 0.35)}" r="${Math.round(W * 0.12)}" fill="${p.secondary}" opacity="0.6"/>`);
  lines.push(`<circle cx="${px(z.hero.x + z.hero.w * 0.2)}" cy="${py(z.hero.y + z.hero.h * 0.7)}" r="${Math.round(W * 0.07)}" fill="${p.accent}" opacity="0.5"/>`);
  // Header
  lines.push(`<text x="${px(0.5)}" y="${py(z.header.y + z.header.h * 0.7)}" fill="${p.text}" font-family="${esc(layout.fontStackHeader)}" font-size="${catSize}" text-anchor="middle" letter-spacing="${Math.round(W * 0.01)}" font-weight="600">${esc((layout.category || 'Event').toUpperCase())}</text>`);
  // Title over hero
  lines.push(`<text x="${px(0.5)}" y="${py(z.hero.y + z.hero.h * 0.5)}" fill="${p.text}" font-family="${esc(layout.fontStackHeader)}" font-size="${titleSize}" text-anchor="middle" font-weight="800">${esc(layout.title || 'Poster Title')}</text>`);
  if (layout.subtitle) {
    lines.push(`<text x="${px(0.5)}" y="${py(z.hero.y + z.hero.h * 0.5) + Math.round(titleSize * 1.1)}" fill="${p.accent}" font-family="${esc(layout.fontStackBody)}" font-size="${subSize}" text-anchor="middle" font-weight="500">${esc(layout.subtitle)}</text>`);
  }
  // Details
  if (layout.eventDate) {
    lines.push(`<text x="${px(0.5)}" y="${py(z.details.y + z.details.h * 0.4)}" fill="${p.text}" font-family="${esc(layout.fontStackBody)}" font-size="${detailSize}" text-anchor="middle">${esc(layout.eventDate)}</text>`);
  }
  if (layout.location) {
    lines.push(`<text x="${px(0.5)}" y="${py(z.details.y + z.details.h * 0.75)}" fill="${p.secondary}" font-family="${esc(layout.fontStackBody)}" font-size="${detailSize}" text-anchor="middle">${esc(layout.location)}</text>`);
  }
  // Footer
  lines.push(`<text x="${px(0.5)}" y="${py(z.footer.y + z.footer.h * 0.7)}" fill="${p.text}" font-family="${esc(layout.fontStackBody)}" font-size="${Math.round(W * 0.02)}" text-anchor="middle" opacity="0.8">PrintPilot AI &#183; ${layout.widthMm} &#215; ${layout.heightMm} mm &#183; ${layout.dpi} DPI &#183; ${layout.bleedMm}mm bleed</text>`);
  lines.push(`</svg>`);
  return lines.join('\n');
}

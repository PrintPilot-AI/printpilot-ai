/**
 * Color Advisor — deterministic RGB → CMYK conversion, gamut estimation,
 * Pantone-nearest matching, and total ink coverage (TAC) checks.
 *
 * Conversions use the standard naive subtractive model with a K (black)
 * generation step — the industry-standard first-order RGB→CMYK approximation.
 * This is honest arithmetic, not a claim of ICC-accurate conversion.
 */

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export interface Cmyk {
  c: number;
  m: number;
  y: number;
  k: number;
}

export interface AnalyzedColor {
  sourceHex: string;
  rgb: Rgb;
  cmyk: Cmyk;
  cmykString: string;
  totalInkCoverage: number; // percentage sum C+M+Y+K
  inGamut: boolean;
  gamutWarning: string;
  nearestPantone: { name: string; hex: string; deltaE: number };
  correctedHex: string; // round-trip CMYK->RGB preview of what press will show
}

export interface ColorAdviceResult {
  gamutStatus: string;
  analyzedColors: AnalyzedColor[];
  maxTotalInkCoverage: number;
  tacAdvice: string;
  pressProfileRecommendation: string;
}

export function parseHex(hex: string): Rgb | null {
  let h = hex.trim().replace(/^#/, '');
  if (/^[0-9a-fA-F]{3}$/.test(h)) {
    h = h.split('').map((c) => c + c).join('');
  }
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

export function rgbToHex({ r, g, b }: Rgb): string {
  const to = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`.toUpperCase();
}

/** Standard naive RGB -> CMYK with black generation. Returns 0..100 percentages. */
export function rgbToCmyk({ r, g, b }: Rgb): Cmyk {
  const rf = r / 255;
  const gf = g / 255;
  const bf = b / 255;
  const k = 1 - Math.max(rf, gf, bf);
  if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };
  const c = (1 - rf - k) / (1 - k);
  const m = (1 - gf - k) / (1 - k);
  const y = (1 - bf - k) / (1 - k);
  return {
    c: Math.round(c * 100),
    m: Math.round(m * 100),
    y: Math.round(y * 100),
    k: Math.round(k * 100),
  };
}

/** Inverse of the naive model — shows the press-preview approximation on screen. */
export function cmykToRgb({ c, m, y, k }: Cmyk): Rgb {
  const r = 255 * (1 - c / 100) * (1 - k / 100);
  const g = 255 * (1 - m / 100) * (1 - k / 100);
  const b = 255 * (1 - y / 100) * (1 - k / 100);
  return { r, g, b };
}

/** CIE76 Delta-E via sRGB -> XYZ -> Lab (D65). Deterministic perceptual distance. */
export function rgbToLab({ r, g, b }: Rgb): [number, number, number] {
  let rf = r / 255;
  let gf = g / 255;
  let bf = b / 255;
  const inv = (v: number) => (v > 0.04045 ? Math.pow((v + 0.055) / 1.055, 2.4) : v / 12.92);
  rf = inv(rf); gf = inv(gf); bf = inv(bf);
  // sRGB D65
  let x = rf * 0.4124 + gf * 0.3576 + bf * 0.1805;
  let y = rf * 0.2126 + gf * 0.7152 + bf * 0.0722;
  let z = rf * 0.0193 + gf * 0.1192 + bf * 0.9505;
  x /= 0.95047; y /= 1.0; z /= 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const fx = f(x); const fy = f(y); const fz = f(z);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

export function deltaE76(a: Rgb, b: Rgb): number {
  const [l1, a1, b1] = rgbToLab(a);
  const [l2, a2, b2] = rgbToLab(b);
  return Math.sqrt((l1 - l2) ** 2 + (a1 - a2) ** 2 + (b1 - b2) ** 2);
}

/** Inverse of rgbToLab — Lab (D65) -> sRGB, clamped to the displayable cube. */
export function labToRgb(L: number, a: number, b: number): Rgb {
  const fy = (L + 16) / 116;
  const fx = fy + a / 500;
  const fz = fy - b / 200;
  const eps = 0.008856;
  const kappa = 903.3;
  const finv = (f: number) => (f ** 3 > eps ? f ** 3 : (116 * f - 16) / kappa);
  const x = finv(fx) * 0.95047;
  const y = (L > kappa * eps ? ((L + 16) / 116) ** 3 : L / kappa) * 1.0;
  const z = finv(fz) * 1.08883;
  // XYZ -> linear sRGB (D65)
  let rl = 3.2406 * x - 1.5372 * y - 0.4986 * z;
  let gl = -0.9689 * x + 1.8758 * y + 0.0415 * z;
  let bl = 0.0557 * x - 0.2040 * y + 1.0570 * z;
  const gamma = (v: number) => (v > 0.0031308 ? 1.055 * Math.pow(Math.max(0, v), 1 / 2.4) - 0.055 : 12.92 * v);
  const clamp255 = (v: number) => Math.max(0, Math.min(255, Math.round(gamma(v) * 255)));
  return { r: clamp255(rl), g: clamp255(gl), b: clamp255(bl) };
}

/**
 * CMYK gamut silhouette — the maximum Lab chroma a coated 4-colour process
 * (GRACoL2013 / ISO Coated v2) can reproduce at each hue angle, taken from the
 * published Lab values of the process primaries and secondaries. The boundary
 * between anchors is linearly interpolated around the hue circle. This is a
 * first-order, deterministic gamut approximation — not a full ICC profile — and
 * is used only to warn when a vivid RGB colour will dull on press.
 */
const CMYK_GAMUT_ANCHORS: { hue: number; chroma: number }[] = [
  { hue: 34, chroma: 88 },   // Red     (M100 Y100)
  { hue: 91, chroma: 93 },   // Yellow  (Y100)
  { hue: 144, chroma: 62 },  // Green   (C100 Y100)
  { hue: 196, chroma: 51 },  // Cyan    (C100)
  { hue: 299, chroma: 112 }, // Blue    (C100 M100)
  { hue: 356, chroma: 90 },  // Magenta (M100)
];

/** Interpolated maximum reproducible CMYK chroma at a given Lab hue angle. */
export function maxCmykChromaAtHue(hueDeg: number): number {
  const a = CMYK_GAMUT_ANCHORS;
  const n = a.length;
  const h = ((hueDeg % 360) + 360) % 360;
  for (let i = 0; i < n; i++) {
    const cur = a[i];
    const nxt = a[(i + 1) % n];
    const start = cur.hue;
    let end = nxt.hue;
    let hh = h;
    if (end <= start) { end += 360; if (hh < start) hh += 360; }
    if (hh >= start && hh <= end) {
      const t = end === start ? 0 : (hh - start) / (end - start);
      return cur.chroma + t * (nxt.chroma - cur.chroma);
    }
  }
  return a[0].chroma;
}

/** A curated subset of common coated Pantone spot colours with reference sRGB values. */
const PANTONE_REFERENCES: { name: string; hex: string }[] = [
  { name: 'Pantone 185 C', hex: '#E4002B' },
  { name: 'Pantone 186 C', hex: '#C8102E' },
  { name: 'Pantone 485 C', hex: '#DA291C' },
  { name: 'Pantone 032 C', hex: '#EF3340' },
  { name: 'Pantone Warm Red C', hex: '#F9423A' },
  { name: 'Pantone 1795 C', hex: '#D62718' },
  { name: 'Pantone 1655 C', hex: '#FF6900' },
  { name: 'Pantone Orange 021 C', hex: '#FE5000' },
  { name: 'Pantone 137 C', hex: '#FFA300' },
  { name: 'Pantone 1235 C', hex: '#FFB819' },
  { name: 'Pantone Yellow C', hex: '#FEDD00' },
  { name: 'Pantone 354 C', hex: '#00B140' },
  { name: 'Pantone 3405 C', hex: '#00AF66' },
  { name: 'Pantone Green C', hex: '#00AB84' },
  { name: 'Pantone 3268 C', hex: '#00B0B9' },
  { name: 'Pantone Process Cyan C', hex: '#0085CA' },
  { name: 'Pantone 300 C', hex: '#005EB8' },
  { name: 'Pantone 2935 C', hex: '#0057B8' },
  { name: 'Pantone 286 C', hex: '#0033A0' },
  { name: 'Pantone 2728 C', hex: '#0047BB' },
  { name: 'Pantone Reflex Blue C', hex: '#001489' },
  { name: 'Pantone 2685 C', hex: '#330072' },
  { name: 'Pantone Violet C', hex: '#440099' },
  { name: 'Pantone Purple C', hex: '#BB29BB' },
  { name: 'Pantone 219 C', hex: '#DA1984' },
  { name: 'Pantone 226 C', hex: '#D6006E' },
  { name: 'Pantone Rhodamine Red C', hex: '#E10098' },
  { name: 'Pantone Black C', hex: '#2D2926' },
  { name: 'Pantone Cool Gray 11 C', hex: '#53565A' },
  { name: 'Pantone Cool Gray 6 C', hex: '#A7A8AA' },
  { name: 'Pantone 427 C', hex: '#D0D3D4' },
  { name: 'Pantone 7527 C', hex: '#D7D4CB' },
  { name: 'Pantone 468 C', hex: '#C4A57B' },
  { name: 'Pantone 871 C (Gold)', hex: '#84754E' },
  { name: 'Pantone 876 C (Red Metallic)', hex: '#9C5B45' },
  { name: 'Pantone 5535 C', hex: '#1E3B2F' },
  { name: 'Pantone 3308 C', hex: '#004D40' },
  { name: 'Pantone 561 C', hex: '#00786B' },
];

export function nearestPantone(rgb: Rgb): { name: string; hex: string; deltaE: number } {
  let best = { name: 'Pantone Black C', hex: '#2D2926', deltaE: Infinity };
  for (const ref of PANTONE_REFERENCES) {
    const refRgb = parseHex(ref.hex)!;
    const de = deltaE76(rgb, refRgb);
    if (de < best.deltaE) best = { name: ref.name, hex: ref.hex, deltaE: Math.round(de * 10) / 10 };
  }
  return best;
}

/**
 * Out-of-gamut estimation against a coated CMYK process gamut. The source RGB
 * is converted to Lab; if its chroma exceeds the maximum reproducible CMYK
 * chroma at that hue angle, the colour is clipped back onto the gamut boundary
 * (same L* and hue, reduced chroma) and the perceptual distance (ΔE76) between
 * the source and the clipped press reproduction is reported.
 *
 * This is a first-order deterministic gamut silhouette, not an ICC transform,
 * but it correctly flags the vivid RGB blues/greens/magentas that dull on press.
 */
export function isLikelyOutOfGamut(rgb: Rgb, _cmyk?: Cmyk): { out: boolean; shift: number; clippedRgb: Rgb } {
  const [L, la, lb] = rgbToLab(rgb);
  const C = Math.sqrt(la * la + lb * lb);
  const hue = (Math.atan2(lb, la) * 180 / Math.PI + 360) % 360;
  const maxC = maxCmykChromaAtHue(hue);

  if (C <= maxC) {
    return { out: false, shift: 0, clippedRgb: rgb };
  }
  // Clip chroma to the gamut boundary, preserving L* and hue.
  const scale = maxC / C;
  const clipped = labToRgb(L, la * scale, lb * scale);
  const shift = deltaE76(rgb, clipped);
  // A shift over ~6 ΔE units is a visible press dulling worth warning about.
  return { out: shift > 6, shift: Math.round(shift * 10) / 10, clippedRgb: clipped };
}

export function analyzeColor(hex: string): AnalyzedColor | null {
  const rgb = parseHex(hex);
  if (!rgb) return null;
  const cmyk = rgbToCmyk(rgb);
  const totalInk = cmyk.c + cmyk.m + cmyk.y + cmyk.k;
  const gamut = isLikelyOutOfGamut(rgb, cmyk);
  const corrected = gamut.clippedRgb;

  let warning: string;
  if (gamut.shift > 15) {
    warning = `Strong gamut miss (ΔE ${gamut.shift}). This vivid RGB colour will print noticeably duller/muted in 4-colour process. Use a spot colour to match.`;
  } else if (gamut.out) {
    warning = `Minor gamut shift (ΔE ${gamut.shift}). Slight dulling expected on press; acceptable for most jobs.`;
  } else {
    warning = 'Excellent gamut match — CMYK reproduction is within ΔE 6 of the screen colour.';
  }

  return {
    sourceHex: rgbToHex(rgb),
    rgb,
    cmyk,
    cmykString: `C: ${cmyk.c}% M: ${cmyk.m}% Y: ${cmyk.y}% K: ${cmyk.k}%`,
    totalInkCoverage: totalInk,
    inGamut: !gamut.out,
    gamutWarning: warning,
    nearestPantone: nearestPantone(rgb),
    correctedHex: rgbToHex(corrected),
  };
}

export function runColorAdvisor(hexInputs: string[], substrate: string): ColorAdviceResult {
  const analyzed = hexInputs.map((h) => analyzeColor(h)).filter((c): c is AnalyzedColor => c !== null);

  const outOfGamutCount = analyzed.filter((c) => !c.inGamut).length;
  const maxTac = analyzed.length ? Math.max(...analyzed.map((c) => c.totalInkCoverage)) : 0;

  const gamutStatus = analyzed.length === 0
    ? 'No valid hex colours supplied.'
    : outOfGamutCount === 0
      ? `All ${analyzed.length} colours are within the CMYK gamut for ${substrate || 'coated paper'}.`
      : `Warning: ${outOfGamutCount} of ${analyzed.length} colours fall outside standard CMYK gamut on ${substrate || 'coated paper'} and will shift duller.`;

  // TAC limit depends on substrate: coated ~300%, uncoated/newsprint lower.
  const isUncoated = /uncoated|newsprint|offset bond|matte (?!art)/i.test(substrate || '');
  const tacLimit = isUncoated ? 240 : 300;
  const tacAdvice = maxTac > tacLimit
    ? `Max total ink coverage is ${maxTac}% — EXCEEDS the ${tacLimit}% limit for ${isUncoated ? 'uncoated' : 'coated'} stock. Reduce coverage to avoid set-off, drying and paper-curl problems.`
    : `Max total ink coverage is ${maxTac}%, safely within the ${tacLimit}% limit for ${isUncoated ? 'uncoated' : 'coated'} stock.`;

  return {
    gamutStatus,
    analyzedColors: analyzed,
    maxTotalInkCoverage: maxTac,
    tacAdvice,
    pressProfileRecommendation: isUncoated ? 'ISO Coated v2 / GRACoL2013 (uncoated: PSA/GRACoL uncoated)' : 'GRACoL2013_Coated or ISO Coated v2 (ECI) 300%',
  };
}

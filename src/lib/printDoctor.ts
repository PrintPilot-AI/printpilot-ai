/**
 * Print Doctor — deterministic diagnostics engine.
 *
 * Two inputs:
 * 1. A symptom description matched against a rule base of real press defects.
 * 2. An optional uploaded image that is actually analysed (resolution, aspect,
 *    brightness/contrast/exposure statistics via canvas pixel sampling).
 *
 * No AI, no network calls — every result is computed from the inputs.
 */

export type Severity = 'Critical' | 'Major' | 'Minor' | 'Info';

export interface DoctorFinding {
  category: string;
  severity: Severity;
  title: string;
  explanation: string;
  recommendation: string;
}

export interface ImageStats {
  fileName: string;
  widthPx: number;
  heightPx: number;
  format: string;
  fileSizeMb: number;
  meanBrightness: number; // 0..255
  brightnessStdDev: number;
  meanSaturation: number; // 0..1
  sharpnessScore: number; // 0..1, Laplacian-variance derived
  overexposedPct: number;
  underexposedPct: number;
}

export interface DoctorReport {
  findings: DoctorFinding[];
  imageStats: ImageStats | null;
  analyzedAt: string;
}

/** Real pixel analysis of a loaded HTMLImageElement. */
export function analyzeImagePixels(
  img: HTMLImageElement,
  meta: { fileName: string; format: string; fileSizeMb: number },
): ImageStats {
  const width = img.naturalWidth;
  const height = img.naturalHeight;
  const canvas = document.createElement('canvas');
  // Downscale very large images for the statistics pass only.
  const scale = Math.min(1, 1024 / Math.max(width, height));
  const w = Math.max(1, Math.round(width * scale));
  const h = Math.max(1, Math.round(height * scale));
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h).data;

  let sum = 0;
  let sumSq = 0;
  let satSum = 0;
  let over = 0;
  let under = 0;
  const n = w * h;
  const luma: number[] = new Array(n);

  for (let i = 0; i < n; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    luma[i] = y;
    sum += y;
    sumSq += y * y;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    satSum += max === 0 ? 0 : (max - min) / max;
    if (y >= 250) over++;
    if (y <= 5) under++;
  }

  const mean = sum / n;
  const variance = Math.max(0, sumSq / n - mean * mean);
  const stdDev = Math.sqrt(variance);

  // Laplacian (4-neighbour) variance as a sharpness proxy.
  let lapSum = 0;
  let lapSq = 0;
  let lapCount = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const lap = 4 * luma[i] - luma[i - 1] - luma[i + 1] - luma[i - w] - luma[i + w];
      lapSum += lap;
      lapSq += lap * lap;
      lapCount++;
    }
  }
  const lapMean = lapCount ? lapSum / lapCount : 0;
  const lapVar = lapCount ? Math.max(0, lapSq / lapCount - lapMean * lapMean) : 0;
  // Normalize: varLap of ~1000+ is very sharp, <50 is soft.
  const sharpnessScore = Math.max(0, Math.min(1, lapVar / 1000));

  return {
    fileName: meta.fileName,
    widthPx: width,
    heightPx: height,
    format: meta.format,
    fileSizeMb: meta.fileSizeMb,
    meanBrightness: Math.round(mean * 10) / 10,
    brightnessStdDev: Math.round(stdDev * 10) / 10,
    meanSaturation: Math.round((satSum / n) * 1000) / 1000,
    sharpnessScore: Math.round(sharpnessScore * 1000) / 1000,
    overexposedPct: Math.round((over / n) * 1000) / 10,
    underexposedPct: Math.round((under / n) * 1000) / 10,
  };
}

/** Findings derived from real image statistics. */
export function diagnoseImageStats(stats: ImageStats, targetPrintWidthMm: number, targetDpi: number): DoctorFinding[] {
  const findings: DoctorFinding[] = [];
  const requiredPx = Math.round((targetPrintWidthMm / 25.4) * targetDpi);
  const actualDpi = Math.round(stats.widthPx / (targetPrintWidthMm / 25.4));

  if (stats.widthPx < requiredPx) {
    findings.push({
      category: 'Resolution',
      severity: actualDpi < 150 ? 'Critical' : 'Major',
      title: `Insufficient resolution for ${targetDpi} DPI print`,
      explanation: `Image is ${stats.widthPx}px wide; a ${targetPrintWidthMm}mm print at ${targetDpi} DPI needs ${requiredPx}px (~${actualDpi} DPI effective).`,
      recommendation: `Upscale with the Image Enhancer (nearest whole factor ${Math.ceil(requiredPx / stats.widthPx)}x) or print smaller — max ${Math.round(stats.widthPx / targetDpi * 25.4)}mm at ${targetDpi} DPI.`,
    });
  } else {
    findings.push({
      category: 'Resolution',
      severity: 'Info',
      title: `Resolution OK (~${actualDpi} DPI effective)`,
      explanation: `${stats.widthPx} × ${stats.heightPx}px covers ${requiredPx}px required for ${targetPrintWidthMm}mm at ${targetDpi} DPI.`,
      recommendation: 'No resampling needed.',
    });
  }

  if (stats.sharpnessScore < 0.05) {
    findings.push({
      category: 'Sharpness',
      severity: 'Major',
      title: 'Image is soft / out of focus',
      explanation: `Laplacian sharpness score is ${stats.sharpnessScore} (healthy photos score > 0.15). Fine text and edges will print blurry.`,
      recommendation: 'Apply unsharp mask (radius ~1.2px, amount 80–120%) in the Image Enhancer, or re-shoot/re-scan the source at higher focus quality.',
    });
  } else if (stats.sharpnessScore > 0.6) {
    findings.push({
      category: 'Sharpness',
      severity: 'Minor',
      title: 'Excessive sharpening detected (halo risk)',
      explanation: `Sharpness score ${stats.sharpnessScore} indicates heavy edge contrast; dot gain on press may create halos around edges.`,
      recommendation: 'Reduce sharpening or apply a 0.3px gaussian pre-blur before final sharpen.',
    });
  }

  if (stats.meanBrightness > 190) {
    findings.push({
      category: 'Exposure',
      severity: stats.overexposedPct > 15 ? 'Major' : 'Minor',
      title: 'Overexposed image',
      explanation: `Mean brightness is ${stats.meanBrightness}/255 with ${stats.overexposedPct}% of pixels clipped near white.`,
      recommendation: 'Lower exposure/brightness ~10–20% and recover highlights before printing; clipped whites cannot be recovered on press.',
    });
  } else if (stats.meanBrightness < 65) {
    findings.push({
      category: 'Exposure',
      severity: stats.underexposedPct > 15 ? 'Major' : 'Minor',
      title: 'Underexposed / dark image',
      explanation: `Mean brightness is ${stats.meanBrightness}/255 with ${stats.underexposedPct}% of pixels near black.`,
      recommendation: 'Raise brightness/gamma in the Image Enhancer; dark prints lose shadow detail due to dot gain.',
    });
  }

  if (stats.brightnessStdDev < 30) {
    findings.push({
      category: 'Contrast',
      severity: 'Minor',
      title: 'Flat contrast',
      explanation: `Brightness standard deviation is only ${stats.brightnessStdDev}; the tonal range is compressed and prints will look washed out.`,
      recommendation: 'Increase contrast (S-curve) by ~15–25% in the Image Enhancer.',
    });
  }

  if (stats.meanSaturation < 0.08) {
    findings.push({
      category: 'Color',
      severity: 'Info',
      title: 'Near-grayscale content',
      explanation: `Mean saturation is ${stats.meanSaturation}. If colour is intended, the source may be a scan in grayscale mode.`,
      recommendation: 'For black-and-white jobs, print as grayscale/K-only to save ink and avoid RGB→CMYK shifts.',
    });
  }

  return findings;
}

interface SymptomRule {
  keywords: string[];
  finding: Omit<DoctorFinding, 'severity'> & { severity?: Severity };
}

/** Rule base of real press defects keyed on symptom keywords. */
const SYMPTOM_RULES: SymptomRule[] = [
  {
    keywords: ['band', 'banding', 'streak', 'stripe'],
    finding: {
      category: 'Press Mechanics',
      title: 'Horizontal banding / streaking',
      explanation: 'Banding is typically caused by uneven ink/water balance, worn dampening rollers, clogged inkjet nozzles, or anilox roll damage.',
      recommendation: 'Offset: check dampening roller nip pressure and blanket condition. Inkjet: run a nozzle check and clean/head-align. Flexo: inspect anilox roll for plugging and verify doctor blade pressure.',
    },
  },
  {
    keywords: ['blur', 'blurry', 'soft', 'out of focus', 'unsharp'],
    finding: {
      category: 'Pre-press / File',
      title: 'Blurry fine text and detail',
      explanation: 'Soft text usually comes from low effective DPI at print size, aggressive JPEG compression, or RIP rasterizing vector text to a low-resolution bitmap.',
      recommendation: 'Verify effective DPI ≥ 300 at trim size, keep text as vector/outlines in the PDF, set RIP resolution to ≥ 600 DPI for text-heavy jobs, and re-export from source at maximum quality.',
    },
  },
  {
    keywords: ['hickey', 'hickeys', 'spot', 'spots', 'dot defect'],
    finding: {
      category: 'Press Mechanics',
      title: 'Hickeys (doughnut-shaped spots)',
      explanation: 'Hickeys are caused by dried ink skins, paper dust, or debris on the blanket/plate.',
      recommendation: 'Run blanket wash cycles more frequently, filter ink, check paper for dust shedding, and inspect the plate for damage.',
    },
  },
  {
    keywords: ['ghost', 'ghosting'],
    finding: {
      category: 'Ink / Drying',
      title: 'Ghosting',
      explanation: 'Mechanical ghosting comes from roller starved ink trains; chemical ghosting from back-cylinder offsetting of wet ink.',
      recommendation: 'Add vibration roller adjustment, increase ink film thickness on heavy-coverage areas, verify anti-set-off powder and interleaf drying time.',
    },
  },
  {
    keywords: ['color', 'colour', 'shade', 'mismatch', 'drift', 'delta'],
    finding: {
      category: 'Color Management',
      title: 'Colour drift / mismatch to proof',
      explanation: 'Uncontrolled colour usually stems from missing ICC profiles, RGB→CMYK conversion on the RIP with a different intent than the proof, or uncalibrated press density.',
      recommendation: 'Convert to CMYK in the design app with the target profile (GRACoL/FOGRA39), embed the profile, calibrate press density to ISO 12647-2 targets, and re-proof.',
    },
  },
  {
    keywords: ['static', 'cling', 'misfeed', 'jam', 'double feed'],
    finding: {
      category: 'Environment / Substrate',
      title: 'Static-related feeding problems',
      explanation: 'Low humidity builds static in paper stacks, causing misfeeds, double feeds and delivery jams.',
      recommendation: 'Keep pressroom at 45–55% RH and 20–23°C, acclimatize paper 24h before printing, and use tinsel/static bars on the feeder.',
    },
  },
  {
    keywords: ['dry', 'drying', 'set-off', 'setoff', 'smear', 'rub'],
    finding: {
      category: 'Ink / Drying',
      title: 'Slow drying / set-off on the next sheet',
      explanation: 'Ink not setting causes marking on the reverse of following sheets — from over-inking, low drier dosage, or too-high stack.',
      recommendation: 'Reduce ink film, verify drier additive per ink supplier spec, lower delivery stack height, and increase anti-set-off powder.',
    },
  },
  {
    keywords: ['register', 'registration', 'misalign', 'out of align'],
    finding: {
      category: 'Press Mechanics',
      title: 'Registration error between colours',
      explanation: 'Colour-to-colour misalignment comes from paper stretch, gripper wear, or plate mounting error.',
      recommendation: 'Check gripper pressure uniformity, verify plate-to-blanket mounting torque, and condition paper humidity; use register marks and auto-registration if available.',
    },
  },
  {
    keywords: ['curl', 'wave', 'cockle'],
    finding: {
      category: 'Substrate',
      title: 'Paper curl / cockling',
      explanation: 'Moisture imbalance or grain direction mismatch causes curling after printing.',
      recommendation: 'Print grain-long where possible, balance conditioning humidity, and flip stack mid-run on single-side jobs.',
    },
  },
  {
    keywords: ['crack', 'cracking', 'crease', 'fold'],
    finding: {
      category: 'Finishing',
      title: 'Cracking at folds/creases',
      explanation: 'Heavy coated stocks crack when folded without scoring; toner flakes off along the crease.',
      recommendation: 'Score/crease before folding stocks ≥ 170 GSM, fold with the grain, and consider matte lamination over heavy ink coverage at fold lines.',
    },
  },
  {
    keywords: ['pink', 'magenta', 'cyan', 'yellow', 'toner'],
    finding: {
      category: 'Color Management',
      title: 'Single-channel colour defect',
      explanation: 'A defect isolated to one channel points to that unit: toner/ink density drift, dirty optics, or a damaged plate on that separation.',
      recommendation: 'Pull a solid-density reading per channel, compare to ISO targets, and recalibrate or re-plate the affected unit only.',
    },
  },
];

export interface DoctorInput {
  issueDescription: string;
  printType: string;
  paperType: string;
  imageStats?: ImageStats | null;
  targetPrintWidthMm?: number;
  targetDpi?: number;
}

export function runPrintDoctor(input: DoctorInput): DoctorReport {
  const findings: DoctorFinding[] = [];
  const text = input.issueDescription.toLowerCase();

  const matched = SYMPTOM_RULES.filter((rule) => rule.keywords.some((k) => text.includes(k)));
  for (const rule of matched) {
    findings.push({
      severity: rule.finding.severity || 'Major',
      category: rule.finding.category,
      title: rule.finding.title,
      explanation: rule.finding.explanation + (input.printType ? ` (context: ${input.printType}${input.paperType ? ', ' + input.paperType : ''})` : ''),
      recommendation: rule.finding.recommendation,
    });
  }

  if (input.imageStats) {
    findings.push(
      ...diagnoseImageStats(
        input.imageStats,
        input.targetPrintWidthMm ?? 210,
        input.targetDpi ?? 300,
      ),
    );
  }

  if (findings.length === 0) {
    findings.push({
      category: 'General',
      severity: 'Info',
      title: 'No known defect pattern matched the description',
      explanation: `The description "${input.issueDescription.slice(0, 120)}" did not match any rule in the defect database${input.imageStats ? ', and the uploaded image passed all automated checks' : ''}.`,
      recommendation: 'Describe the defect with terms like banding, ghosting, hickies, registration, drying, static, curling or cracking — or upload a photo/print sample for automated image analysis.',
    });
  }

  const severityOrder: Record<Severity, number> = { Critical: 0, Major: 1, Minor: 2, Info: 3 };
  findings.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return {
    findings,
    imageStats: input.imageStats ?? null,
    analyzedAt: new Date().toISOString(),
  };
}

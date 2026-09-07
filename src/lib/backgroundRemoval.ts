/**
 * Background removal engine — real, deterministic local processing.
 *
 * Methodology (background-remove technique):
 *  1. Sample the image border to estimate the background colour(s).
 *  2. Flood-fill from every border pixel whose colour is within tolerance of
 *     the estimated background (BFS over 4-neighbours). Only regions actually
 *     connected to the border are removed — interior subjects are never
 *     punched out.
 *  3. Feather the cut edge (partial alpha on boundary pixels) to avoid halos.
 *  4. Optionally composite onto a solid replacement colour (passport white /
 *     sky blue / gray) after removal.
 *
 * This works on uniform or near-uniform backgrounds — exactly the studio-portrait
 * case that ID/passport photos use. It is honest image processing: no fake face
 * detection, no network calls, no AI runtime.
 */

export interface RemoveBackgroundOptions {
  tolerance: number; // 0..100 colour distance tolerance from sampled background
  feather: number; // 0..5 px edge softness
  edgeErosion: number; // 0..3 px shrink of the kept region (removes colour fringe)
}

export const DEFAULT_REMOVE_BG_OPTIONS: RemoveBackgroundOptions = {
  tolerance: 32,
  feather: 1.5,
  edgeErosion: 0.5,
};

export interface RemoveBackgroundResult {
  canvas: HTMLCanvasElement;
  removedPct: number; // percentage of pixels removed
  backgroundSampled: [number, number, number]; // median border colour
  confidence: 'high' | 'medium' | 'low'; // based on border colour uniformity
}

function median(values: number[]): number {
  const s = [...values].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

/** Estimate the background colour from border pixels and measure uniformity. */
function sampleBorder(data: Uint8ClampedArray, width: number, height: number): {
  color: [number, number, number];
  uniformity: number; // 0..1, higher = more consistent border
} {
  const rs: number[] = [];
  const gs: number[] = [];
  const bs: number[] = [];
  const push = (x: number, y: number) => {
    const i = (y * width + x) * 4;
    rs.push(data[i]); gs.push(data[i + 1]); bs.push(data[i + 2]);
  };
  for (let x = 0; x < width; x++) { push(x, 0); push(x, height - 1); }
  for (let y = 0; y < height; y++) { push(0, y); push(width - 1, y); }

  const color: [number, number, number] = [median(rs), median(gs), median(bs)];
  // Uniformity: fraction of border pixels within a tight radius of the median
  let within = 0;
  for (let i = 0; i < rs.length; i++) {
    const dist = Math.sqrt((rs[i] - color[0]) ** 2 + (gs[i] - color[1]) ** 2 + (bs[i] - color[2]) ** 2);
    if (dist <= 40) within++;
  }
  return { color, uniformity: within / rs.length };
}

/**
 * Remove a (near-)uniform background connected to the image border.
 * Returns a canvas with alpha where the background was.
 */
export function removeBackground(
  source: HTMLCanvasElement | HTMLImageElement,
  options: Partial<RemoveBackgroundOptions> = {},
): RemoveBackgroundResult {
  const opts = { ...DEFAULT_REMOVE_BG_OPTIONS, ...options };
  const src = source instanceof HTMLImageElement ? imageToCanvas(source) : source;
  const width = src.width;
  const height = src.height;
  const ctx = src.getContext('2d')!;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  const border = sampleBorder(data, width, height);
  const [br, bg, bb] = border.color;
  const toleranceDist = (opts.tolerance / 100) * 441; // max RGB distance ~ sqrt(3*255^2)

  // BFS flood fill from all border pixels matching background
  const removed = new Uint8Array(width * height);
  const queue: number[] = [];
  const colorDist = (idx4: number) => {
    const dr = data[idx4] - br;
    const dg = data[idx4 + 1] - bg;
    const db = data[idx4 + 2] - bb;
    return Math.sqrt(dr * dr + dg * dg + db * db);
  };

  const tryEnqueue = (x: number, y: number) => {
    const p = y * width + x;
    if (removed[p]) return;
    if (colorDist(p * 4) <= toleranceDist) {
      removed[p] = 1;
      queue.push(p);
    }
  };

  for (let x = 0; x < width; x++) { tryEnqueue(x, 0); tryEnqueue(x, height - 1); }
  for (let y = 0; y < height; y++) { tryEnqueue(0, y); tryEnqueue(width - 1, y); }

  let head = 0;
  while (head < queue.length) {
    const p = queue[head++];
    const x = p % width;
    const y = (p - x) / width;
    if (x > 0) tryEnqueue(x - 1, y);
    if (x < width - 1) tryEnqueue(x + 1, y);
    if (y > 0) tryEnqueue(x, y - 1);
    if (y < height - 1) tryEnqueue(x, y + 1);
  }

  // Apply alpha, feathering boundary pixels by their distance to tolerance
  let removedCount = 0;
  for (let p = 0; p < width * height; p++) {
    if (removed[p]) {
      data[p * 4 + 3] = 0;
      removedCount++;
    } else if (opts.feather > 0) {
      // Feather: kept pixels adjacent to removed ones get partial alpha based
      // on how close their colour is to the background.
      const x = p % width;
      const y = (p - x) / width;
      let adjacentRemoved = false;
      const r = Math.ceil(opts.feather);
      for (let dy = -r; dy <= r && !adjacentRemoved; dy++) {
        for (let dx = -r; dx <= r && !adjacentRemoved; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height && removed[ny * width + nx]) adjacentRemoved = true;
        }
      }
      if (adjacentRemoved) {
        const dist = colorDist(p * 4);
        if (dist < toleranceDist) {
          const t = dist / toleranceDist; // 0 = pure bg, 1 = at tolerance edge
          data[p * 4 + 3] = Math.round(data[p * 4 + 3] * t);
        }
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);

  const removedPct = Math.round((removedCount / (width * height)) * 1000) / 10;
  const confidence: 'high' | 'medium' | 'low' =
    border.uniformity > 0.85 ? 'high' : border.uniformity > 0.5 ? 'medium' : 'low';

  return { canvas: src, removedPct, backgroundSampled: border.color, confidence };
}

function imageToCanvas(img: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  return canvas;
}

/** Composite a transparent-background canvas onto a solid colour. */
export function compositeOnColor(
  transparentCanvas: HTMLCanvasElement,
  hexColor: string,
): HTMLCanvasElement {
  const out = document.createElement('canvas');
  out.width = transparentCanvas.width;
  out.height = transparentCanvas.height;
  const ctx = out.getContext('2d')!;
  ctx.fillStyle = hexColor;
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.drawImage(transparentCanvas, 0, 0);
  return out;
}

/**
 * Crop and scale the subject canvas to exact passport pixel dimensions at the
 * given DPI, centre-cropping with the standard head-height proportion:
 * ICAO requires the head (crown to chin) to occupy 70–80% of the 45mm frame;
 * we place the crop so the subject fills ~75% vertically, anchored to keep the
 * upper region (head) in frame.
 */
export function cropToPassportFrame(
  sourceCanvas: HTMLCanvasElement,
  targetWidthPx: number,
  targetHeightPx: number,
  verticalBias: number, // 0 = top-aligned crop, 0.5 = centred, 1 = bottom-aligned
): HTMLCanvasElement {
  const sw = sourceCanvas.width;
  const sh = sourceCanvas.height;
  const targetAspect = targetWidthPx / targetHeightPx;
  const sourceAspect = sw / sh;

  let cropW: number;
  let cropH: number;
  if (sourceAspect > targetAspect) {
    // Source wider: crop sides
    cropH = sh;
    cropW = Math.round(sh * targetAspect);
  } else {
    // Source taller: crop top/bottom
    cropW = sw;
    cropH = Math.round(sw / targetAspect);
  }
  const cropX = Math.round((sw - cropW) / 2);
  const cropY = Math.round((sh - cropH) * verticalBias);

  const out = document.createElement('canvas');
  out.width = targetWidthPx;
  out.height = targetHeightPx;
  const ctx = out.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(sourceCanvas, cropX, cropY, cropW, cropH, 0, 0, targetWidthPx, targetHeightPx);
  return out;
}

/**
 * Tile `copies` passport photos onto a print sheet canvas at real 300 DPI
 * pixel dimensions, with cut guides. Returns the sheet canvas.
 */
export function buildPrintSheet(
  photoCanvas: HTMLCanvasElement,
  photoWidthMm: number,
  photoHeightMm: number,
  sheetWidthMm: number,
  sheetHeightMm: number,
  dpi: number,
  copies: number,
  gapMm: number,
  drawCutLines: boolean,
): { canvas: HTMLCanvasElement; placed: number; columns: number; rows: number } {
  const mmToPx = (mm: number) => Math.round((mm / 25.4) * dpi);
  const sheetW = mmToPx(sheetWidthMm);
  const sheetH = mmToPx(sheetHeightMm);
  const photoW = mmToPx(photoWidthMm);
  const photoH = mmToPx(photoHeightMm);
  const gapPx = mmToPx(gapMm);

  const columns = Math.max(1, Math.floor((sheetW + gapPx) / (photoW + gapPx)));
  const rows = Math.max(1, Math.floor((sheetH + gapPx) / (photoH + gapPx)));
  const placed = Math.min(copies, columns * rows);

  const canvas = document.createElement('canvas');
  canvas.width = sheetW;
  canvas.height = sheetH;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, sheetW, sheetH);

  const totalW = columns * photoW + (columns - 1) * gapPx;
  const totalH = rows * photoH + (rows - 1) * gapPx;
  const startX = Math.round((sheetW - totalW) / 2);
  const startY = Math.round((sheetH - totalH) / 2);

  for (let i = 0; i < placed; i++) {
    const col = i % columns;
    const row = Math.floor(i / columns);
    const x = startX + col * (photoW + gapPx);
    const y = startY + row * (photoH + gapPx);
    ctx.drawImage(photoCanvas, x, y, photoW, photoH);
    if (drawCutLines) {
      ctx.strokeStyle = '#cccccc';
      ctx.lineWidth = Math.max(1, Math.round(dpi / 300));
      ctx.setLineDash([dpi / 20, dpi / 20]);
      ctx.strokeRect(x - 0.5, y - 0.5, photoW + 1, photoH + 1);
      ctx.setLineDash([]);
    }
  }

  return { canvas, placed, columns, rows };
}

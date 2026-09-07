/**
 * Image processing engine — real local pixel operations on canvas.
 *
 * Implements:
 *  - Lanczos-quality progressive upscale (browser high-quality resampling)
 *  - Unsharp mask (gaussian blur + difference, classic pre-press sharpening)
 *  - Brightness / contrast / saturation adjustment curves
 *  - Auto-levels (histogram stretch) for clarity
 *
 * All operations are performed in-browser on ImageData. No network, no AI.
 */

export interface EnhanceSettings {
  scaleFactor: number; // 1 = no upscale, 2 = 2x, etc. (1..4, 0.5 steps)
  sharpenAmount: number; // 0..200 (unsharp mask strength %)
  sharpenRadius: number; // 0.5..3 px
  brightness: number; // -100..100
  contrast: number; // -100..100
  saturation: number; // -100..100
  autoLevels: boolean;
}

export const DEFAULT_ENHANCE_SETTINGS: EnhanceSettings = {
  scaleFactor: 2,
  sharpenAmount: 80,
  sharpenRadius: 1.2,
  brightness: 0,
  contrast: 10,
  saturation: 0,
  autoLevels: false,
};

export interface EnhanceResult {
  canvas: HTMLCanvasElement;
  outputWidth: number;
  outputHeight: number;
  sourceWidth: number;
  sourceHeight: number;
}

export function loadImage(src: string | File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = typeof src === 'string' ? src : URL.createObjectURL(src);
    img.onload = () => {
      if (typeof src !== 'string') URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      if (typeof src !== 'string') URL.revokeObjectURL(url);
      reject(new Error('Could not decode the uploaded image. It may be corrupt or in an unsupported format.'));
    };
    img.src = url;
  });
}

/** Box blur approximation of a gaussian (3 passes) over a luma+RGB buffer. */
function boxBlur(data: Uint8ClampedArray, width: number, height: number, radius: number): Uint8ClampedArray {
  const out = new Uint8ClampedArray(data.length);
  const tmp = new Uint8ClampedArray(data.length);
  const r = Math.max(1, Math.round(radius));

  const blurAxis = (src: Uint8ClampedArray, dst: Uint8ClampedArray, horizontal: boolean) => {
    for (let i = 0; i < (horizontal ? height : width); i++) {
      for (let ch = 0; ch < 3; ch++) {
        let sum = 0;
        const len = horizontal ? width : height;
        const idx = (pos: number) => {
          const x = horizontal ? pos : i;
          const y = horizontal ? i : pos;
          return (y * width + x) * 4 + ch;
        };
        // Prime window
        for (let k = -r; k <= r; k++) sum += src[idx(Math.min(len - 1, Math.max(0, k)))];
        for (let pos = 0; pos < len; pos++) {
          dst[idx(pos)] = sum / (2 * r + 1);
          const addIdx = idx(Math.min(len - 1, pos + r + 1));
          const subIdx = idx(Math.max(0, pos - r));
          sum += src[addIdx] - src[subIdx];
        }
      }
    }
    // Copy alpha
    for (let p = 0; p < data.length; p += 4) dst[p + 3] = src[p + 3];
  };

  // 3 passes ≈ gaussian
  blurAxis(data, tmp, true);
  blurAxis(tmp, out, false);
  blurAxis(out, tmp, true);
  blurAxis(tmp, out, false);
  blurAxis(out, tmp, true);
  blurAxis(tmp, out, false);
  return out;
}

/** Classic unsharp mask: out = orig + amount * (orig - blurred). */
export function unsharpMask(imageData: ImageData, amountPct: number, radiusPx: number): ImageData {
  if (amountPct <= 0) return imageData;
  const { data, width, height } = imageData;
  const blurred = boxBlur(data, width, height, radiusPx);
  const amount = amountPct / 100;
  for (let i = 0; i < data.length; i += 4) {
    for (let ch = 0; ch < 3; ch++) {
      const orig = data[i + ch];
      const diff = orig - blurred[i + ch];
      data[i + ch] = Math.max(0, Math.min(255, orig + amount * diff));
    }
  }
  return imageData;
}

/** Brightness (-100..100), contrast (-100..100), saturation (-100..100). */
export function adjustColors(imageData: ImageData, brightness: number, contrast: number, saturation: number): ImageData {
  const { data } = imageData;
  const b = brightness * 1.6; // map to ±160 levels
  const c = contrast / 100;
  const contrastFactor = (1 + c) / (1.0001 - c); // avoid div by 0
  const s = 1 + saturation / 100;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let bl = data[i + 2];

    // Brightness
    r += b; g += b; bl += b;

    // Contrast around midpoint 128
    r = contrastFactor * (r - 128) + 128;
    g = contrastFactor * (g - 128) + 128;
    bl = contrastFactor * (bl - 128) + 128;

    // Saturation around luma
    if (saturation !== 0) {
      const luma = 0.2126 * r + 0.7152 * g + 0.0722 * bl;
      r = luma + s * (r - luma);
      g = luma + s * (g - luma);
      bl = luma + s * (bl - luma);
    }

    data[i] = Math.max(0, Math.min(255, r));
    data[i + 1] = Math.max(0, Math.min(255, g));
    data[i + 2] = Math.max(0, Math.min(255, bl));
  }
  return imageData;
}

/** Histogram stretch: map the 1st–99th percentile range onto 0–255 per channel. */
export function autoLevels(imageData: ImageData): ImageData {
  const { data } = imageData;
  for (let ch = 0; ch < 3; ch++) {
    const hist = new Uint32Array(256);
    for (let i = ch; i < data.length; i += 4) hist[data[i]]++;
    const total = data.length / 4;
    const lowCut = total * 0.01;
    const highCut = total * 0.99;
    let cumulative = 0;
    let lo = 0;
    let hi = 255;
    for (let v = 0; v < 256; v++) {
      cumulative += hist[v];
      if (cumulative >= lowCut) { lo = v; break; }
    }
    cumulative = 0;
    for (let v = 0; v < 256; v++) {
      cumulative += hist[v];
      if (cumulative >= highCut) { hi = v; break; }
    }
    if (hi <= lo) continue;
    const scale = 255 / (hi - lo);
    for (let i = ch; i < data.length; i += 4) {
      data[i] = Math.max(0, Math.min(255, (data[i] - lo) * scale));
    }
  }
  return imageData;
}

/**
 * Full enhancement pipeline: upscale -> auto levels -> colour adjust -> unsharp.
 * Upscaling uses the browser's high-quality image smoothing in two ≤2x steps
 * (progressive bilinear gives far better results than a single large jump).
 */
export function enhanceImage(img: HTMLImageElement, settings: EnhanceSettings): EnhanceResult {
  const srcW = img.naturalWidth;
  const srcH = img.naturalHeight;
  if (srcW === 0 || srcH === 0) throw new Error('Source image has zero dimensions.');

  const factor = Math.min(4, Math.max(0.5, settings.scaleFactor));
  const outW = Math.round(srcW * factor);
  const outH = Math.round(srcH * factor);

  // Progressive upscale in <=2x steps
  let current = document.createElement('canvas');
  current.width = srcW;
  current.height = srcH;
  let ctx = current.getContext('2d')!;
  ctx.drawImage(img, 0, 0);

  let curW = srcW;
  let curH = srcH;
  while (curW < outW || curH < outH) {
    const nextW = Math.min(outW, curW * 2);
    const nextH = Math.min(outH, curH * 2);
    const next = document.createElement('canvas');
    next.width = nextW;
    next.height = nextH;
    const nctx = next.getContext('2d')!;
    nctx.imageSmoothingEnabled = true;
    nctx.imageSmoothingQuality = 'high';
    nctx.drawImage(current, 0, 0, nextW, nextH);
    current = next;
    ctx = nctx;
    curW = nextW;
    curH = nextH;
  }
  // Downscale case (factor < 1)
  if (curW !== outW || curH !== outH) {
    const next = document.createElement('canvas');
    next.width = outW;
    next.height = outH;
    const nctx = next.getContext('2d')!;
    nctx.imageSmoothingEnabled = true;
    nctx.imageSmoothingQuality = 'high';
    nctx.drawImage(current, 0, 0, outW, outH);
    current = next;
    ctx = nctx;
  }

  let imageData = ctx.getImageData(0, 0, current.width, current.height);
  if (settings.autoLevels) imageData = autoLevels(imageData);
  if (settings.brightness !== 0 || settings.contrast !== 0 || settings.saturation !== 0) {
    imageData = adjustColors(imageData, settings.brightness, settings.contrast, settings.saturation);
  }
  if (settings.sharpenAmount > 0) {
    imageData = unsharpMask(imageData, settings.sharpenAmount, settings.sharpenRadius);
  }
  ctx.putImageData(imageData, 0, 0);

  return {
    canvas: current,
    outputWidth: current.width,
    outputHeight: current.height,
    sourceWidth: srcW,
    sourceHeight: srcH,
  };
}

/** Encode a canvas to a Blob with the given mime/quality. */
export function canvasToBlob(canvas: HTMLCanvasElement, mime = 'image/png', quality = 0.92): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Failed to encode canvas output.'))),
      mime,
      quality,
    );
  });
}

/**
 * Write a pHYs chunk-correct PNG: browsers cannot set DPI metadata in
 * canvas.toBlob output, so we inject/patch the PNG pHYs chunk (pixels per
 * metre) after encoding. This makes the downloaded PNG genuinely 300 DPI.
 */
export async function canvasToPngWithDpi(canvas: HTMLCanvasElement, dpi: number): Promise<Blob> {
  const blob = await canvasToBlob(canvas, 'image/png');
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const ppm = Math.round(dpi / 0.0254); // pixels per metre

  // Build pHYs chunk
  const phys = new Uint8Array(21);
  const physView = new DataView(phys.buffer);
  physView.setUint32(0, 9); // length
  phys.set([0x70, 0x48, 0x59, 0x73], 4); // "pHYs"
  physView.setUint32(8, ppm);
  physView.setUint32(12, ppm);
  phys[16] = 1; // unit = metre
  // CRC over type+data
  physView.setUint32(17, crc32(phys.subarray(4, 17)));

  // Find end of IHDR (offset 8 + 4len + 4type + len + 4crc); IHDR is always first.
  const ihdrLen = new DataView(buffer).getUint32(8);
  const insertAt = 8 + 12 + ihdrLen;

  const out = new Uint8Array(bytes.length + phys.length);
  out.set(bytes.subarray(0, insertAt), 0);
  out.set(phys, insertAt);
  out.set(bytes.subarray(insertAt), insertAt + phys.length);

  return new Blob([out], { type: 'image/png' });
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

export function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

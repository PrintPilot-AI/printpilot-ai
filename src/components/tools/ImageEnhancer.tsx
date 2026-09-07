import React, { useEffect, useRef, useState } from 'react';
import { Upload, Download, Sliders, AlertCircle, RefreshCw, Sparkles } from 'lucide-react';
import {
  loadImage,
  enhanceImage,
  canvasToBlob,
  canvasToPngWithDpi,
  DEFAULT_ENHANCE_SETTINGS,
  type EnhanceSettings,
} from '../../lib/imageEngine';
import { validateImageFile, errorMessage, downloadBlob } from '../../lib/security';
import { effectiveDpi } from '../../lib/printSpecs';
import { useAuth } from '../../context/AuthContext';

const PRESETS: { id: string; label: string; settings: Partial<EnhanceSettings> }[] = [
  { id: 'balanced', label: 'Balanced', settings: { scaleFactor: 2, sharpenAmount: 80, sharpenRadius: 1.2, brightness: 0, contrast: 10, saturation: 0, autoLevels: false } },
  { id: 'clarity', label: 'Clarity Boost', settings: { scaleFactor: 2, sharpenAmount: 120, sharpenRadius: 1.4, brightness: 2, contrast: 18, saturation: 8, autoLevels: true } },
  { id: 'upscale4', label: 'Max Upscale 4×', settings: { scaleFactor: 4, sharpenAmount: 60, sharpenRadius: 1.0, brightness: 0, contrast: 8, saturation: 0, autoLevels: false } },
  { id: 'soft', label: 'Soften / Reduce Noise', settings: { scaleFactor: 1, sharpenAmount: 0, sharpenRadius: 1, brightness: 0, contrast: 4, saturation: -5, autoLevels: false } },
];

export const ImageEnhancer: React.FC = () => {
  const { savePrintJob } = useAuth();
  const [settings, setSettings] = useState<EnhanceSettings>(DEFAULT_ENHANCE_SETTINGS);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultInfo, setResultInfo] = useState<{ outW: number; outH: number; srcW: number; srcH: number; blobSizeKb: number } | null>(null);
  const [dpi, setDpi] = useState(300);
  const resultCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewRef = useRef<HTMLCanvasElement | null>(null);

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setResultInfo(null);
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const verr = validateImageFile(file, 25);
    if (verr) { setError(verr); return; }
    try {
      const loaded = await loadImage(file);
      setSourceFile(file);
      setImg(loaded);
      if (sourceUrl) URL.revokeObjectURL(sourceUrl);
      setSourceUrl(URL.createObjectURL(file));
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const update = (patch: Partial<EnhanceSettings>) => setSettings((prev) => ({ ...prev, ...patch }));

  const run = async () => {
    if (!img) { setError('Upload an image first.'); return; }
    setBusy(true);
    setError(null);
    // Yield so the spinner paints before the synchronous pixel work.
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    try {
      const result = enhanceImage(img, settings);
      resultCanvasRef.current = result.canvas;
      // Draw a downscaled preview (cap the on-screen preview to ~1200px wide).
      const preview = previewRef.current ?? document.createElement('canvas');
      const pScale = Math.min(1, 1200 / result.canvas.width);
      preview.width = Math.round(result.canvas.width * pScale);
      preview.height = Math.round(result.canvas.height * pScale);
      const pctx = preview.getContext('2d')!;
      pctx.imageSmoothingQuality = 'high';
      pctx.drawImage(result.canvas, 0, 0, preview.width, preview.height);
      previewRef.current = preview;
      const blob = await canvasToBlob(result.canvas, 'image/png');
      setResultInfo({
        outW: result.outputWidth,
        outH: result.outputHeight,
        srcW: result.sourceWidth,
        srcH: result.sourceHeight,
        blobSizeKb: Math.round((blob.size / 1024) * 10) / 10,
      });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const downloadResult = async (embedDpi: boolean) => {
    const canvas = resultCanvasRef.current;
    if (!canvas) { setError('Run the enhancement first.'); return; }
    try {
      const base = (sourceFile?.name ?? 'image').replace(/\.[^.]+$/, '');
      if (embedDpi) {
        const blob = await canvasToPngWithDpi(canvas, dpi);
        downloadBlob(blob, `${base}_enhanced_${dpi}dpi.png`);
      } else {
        const blob = await canvasToBlob(canvas, 'image/jpeg', 0.92);
        downloadBlob(blob, `${base}_enhanced.jpg`);
      }
      savePrintJob({
        title: 'Image Enhancer',
        toolType: 'Enhance',
        status: 'Completed',
        summary: `Enhanced ${resultInfo?.srcW}×${resultInfo?.srcH} → ${resultInfo?.outW}×${resultInfo?.outH}px.`,
      });
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  useEffect(() => () => { if (sourceUrl) URL.revokeObjectURL(sourceUrl); }, [sourceUrl]);

  const effDpiAt = (mm: number) => (resultInfo ? Math.round(effectiveDpi(resultInfo.outW, mm)) : null);

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 border-b border-white/10 pb-4">
        <div className="p-3 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
          <Sliders className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Image Enhancer</h2>
          <p className="text-xs text-slate-400">Real in-browser pixel processing: progressive upscale, unsharp mask, auto-levels and colour curves. No upload, no fake AI.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls */}
        <div className="lg:col-span-4 space-y-4">
          <label className="block w-full cursor-pointer">
            <div className="rounded-2xl border-2 border-dashed border-white/15 bg-white/[0.02] p-6 text-center hover:border-blue-500/40 transition-colors">
              <Upload className="w-7 h-7 mx-auto text-blue-400 mb-2" />
              <p className="text-xs font-bold text-white">{sourceFile ? sourceFile.name : 'Upload an image'}</p>
              <p className="text-[11px] text-slate-400 mt-1">{sourceFile && img ? `${img.naturalWidth} × ${img.naturalHeight} px` : 'JPEG, PNG, WEBP, GIF or BMP · up to 25 MB'}</p>
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={onPick} />
          </label>

          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button key={p.id} onClick={() => update(p.settings)} className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-semibold text-slate-200 border border-white/10">{p.label}</button>
            ))}
          </div>

          <div className="space-y-3 rounded-2xl bg-slate-950 border border-white/10 p-4">
            <Slider label="Upscale factor" value={settings.scaleFactor} min={0.5} max={4} step={0.5} suffix="×" onChange={(v) => update({ scaleFactor: v })} />
            <Slider label="Sharpen amount" value={settings.sharpenAmount} min={0} max={200} step={5} suffix="%" onChange={(v) => update({ sharpenAmount: v })} />
            <Slider label="Sharpen radius" value={settings.sharpenRadius} min={0.5} max={3} step={0.1} suffix="px" onChange={(v) => update({ sharpenRadius: v })} />
            <Slider label="Brightness" value={settings.brightness} min={-100} max={100} step={1} onChange={(v) => update({ brightness: v })} />
            <Slider label="Contrast" value={settings.contrast} min={-100} max={100} step={1} onChange={(v) => update({ contrast: v })} />
            <Slider label="Saturation" value={settings.saturation} min={-100} max={100} step={1} onChange={(v) => update({ saturation: v })} />
            <label className="flex items-center space-x-2 text-[11px] text-slate-300">
              <input type="checkbox" checked={settings.autoLevels} onChange={(e) => update({ autoLevels: e.target.checked })} className="accent-blue-500" />
              <span>Auto-levels (histogram stretch)</span>
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <button onClick={run} disabled={busy || !img} className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center space-x-2">
              {busy ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>{busy ? 'Processing…' : 'Enhance'}</span>
            </button>
            {sourceFile && (
              <button onClick={() => { setSourceFile(null); setImg(null); setResultInfo(null); if (sourceUrl) URL.revokeObjectURL(sourceUrl); setSourceUrl(null); resultCanvasRef.current = null; }} className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300" title="Reset">
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Preview */}
        <div className="lg:col-span-8 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <PreviewBox label="Original" empty={!sourceUrl}>
              {sourceUrl && <img src={sourceUrl} alt="original" className="max-h-72 w-auto mx-auto object-contain rounded-lg" />}
            </PreviewBox>
            <PreviewBox label="Enhanced" empty={!previewRef.current}>
              {previewRef.current && resultInfo && <img src={previewRef.current.toDataURL('image/png')} alt="enhanced" className="max-h-72 w-auto mx-auto object-contain rounded-lg" />}
            </PreviewBox>
          </div>

          {resultInfo && (
            <div className="rounded-2xl bg-slate-950 border border-white/10 p-4 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <Stat label="Source" value={`${resultInfo.srcW}×${resultInfo.srcH}`} />
                <Stat label="Output" value={`${resultInfo.outW}×${resultInfo.outH}`} />
                <Stat label="Scale" value={`${(resultInfo.outW / resultInfo.srcW).toFixed(2)}×`} />
                <Stat label="PNG size" value={`${resultInfo.blobSizeKb} KB`} />
              </div>
              <div className="text-[11px] text-slate-400">
                Effective DPI: A4 (210mm) → <span className="text-white font-semibold">{effDpiAt(210)} DPI</span> · US Business Card (88.9mm) → <span className="text-white font-semibold">{effDpiAt(88.9)} DPI</span>
              </div>
              <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-white/10">
                <label className="text-[11px] text-slate-400">Embedded DPI</label>
                <select value={dpi} onChange={(e) => setDpi(Number(e.target.value))} className="bg-slate-900 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white">
                  {[150, 200, 300, 600].map((d) => <option key={d} value={d}>{d} DPI</option>)}
                </select>
                <button onClick={() => downloadResult(true)} className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center space-x-2">
                  <Download className="w-4 h-4" /><span>Download PNG ({dpi} DPI)</span>
                </button>
                <button onClick={() => downloadResult(false)} className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold flex items-center space-x-2">
                  <Download className="w-4 h-4" /><span>Download JPEG</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Slider: React.FC<{ label: string; value: number; min: number; max: number; step: number; suffix?: string; onChange: (v: number) => void }> = ({ label, value, min, max, step, suffix, onChange }) => (
  <div>
    <div className="flex items-center justify-between text-[11px] text-slate-300 mb-1">
      <span>{label}</span>
      <span className="font-mono text-blue-300">{value}{suffix ?? ''}</span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-blue-500" />
  </div>
);

const Stat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="p-2.5 rounded-xl bg-slate-900 border border-white/10">
    <span className="text-slate-500 block text-[10px]">{label}</span>
    <span className="font-bold text-white text-sm">{value}</span>
  </div>
);

const PreviewBox: React.FC<{ label: string; empty: boolean; children: React.ReactNode }> = ({ label, empty, children }) => (
  <div className="rounded-2xl bg-slate-950 border border-white/10 p-3 min-h-[220px] flex flex-col">
    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">{label}</span>
    <div className="flex-1 flex items-center justify-center bg-[repeating-conic-gradient(#1e293b_0%_25%,#0f172a_0%_50%)] bg-[length:16px_16px] rounded-lg p-2">
      {empty ? <span className="text-slate-600 text-xs">No image</span> : children}
    </div>
  </div>
);

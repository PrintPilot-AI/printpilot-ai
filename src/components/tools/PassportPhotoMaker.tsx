import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Camera, Upload, Download, CheckCircle2, RefreshCw, Printer, AlertTriangle, Eraser, Image as ImageIcon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  removeBackground, compositeOnColor, cropToPassportFrame, buildPrintSheet, DEFAULT_REMOVE_BG_OPTIONS,
} from '../../lib/backgroundRemoval';
import { enhanceImage, loadImage, canvasToPngWithDpi, canvasToBlob } from '../../lib/imageEngine';
import { mmToPx } from '../../lib/printSpecs';
import { validateImageFile, fileToDataUrl, downloadBlob, errorMessage } from '../../lib/security';

type DocType = 'passport' | 'visa' | 'cnic' | 'license';
type BgColor = 'white' | 'skyblue' | 'gray';

interface DocSpec {
  title: string; widthMm: number; heightMm: number; note: string;
}

const DOC_SPECS: Record<DocType, DocSpec> = {
  passport: { title: 'ICAO Passport / Schengen', widthMm: 35, heightMm: 45, note: 'ICAO Doc 9303 standard 35 × 45 mm' },
  visa: { title: 'US Visa (2 × 2 in)', widthMm: 50.8, heightMm: 50.8, note: 'US 2 × 2 inch square visa photo (50.8 mm)' },
  cnic: { title: 'CNIC / National ID', widthMm: 35, heightMm: 45, note: 'National identity card spec 35 × 45 mm' },
  license: { title: 'Driving Licence', widthMm: 30, heightMm: 40, note: 'Licence portrait 30 × 40 mm' },
};

const BG_COLORS: Record<BgColor, string> = { white: '#FFFFFF', skyblue: '#5DADE2', gray: '#D8DCE1' };
const DPI = 300;
const SHEET = { widthMm: 210, heightMm: 297 }; // A4

export const PassportPhotoMaker: React.FC = () => {
  const { savePrintJob } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [originalSrc, setOriginalSrc] = useState<string | null>(null);
  const [originalImg, setOriginalImg] = useState<HTMLImageElement | null>(null);
  const [docType, setDocType] = useState<DocType>('passport');
  const [bgColor, setBgColor] = useState<BgColor>('white');
  const [copies, setCopies] = useState(8);
  const [verticalBias, setVerticalBias] = useState(0.25);
  const [tolerance, setTolerance] = useState(DEFAULT_REMOVE_BG_OPTIONS.tolerance);
  const [feather, setFeather] = useState(DEFAULT_REMOVE_BG_OPTIONS.feather);
  const [removeBg, setRemoveBg] = useState(true);
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(5);

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [removedPct, setRemovedPct] = useState<number | null>(null);
  const [confidence, setConfidence] = useState<'high' | 'medium' | 'low' | null>(null);
  const [activeTab, setActiveTab] = useState<'single' | 'sheet'>('sheet');

  const spec = DOC_SPECS[docType];
  const photoWpx = mmToPx(spec.widthMm, DPI);
  const photoHpx = mmToPx(spec.heightMm, DPI);

  /** Produce the final single-photo canvas at exact 300-DPI pixel dimensions. */
  const buildPhotoCanvas = useCallback(async (): Promise<HTMLCanvasElement> => {
    if (!originalImg) throw new Error('Upload a photo first.');

    // 1. Optional light enhancement (brightness/contrast) on the source.
    let workCanvas: HTMLCanvasElement;
    if (brightness !== 0 || contrast !== 5) {
      const enhanced = enhanceImage(originalImg, {
        scaleFactor: 1, sharpenAmount: 0, sharpenRadius: 1,
        brightness, contrast, saturation: 0, autoLevels: false,
      });
      workCanvas = enhanced.canvas;
    } else {
      workCanvas = document.createElement('canvas');
      workCanvas.width = originalImg.naturalWidth;
      workCanvas.height = originalImg.naturalHeight;
      workCanvas.getContext('2d')!.drawImage(originalImg, 0, 0);
    }

    // 2. Real background removal (flood-fill from border), if enabled.
    let subjectCanvas = workCanvas;
    if (removeBg) {
      // Clone so the enhancement canvas isn't mutated across rebuilds.
      const clone = document.createElement('canvas');
      clone.width = workCanvas.width;
      clone.height = workCanvas.height;
      clone.getContext('2d')!.drawImage(workCanvas, 0, 0);
      const result = removeBackground(clone, { tolerance, feather, edgeErosion: 0 });
      setRemovedPct(result.removedPct);
      setConfidence(result.confidence);
      subjectCanvas = result.canvas;
    } else {
      setRemovedPct(null);
      setConfidence(null);
    }

    // 3. Crop to the exact document aspect, anchored by verticalBias.
    const cropped = cropToPassportFrame(subjectCanvas, photoWpx, photoHpx, verticalBias);

    // 4. Composite onto the chosen solid background colour (removes transparency).
    const finalCanvas = compositeOnColor(cropped, BG_COLORS[bgColor]);
    return finalCanvas;
  }, [originalImg, brightness, contrast, removeBg, tolerance, feather, verticalBias, photoWpx, photoHpx, bgColor]);

  const [singlePreviewUrl, setSinglePreviewUrl] = useState<string | null>(null);
  const [sheetPreviewUrl, setSheetPreviewUrl] = useState<string | null>(null);

  // Rebuild previews whenever any input changes.
  const rebuild = useCallback(async () => {
    if (!originalImg) return;
    setIsProcessing(true);
    setError(null);
    try {
      const photo = await buildPhotoCanvas();
      const photoUrl = photo.toDataURL('image/png');
      setSinglePreviewUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return photoUrl; });

      const sheet = buildPrintSheet(photo, spec.widthMm, spec.heightMm, SHEET.widthMm, SHEET.heightMm, DPI, copies, 3, true);
      const sheetUrl = sheet.canvas.toDataURL('image/png');
      setSheetPreviewUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return sheetUrl; });
      if (sheet.placed < copies) {
        setError(`Only ${sheet.placed} of ${copies} copies fit on one A4 sheet at ${spec.widthMm}×${spec.heightMm}mm.`);
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setIsProcessing(false);
    }
  }, [originalImg, buildPhotoCanvas, spec, copies]);

  React.useEffect(() => { rebuild(); }, [rebuild]);

  const handleFile = async (file: File) => {
    setError(null);
    const invalid = validateImageFile(file, 20);
    if (invalid) { setError(invalid); return; }
    try {
      const dataUrl = await fileToDataUrl(file);
      const img = await loadImage(dataUrl);
      if (img.naturalWidth < photoWpx || img.naturalHeight < photoHpx) {
        setError(`Image is ${img.naturalWidth}×${img.naturalHeight}px but ${spec.widthMm}×${spec.heightMm}mm at ${DPI} DPI needs at least ${photoWpx}×${photoHpx}px. Choose a larger photo for a sharp print.`);
      }
      setOriginalSrc(dataUrl);
      setOriginalImg(img);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
  };

  const handleDownloadSingle = async () => {
    try {
      setIsProcessing(true);
      const photo = await buildPhotoCanvas();
      const blob = await canvasToPngWithDpi(photo, DPI); // real 300-DPI pHYs metadata
      downloadBlob(blob, `passport_${docType}_${spec.widthMm}x${spec.heightMm}mm_300dpi.png`);
      savePrintJob({
        title: `Passport Photo: ${spec.title} (${spec.widthMm}×${spec.heightMm}mm)`,
        toolType: 'Photo', status: 'Ready',
        summary: `Single 300-DPI ${spec.widthMm}×${spec.heightMm}mm photo (${photoWpx}×${photoHpx}px) on ${bgColor} background${removeBg ? ', background removed' : ''}.`,
      });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadSheet = async () => {
    try {
      setIsProcessing(true);
      const photo = await buildPhotoCanvas();
      const sheet = buildPrintSheet(photo, spec.widthMm, spec.heightMm, SHEET.widthMm, SHEET.heightMm, DPI, copies, 3, true);
      const blob = await canvasToPngWithDpi(sheet.canvas, DPI);
      downloadBlob(blob, `passport_sheet_A4_${sheet.placed}_copies_300dpi.png`);
      savePrintJob({
        title: `Passport Sheet: ${sheet.placed} × ${spec.title} on A4`,
        toolType: 'Photo', status: 'Ready',
        summary: `A4 sheet (${SHEET.widthMm}×${SHEET.heightMm}mm) tiled with ${sheet.placed} copies at ${spec.widthMm}×${spec.heightMm}mm, 300 DPI (${sheet.canvas.width}×${sheet.canvas.height}px).`,
      });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setVerticalBias(0.25); setTolerance(DEFAULT_REMOVE_BG_OPTIONS.tolerance);
    setFeather(DEFAULT_REMOVE_BG_OPTIONS.feather); setBrightness(0); setContrast(5);
  };

  const confidenceBadge = useMemo(() => {
    if (!removeBg || confidence === null) return null;
    const map = {
      high: { cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', label: 'Clean background detected' },
      medium: { cls: 'bg-amber-500/20 text-amber-300 border-amber-500/30', label: 'Uneven background — raise tolerance if edges remain' },
      low: { cls: 'bg-rose-500/20 text-rose-300 border-rose-500/30', label: 'Complex background — removal may be incomplete' },
    }[confidence];
    return <span className={`text-[10px] px-2 py-0.5 rounded-full border ${map.cls}`}>{map.label}</span>;
  }, [confidence, removeBg]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-semibold px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 mb-1">
            <Eraser className="w-3.5 h-3.5 text-blue-400" />
            <span>Local Background Removal &amp; 300-DPI Export</span>
          </div>
          <h2 className="text-2xl font-bold text-white">Passport &amp; Visa Photo Maker</h2>
          <p className="text-xs text-gray-400">Real flood-fill background removal, exact document dimensions, and 300-DPI PNG output with embedded pHYs metadata.</p>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start space-x-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls */}
        <div className="lg:col-span-5 space-y-5 bg-white/[0.03] border border-white/10 rounded-3xl p-5 backdrop-blur-md">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider">1. Select Photo</label>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/png,image/jpeg,image/webp" className="hidden" />
            <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-white/10 hover:border-blue-500/50 bg-white/[0.02] hover:bg-white/[0.05] rounded-2xl p-4 text-center cursor-pointer transition-all">
              <Upload className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-white">Click to upload a portrait photo</p>
              <p className="text-[10px] text-gray-400 mt-0.5">JPEG, PNG, WEBP · plain background works best · max 20 MB</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider">2. Document Size</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(DOC_SPECS) as DocType[]).map((key) => {
                const s = DOC_SPECS[key];
                return (
                  <button key={key} onClick={() => setDocType(key)}
                    className={`p-3 rounded-xl border text-left transition-all ${docType === key ? 'bg-blue-600/30 border-blue-500 text-white' : 'bg-white/[0.02] border-white/10 text-gray-300 hover:bg-white/[0.06]'}`}>
                    <span className="block text-xs font-semibold">{s.title}</span>
                    <span className="block text-[10px] text-blue-300 font-mono mt-0.5">{s.widthMm} × {s.heightMm} mm</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center justify-between text-xs font-bold text-gray-300 uppercase tracking-wider">
              <span>3. Background Removal</span>
              <input type="checkbox" checked={removeBg} onChange={(e) => setRemoveBg(e.target.checked)} className="accent-blue-500 w-4 h-4" />
            </label>
            {removeBg && (
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-[11px] text-gray-400"><span>Colour tolerance</span><span className="font-mono">{tolerance}</span></div>
                  <input type="range" min="8" max="80" value={tolerance} onChange={(e) => setTolerance(Number(e.target.value))} className="w-full accent-blue-500" />
                </div>
                <div>
                  <div className="flex justify-between text-[11px] text-gray-400"><span>Edge feather</span><span className="font-mono">{feather.toFixed(1)}</span></div>
                  <input type="range" min="0" max="4" step="0.5" value={feather} onChange={(e) => setFeather(Number(e.target.value))} className="w-full accent-blue-500" />
                </div>
                {confidenceBadge}
                {removedPct !== null && <p className="text-[10px] text-gray-500">Removed {removedPct}% of pixels as background.</p>}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider">4. Background Colour</label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(BG_COLORS) as BgColor[]).map((c) => (
                <button key={c} onClick={() => setBgColor(c)}
                  className={`p-2.5 rounded-xl border flex items-center justify-center space-x-2 text-xs font-medium ${bgColor === c ? 'border-blue-500 bg-blue-500/20 text-white' : 'border-white/10 bg-white/[0.02] text-gray-300'}`}>
                  <span className="w-4 h-4 rounded-full border border-gray-400" style={{ backgroundColor: BG_COLORS[c] }} />
                  <span className="capitalize">{c === 'skyblue' ? 'Sky' : c}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider">5. Copies on A4 Sheet</label>
            <div className="grid grid-cols-6 gap-1.5">
              {[1, 2, 4, 6, 8, 12].map((n) => (
                <button key={n} onClick={() => setCopies(n)}
                  className={`py-2 rounded-xl border text-xs font-bold ${copies === n ? 'bg-blue-600 text-white border-blue-500' : 'bg-white/[0.02] border-white/10 text-gray-400 hover:text-white'}`}>{n}</button>
              ))}
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between text-xs font-bold text-gray-300 uppercase tracking-wider">
              <span>Framing &amp; Tone</span>
              <button onClick={reset} className="text-[10px] text-blue-400 hover:underline flex items-center space-x-1 font-normal">
                <RefreshCw className="w-3 h-3" /><span>Reset</span>
              </button>
            </div>
            <div>
              <div className="flex justify-between text-[11px] text-gray-400"><span>Head position (crop bias)</span><span className="font-mono">{Math.round(verticalBias * 100)}%</span></div>
              <input type="range" min="0" max="1" step="0.05" value={verticalBias} onChange={(e) => setVerticalBias(Number(e.target.value))} className="w-full accent-blue-500" />
            </div>
            <div>
              <div className="flex justify-between text-[11px] text-gray-400"><span>Brightness</span><span className="font-mono">{brightness}</span></div>
              <input type="range" min="-50" max="50" value={brightness} onChange={(e) => setBrightness(Number(e.target.value))} className="w-full accent-blue-500" />
            </div>
            <div>
              <div className="flex justify-between text-[11px] text-gray-400"><span>Contrast</span><span className="font-mono">{contrast}</span></div>
              <input type="range" min="-50" max="50" value={contrast} onChange={(e) => setContrast(Number(e.target.value))} className="w-full accent-blue-500" />
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between bg-white/[0.03] border border-white/10 rounded-2xl p-2 backdrop-blur-md">
            <div className="flex space-x-1">
              <button onClick={() => setActiveTab('sheet')} className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 ${activeTab === 'sheet' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                <Printer className="w-3.5 h-3.5" /><span>A4 Print Sheet</span>
              </button>
              <button onClick={() => setActiveTab('single')} className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 ${activeTab === 'single' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                <ImageIcon className="w-3.5 h-3.5" /><span>Single Photo</span>
              </button>
            </div>
            <div className="text-[11px] text-gray-400 font-mono px-3">
              {spec.widthMm}×{spec.heightMm}mm = <span className="text-blue-300">{photoWpx}×{photoHpx}px @300</span>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-white/10 rounded-3xl p-6 backdrop-blur-md min-h-[420px] flex flex-col items-center justify-center relative overflow-hidden">
            {isProcessing && (
              <div className="absolute inset-0 z-20 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center space-y-3">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-semibold text-blue-300">Processing image…</p>
              </div>
            )}

            {!originalImg ? (
              <div className="text-center space-y-3 max-w-sm">
                <Camera className="w-12 h-12 text-gray-600 mx-auto" />
                <p className="text-sm font-semibold text-gray-300">No photo selected</p>
                <p className="text-xs text-gray-500">Upload a portrait with a plain, evenly-lit background. The remover floods from the image border, so subjects touching the frame edge are harder to isolate.</p>
              </div>
            ) : activeTab === 'single' ? (
              <div className="flex flex-col items-center space-y-3">
                {singlePreviewUrl ? (
                  <img src={singlePreviewUrl} alt="Passport preview" className="rounded border border-white/20 shadow-2xl" style={{ width: 180, height: Math.round(180 * photoHpx / photoWpx) }} />
                ) : (
                  <div className="w-[180px] h-[230px] bg-white/5 animate-pulse rounded" />
                )}
                <div className="text-center">
                  <p className="text-xs font-bold text-white">{spec.title}</p>
                  <p className="text-[11px] text-gray-400">{spec.note}</p>
                </div>
              </div>
            ) : (
              <div className="w-full flex justify-center">
                {sheetPreviewUrl ? (
                  <img src={sheetPreviewUrl} alt="A4 sheet preview" className="max-h-[420px] w-auto rounded shadow-2xl border border-gray-300 bg-white" />
                ) : (
                  <div className="w-[300px] h-[420px] bg-white/5 animate-pulse rounded" />
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/[0.03] border border-white/10 rounded-2xl p-4 backdrop-blur-md">
            <div className="flex items-center space-x-2 text-xs text-gray-400">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Output: {photoWpx} × {photoHpx}px @ 300 DPI PNG (pHYs)</span>
            </div>
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <button onClick={handleDownloadSingle} disabled={!originalImg || isProcessing}
                className="flex-1 sm:flex-none px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-40 text-white font-bold text-xs flex items-center justify-center space-x-2">
                <Download className="w-4 h-4" /><span>Single PNG</span>
              </button>
              <button onClick={handleDownloadSheet} disabled={!originalImg || isProcessing}
                className="flex-1 sm:flex-none px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2">
                <Printer className="w-4 h-4" /><span>A4 Sheet PNG</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

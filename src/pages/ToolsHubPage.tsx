import React, { useState } from 'react';
import { useAuth, ToolType } from '../context/AuthContext';
import {
  Stethoscope,
  CheckCircle2,
  Image as ImageIcon,
  CreditCard,
  DollarSign,
  Palette,
  Sliders,
  FileText,
  Sparkles,
  Download,
  Save,
  AlertCircle,
  Upload,
  Layers,
  User,
  Ruler,
  Award,
} from 'lucide-react';
import { PassportPhotoMaker } from '../components/tools/PassportPhotoMaker';
import { PaperSizeManager } from '../components/tools/PaperSizeManager';
import { PaperQualitySelector } from '../components/tools/PaperQualitySelector';
import { ResumeBuilderV2 } from '../components/tools/ResumeBuilderV2';
import { VisitingCardV2 } from '../components/tools/VisitingCardV2';
import { PrintOrderWizard } from '../components/tools/PrintOrderWizard';
import { IdCardDesigner } from '../components/tools/IdCardDesigner';
import { CertificateGenerator } from '../components/tools/CertificateGenerator';
import { PdfToolkit } from '../components/tools/PdfToolkit';
import { ImageEnhancer } from '../components/tools/ImageEnhancer';

import {
  runPrintDoctor,
  analyzeImagePixels,
  type DoctorReport,
  type ImageStats,
  type Severity,
} from '../lib/printDoctor';
import {
  runPreflight,
  readEmbeddedDpi,
  type PreflightResult,
  type CheckStatus,
} from '../lib/preflight';
import {
  buildPosterLayout,
  posterToSvg,
  COLOR_SCHEMES,
  type PosterLayout,
} from '../lib/posterEngine';
import { estimateCost, FINISHING_RATES_PER_1000, type CostBreakdown } from '../lib/costEstimator';
import { runColorAdvisor, type ColorAdviceResult } from '../lib/colorAdvisor';
import { PRINT_SIZES, PRINT_SIZE_MAP } from '../lib/printSpecs';
import { validateImageFile, errorMessage, downloadBlob } from '../lib/security';

const severityColor: Record<Severity, string> = {
  Critical: 'text-rose-400 border-rose-500/30 bg-rose-500/10',
  Major: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
  Minor: 'text-sky-400 border-sky-500/30 bg-sky-500/10',
  Info: 'text-slate-400 border-slate-500/30 bg-slate-500/10',
};

const statusColor: Record<CheckStatus, string> = {
  Pass: 'text-emerald-400',
  Warning: 'text-amber-400',
  Fail: 'text-rose-400',
};

/** Load an uploaded image file into an HTMLImageElement + read its raw bytes. */
async function readImageFile(file: File): Promise<{ img: HTMLImageElement; buffer: ArrayBuffer }> {
  const buffer = await file.arrayBuffer();
  const url = URL.createObjectURL(new Blob([buffer], { type: file.type }));
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('Could not decode that image.'));
    el.src = url;
  });
  URL.revokeObjectURL(url);
  return { img, buffer };
}

/** Detect whether an image actually contains transparent (alpha) pixels. */
function hasAlphaChannel(img: HTMLImageElement): boolean {
  const c = document.createElement('canvas');
  const scale = Math.min(1, 512 / Math.max(img.naturalWidth, img.naturalHeight));
  c.width = Math.max(1, Math.round(img.naturalWidth * scale));
  c.height = Math.max(1, Math.round(img.naturalHeight * scale));
  const ctx = c.getContext('2d')!;
  ctx.drawImage(img, 0, 0, c.width, c.height);
  const data = ctx.getImageData(0, 0, c.width, c.height).data;
  for (let i = 3; i < data.length; i += 4) if (data[i] < 255) return true;
  return false;
}

export const ToolsHubPage: React.FC = () => {
  const { activeTool, setActiveTool, savePrintJob } = useAuth();
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const toolsNav: { id: ToolType; label: string; icon: React.ElementType; category: string }[] = [
    { id: 'order-wizard', label: 'Print Order Wizard', icon: Sparkles, category: 'Guided Workflow' },
    { id: 'passport', label: 'Passport Photo Maker', icon: User, category: 'Photos & IDs' },
    { id: 'idcard', label: 'ID Card Designer', icon: CreditCard, category: 'Photos & IDs' },
    { id: 'resume', label: 'Resume Builder', icon: FileText, category: 'Documents' },
    { id: 'certificate', label: 'Certificate Generator', icon: Award, category: 'Documents' },
    { id: 'card', label: 'Visiting Card', icon: CreditCard, category: 'Business Cards' },
    { id: 'paper-manager', label: 'Paper Size & Quality', icon: Ruler, category: 'Media Specs' },
    { id: 'pdf-tools', label: 'PDF Toolkit', icon: Layers, category: 'Pre-flight' },
    { id: 'preflight', label: 'Readiness Checker', icon: CheckCircle2, category: 'Pre-flight' },
    { id: 'doctor', label: 'Print Doctor', icon: Stethoscope, category: 'Press Diagnosis' },
    { id: 'poster', label: 'Poster Generator', icon: ImageIcon, category: 'Design' },
    { id: 'cost', label: 'Cost Estimator', icon: DollarSign, category: 'Pricing' },
    { id: 'color', label: 'Color Advisor', icon: Palette, category: 'Pre-press Color' },
    { id: 'enhance', label: 'Image Enhancer', icon: Sliders, category: 'Raster & Scale' },
  ];

  // ---- Print Doctor ----
  const [docIssue, setDocIssue] = useState('');
  const [docTech, setDocTech] = useState('Commercial Digital Offset');
  const [docPaper, setDocPaper] = useState('');
  const [docTargetWidthMm, setDocTargetWidthMm] = useState(210);
  const [docTargetDpi, setDocTargetDpi] = useState(300);
  const [docReport, setDocReport] = useState<DoctorReport | null>(null);
  const [docError, setDocError] = useState<string | null>(null);
  const [docBusy, setDocBusy] = useState(false);

  const runDoctor = async (file: File | null) => {
    setDocBusy(true);
    setDocError(null);
    try {
      let imageStats: ImageStats | null = null;
      if (file) {
        const verr = validateImageFile(file, 25);
        if (verr) throw new Error(verr);
        const { img } = await readImageFile(file);
        imageStats = analyzeImagePixels(img, { fileName: file.name, format: file.type, fileSizeMb: file.size / 1024 / 1024 });
      }
      if (!file && !docIssue.trim()) {
        throw new Error('Describe the defect symptoms or upload a print sample image to analyse.');
      }
      const report = runPrintDoctor({
        issueDescription: docIssue,
        printType: docTech,
        paperType: docPaper,
        imageStats,
        targetPrintWidthMm: docTargetWidthMm,
        targetDpi: docTargetDpi,
      });
      setDocReport(report);
    } catch (err) {
      setDocError(errorMessage(err));
    } finally {
      setDocBusy(false);
    }
  };

  // ---- Preflight ----
  const [pfPrintWidthMm, setPfPrintWidthMm] = useState(210);
  const [pfPrintHeightMm, setPfPrintHeightMm] = useState(297);
  const [pfHasBleed, setPfHasBleed] = useState(true);
  const [pfColorMode, setPfColorMode] = useState<'RGB' | 'CMYK' | 'Grayscale'>('RGB');
  const [pfResult, setPfResult] = useState<PreflightResult | null>(null);
  const [pfMeta, setPfMeta] = useState<string | null>(null);
  const [pfError, setPfError] = useState<string | null>(null);
  const [pfBusy, setPfBusy] = useState(false);

  const runPreflightCheck = async (file: File) => {
    setPfBusy(true);
    setPfError(null);
    try {
      const verr = validateImageFile(file, 50);
      if (verr) throw new Error(verr);
      const { img, buffer } = await readImageFile(file);
      const embeddedDpi = readEmbeddedDpi(buffer, file.name);
      const result = runPreflight({
        fileName: file.name,
        fileSizeMb: file.size / 1024 / 1024,
        format: file.type,
        widthPx: img.naturalWidth,
        heightPx: img.naturalHeight,
        embeddedDpi,
        hasAlpha: hasAlphaChannel(img),
        printWidthMm: pfPrintWidthMm,
        printHeightMm: pfPrintHeightMm,
        hasBleed: pfHasBleed,
        colorMode: pfColorMode,
      });
      setPfResult(result);
      setPfMeta(`${img.naturalWidth} × ${img.naturalHeight} px · ${(file.size / 1024 / 1024).toFixed(2)} MB · ${file.type}${embeddedDpi ? ` · header ${embeddedDpi} DPI` : ' · no header DPI'}`);
    } catch (err) {
      setPfError(errorMessage(err));
    } finally {
      setPfBusy(false);
    }
  };

  // ---- Poster ----
  const [poTitle, setPoTitle] = useState('');
  const [poSubtitle, setPoSubtitle] = useState('');
  const [poCategory, setPoCategory] = useState('Event');
  const [poScheme, setPoScheme] = useState('neon');
  const [poSize, setPoSize] = useState('a3');
  const [poDate, setPoDate] = useState('');
  const [poLocation, setPoLocation] = useState('');
  const [poLayout, setPoLayout] = useState<PosterLayout | null>(null);
  const [poSvg, setPoSvg] = useState<string | null>(null);
  const [poError, setPoError] = useState<string | null>(null);

  const generatePoster = () => {
    setPoError(null);
    try {
      if (!poTitle.trim()) throw new Error('Enter a poster title.');
      const layout = buildPosterLayout({
        title: poTitle, subtitle: poSubtitle, category: poCategory,
        colorSchemeId: poScheme, sizeId: poSize, eventDate: poDate, location: poLocation,
        includeCropMarks: true,
      });
      setPoLayout(layout);
      setPoSvg(posterToSvg(layout));
    } catch (err) {
      setPoError(errorMessage(err));
    }
  };

  const downloadPosterSvg = () => {
    if (!poSvg) return;
    downloadBlob(new Blob([poSvg], { type: 'image/svg+xml' }), 'poster.svg');
    if (poLayout) savePrintJob({ title: `Poster: ${poLayout.title}`, toolType: 'Poster', status: 'Ready', summary: `${poLayout.widthMm}×${poLayout.heightMm}mm @ ${poLayout.dpi} DPI, ${poLayout.bleedMm}mm bleed.` });
  };

  // ---- Cost ----
  const [costQty, setCostQty] = useState(2500);
  const [costItemW, setCostItemW] = useState(210);
  const [costItemH, setCostItemH] = useState(297);
  const [costPages, setCostPages] = useState(8);
  const [costSheet, setCostSheet] = useState('483x648');
  const [costGsm, setCostGsm] = useState(170);
  const [costColorType, setCostColorType] = useState<'4/0 CMYK Single Sided' | '4/4 CMYK Double Sided' | '1/1 Black & White' | '2/2 Two-Colour'>('4/4 CMYK Double Sided');
  const [costFinishing, setCostFinishing] = useState<string[]>(['Saddle Stitching']);
  const [costTurnaround, setCostTurnaround] = useState(5);
  const [costData, setCostData] = useState<CostBreakdown | null>(null);
  const [costError, setCostError] = useState<string | null>(null);

  const SHEETS: Record<string, { w: number; h: number; label: string }> = {
    '483x648': { w: 483, h: 648, label: '19 × 25.5 in (parent)' },
    '700x1000': { w: 700, h: 1000, label: 'B1 700 × 1000 mm' },
    '640x900': { w: 640, h: 900, label: '640 × 900 mm' },
    '450x640': { w: 450, h: 640, label: '450 × 640 mm' },
  };

  const runCost = () => {
    setCostError(null);
    try {
      const sheet = SHEETS[costSheet];
      const result = estimateCost({
        itemName: 'Print job',
        quantity: costQty,
        pagesPerItem: costPages,
        itemWidthMm: costItemW,
        itemHeightMm: costItemH,
        sheetWidthMm: sheet.w,
        sheetHeightMm: sheet.h,
        paperGsm: costGsm,
        paperType: 'Coated',
        colorType: costColorType,
        finishing: costFinishing,
        turnaroundDays: costTurnaround,
      });
      setCostData(result);
    } catch (err) {
      setCostError(errorMessage(err));
    }
  };

  const toggleFinishing = (op: string) =>
    setCostFinishing((prev) => (prev.includes(op) ? prev.filter((x) => x !== op) : [...prev, op]));

  // ---- Color ----
  const [colorInput, setColorInput] = useState('#0033FF, #FF0033, #00FF66');
  const [colorSubstrate, setColorSubstrate] = useState('Coated Art Paper (Gloss)');
  const [colorData, setColorData] = useState<ColorAdviceResult | null>(null);
  const [colorError, setColorError] = useState<string | null>(null);

  const runColor = () => {
    setColorError(null);
    try {
      const hexes = colorInput.split(/[,\s]+/).map((s) => s.trim()).filter(Boolean);
      if (hexes.length === 0) throw new Error('Enter at least one hex colour (e.g. #0033FF).');
      const result = runColorAdvisor(hexes, colorSubstrate);
      if (result.analyzedColors.length === 0) throw new Error('No valid hex colours found. Use #RGB or #RRGGBB format.');
      setColorData(result);
    } catch (err) {
      setColorError(errorMessage(err));
    }
  };

  const triggerSave = (title: string, toolType: string, summary: string, details?: unknown) => {
    savePrintJob({ title, toolType, status: 'Ready', summary, details });
    setSavedNotice(`Saved "${title}" to your dashboard history.`);
    setTimeout(() => setSavedNotice(null), 3500);
  };

  const inputCls = 'w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500';

  return (
    <div className="min-h-screen text-white p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-medium uppercase tracking-wider px-4 py-2 rounded-full bg-white/5 text-blue-300 border border-white/10 mb-2 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Deterministic Pre-press Suite</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Tools Hub</h1>
          <p className="text-sm text-gray-400">Local, deterministic print engineering tools — every result is computed from your inputs, not simulated.</p>
        </div>
        {savedNotice && (
          <div className="px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center space-x-2 backdrop-blur-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /><span>{savedNotice}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {toolsNav.map((tab) => {
          const IconComp = tab.icon;
          const isActive = activeTool === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTool(tab.id)}
              className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between space-y-2 backdrop-blur-sm ${isActive ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/30' : 'bg-white/[0.03] text-gray-300 border-white/10 hover:border-white/20 hover:bg-white/[0.06]'}`}
            >
              <IconComp className={`w-5 h-5 ${isActive ? 'text-white' : 'text-blue-400'}`} />
              <div>
                <span className="block text-[10px] opacity-75 font-mono uppercase tracking-wider">{tab.category}</span>
                <span className="block text-xs font-bold leading-tight mt-0.5">{tab.label}</span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="rounded-3xl bg-white/[0.03] border border-white/10 p-6 sm:p-8 backdrop-blur-md space-y-8 shadow-2xl">
        {activeTool === 'passport' && <PassportPhotoMaker />}
        {activeTool === 'idcard' && <IdCardDesigner />}
        {activeTool === 'certificate' && <CertificateGenerator />}
        {activeTool === 'pdf-tools' && <PdfToolkit />}
        {activeTool === 'order-wizard' && <PrintOrderWizard />}
        {activeTool === 'card' && <VisitingCardV2 />}
        {activeTool === 'resume' && <ResumeBuilderV2 />}
        {activeTool === 'enhance' && <ImageEnhancer />}
        {activeTool === 'paper-manager' && (
          <div className="space-y-10"><PaperSizeManager /><PaperQualitySelector /></div>
        )}

        {/* ---- PREFLIGHT ---- */}
        {activeTool === 'preflight' && (
          <div className="space-y-6">
            <ToolHead icon={CheckCircle2} tone="emerald" title="Print Readiness Pre-flight Checker" sub="Analyses a real uploaded image: dimensions, embedded DPI, format, effective DPI at trim size, colour mode and bleed." />
            {pfError && <ErrorBox msg={pfError} />}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <label className="block w-full cursor-pointer">
                  <div className="rounded-2xl border-2 border-dashed border-white/15 bg-white/[0.02] p-6 text-center hover:border-emerald-500/40 transition-colors">
                    <Upload className="w-7 h-7 mx-auto text-emerald-400 mb-2" />
                    <p className="text-xs font-bold text-white">Upload artwork to check</p>
                    <p className="text-[11px] text-slate-400 mt-1">JPEG/PNG/WEBP · real metadata is read locally</p>
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) runPreflightCheck(f); }} />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs text-slate-300 mb-1">Trim width (mm)</label><input type="number" value={pfPrintWidthMm} onChange={(e) => setPfPrintWidthMm(Number(e.target.value))} className={inputCls} /></div>
                  <div><label className="block text-xs text-slate-300 mb-1">Trim height (mm)</label><input type="number" value={pfPrintHeightMm} onChange={(e) => setPfPrintHeightMm(Number(e.target.value))} className={inputCls} /></div>
                </div>
                <div><label className="block text-xs text-slate-300 mb-1">Colour mode of source</label>
                  <select value={pfColorMode} onChange={(e) => setPfColorMode(e.target.value as 'RGB' | 'CMYK' | 'Grayscale')} className={inputCls}>
                    <option value="RGB">RGB</option><option value="CMYK">CMYK</option><option value="Grayscale">Grayscale</option>
                  </select>
                </div>
                <label className="flex items-center space-x-2 text-xs text-slate-300">
                  <input type="checkbox" checked={pfHasBleed} onChange={(e) => setPfHasBleed(e.target.checked)} className="accent-emerald-500" />
                  <span>Artwork includes 3mm bleed</span>
                </label>
                {pfBusy && <p className="text-xs text-slate-400">Analysing…</p>}
              </div>

              <div className="md:col-span-2 rounded-2xl bg-slate-950 border border-slate-800 p-6 space-y-4">
                {pfResult ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <span className="text-xs text-slate-400">Certificate {pfResult.certificate.certificateId}</span>
                        <h3 className="text-lg font-bold text-white mt-0.5">Score: {pfResult.preflightScore}/100 · <span className={statusColor[pfResult.overallStatus]}>{pfResult.overallStatus}</span></h3>
                        {pfMeta && <p className="text-[11px] text-slate-500 mt-0.5">{pfMeta}</p>}
                      </div>
                      <button onClick={() => triggerSave(`Pre-flight: ${pfResult.certificate.certificateId}`, 'Preflight', `Score ${pfResult.preflightScore}/100`, pfResult)} className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white flex items-center space-x-1.5">
                        <Save className="w-3.5 h-3.5 text-indigo-400" /><span>Save</span>
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {pfResult.checklistResults.map((item, i) => (
                        <div key={i} className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1">
                          <div className="flex items-center justify-between font-bold text-slate-200"><span>{item.checkItem}</span><span className={statusColor[item.status]}>{item.status}</span></div>
                          <p className="text-slate-400 text-[11px] leading-tight">{item.detail}</p>
                        </div>
                      ))}
                    </div>
                    {pfResult.autoFixActions.length > 0 && (
                      <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-900 text-xs">
                        <span className="font-bold block text-indigo-300 mb-1">Recommended fixes:</span>
                        <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-300">{pfResult.autoFixActions.map((a, i) => <li key={i}>{a}</li>)}</ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <EmptyState icon={CheckCircle2} text="Upload an image to run a real pre-flight audit." />
                )}
              </div>
            </div>
          </div>
        )}

        {/* ---- DOCTOR ---- */}
        {activeTool === 'doctor' && (
          <div className="space-y-6">
            <ToolHead icon={Stethoscope} tone="amber" title="Print Doctor" sub="Deterministic diagnosis from a symptom rule-base plus real pixel analysis of an uploaded print/photo sample." />
            {docError && <ErrorBox msg={docError} />}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div><label className="block text-xs text-slate-300 mb-1">Print technology / press</label>
                  <select value={docTech} onChange={(e) => setDocTech(e.target.value)} className={inputCls}>
                    <option>Commercial Digital Offset</option><option>Wide Format Eco-Solvent / UV</option><option>Flexographic Roll Printing</option><option>Screen Printing</option><option>Inkjet / Large Format</option>
                  </select>
                </div>
                <div><label className="block text-xs text-slate-300 mb-1">Paper / substrate</label><input type="text" value={docPaper} onChange={(e) => setDocPaper(e.target.value)} placeholder="e.g. 300 GSM gloss art card" className={inputCls} /></div>
                <div><label className="block text-xs text-slate-300 mb-1">Defect symptoms</label>
                  <textarea rows={3} value={docIssue} onChange={(e) => setDocIssue(e.target.value)} placeholder="e.g. horizontal banding, blurry fine text, ghosting…" className={inputCls} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs text-slate-300 mb-1">Target width (mm)</label><input type="number" value={docTargetWidthMm} onChange={(e) => setDocTargetWidthMm(Number(e.target.value))} className={inputCls} /></div>
                  <div><label className="block text-xs text-slate-300 mb-1">Target DPI</label><input type="number" value={docTargetDpi} onChange={(e) => setDocTargetDpi(Number(e.target.value))} className={inputCls} /></div>
                </div>
                <label className="block w-full cursor-pointer">
                  <div className="rounded-xl border border-dashed border-white/15 p-3 text-center hover:border-amber-500/40">
                    <Upload className="w-5 h-5 mx-auto text-amber-400 mb-1" />
                    <p className="text-[11px] text-slate-300">Attach a print/photo sample for pixel analysis</p>
                  </div>
                  <input id="doctorFile" type="file" accept="image/*" className="hidden" />
                </label>
                <button
                  onClick={async () => {
                    const input = document.getElementById('doctorFile') as HTMLInputElement | null;
                    await runDoctor(input?.files?.[0] ?? null);
                  }}
                  disabled={docBusy}
                  className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-semibold text-sm flex items-center justify-center space-x-2"
                >
                  {docBusy ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Stethoscope className="w-4 h-4" />}
                  <span>Run Diagnosis</span>
                </button>
              </div>

              <div className="md:col-span-2 rounded-2xl bg-slate-950 border border-slate-800 p-6 space-y-4">
                {docReport ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <h3 className="text-lg font-bold text-white">{docReport.findings.length} finding(s)</h3>
                      <button onClick={() => triggerSave(`Print Doctor: ${docTech}`, 'Doctor', `${docReport.findings.length} findings`, docReport)} className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white flex items-center space-x-1.5">
                        <Save className="w-3.5 h-3.5 text-indigo-400" /><span>Save</span>
                      </button>
                    </div>
                    {docReport.imageStats && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                        <MiniStat label="Dimensions" value={`${docReport.imageStats.widthPx}×${docReport.imageStats.heightPx}`} />
                        <MiniStat label="Brightness" value={`${docReport.imageStats.meanBrightness}/255`} />
                        <MiniStat label="Sharpness" value={docReport.imageStats.sharpnessScore.toFixed(3)} />
                        <MiniStat label="Saturation" value={docReport.imageStats.meanSaturation.toFixed(3)} />
                      </div>
                    )}
                    <div className="space-y-2">
                      {docReport.findings.map((f, i) => (
                        <div key={i} className={`p-3 rounded-xl border ${severityColor[f.severity]}`}>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white">{f.title}</span>
                            <span className="text-[10px] font-mono opacity-80">{f.severity} · {f.category}</span>
                          </div>
                          <p className="text-[11px] text-slate-200 mt-1 leading-snug">{f.explanation}</p>
                          <p className="text-[11px] mt-1 leading-snug opacity-90"><span className="font-bold">Fix:</span> {f.recommendation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <EmptyState icon={Stethoscope} text="Describe symptoms and/or upload a sample, then run the diagnosis." />
                )}
              </div>
            </div>
          </div>
        )}

        {/* ---- POSTER ---- */}
        {activeTool === 'poster' && (
          <div className="space-y-6">
            <ToolHead icon={ImageIcon} tone="indigo" title="Poster Generator" sub="Deterministic local layout engine: real 300 DPI dimensions, 3mm bleed, and a reproducible palette. Rendered as safe SVG (never injected HTML)." />
            {poError && <ErrorBox msg={poError} />}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <div><label className="block text-xs text-slate-300 mb-1">Title</label><input type="text" value={poTitle} onChange={(e) => setPoTitle(e.target.value)} placeholder="Poster headline" className={inputCls} /></div>
                <div><label className="block text-xs text-slate-300 mb-1">Subtitle</label><input type="text" value={poSubtitle} onChange={(e) => setPoSubtitle(e.target.value)} className={inputCls} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs text-slate-300 mb-1">Category</label><input type="text" value={poCategory} onChange={(e) => setPoCategory(e.target.value)} className={inputCls} /></div>
                  <div><label className="block text-xs text-slate-300 mb-1">Size</label>
                    <select value={poSize} onChange={(e) => setPoSize(e.target.value)} className={inputCls}>
                      {PRINT_SIZES.filter((s) => s.category === 'Large Format' || s.category === 'ISO Standard').map((s) => <option key={s.id} value={s.id}>{s.name} ({s.widthMm}×{s.heightMm})</option>)}
                    </select>
                  </div>
                </div>
                <div><label className="block text-xs text-slate-300 mb-1">Colour scheme</label>
                  <select value={poScheme} onChange={(e) => setPoScheme(e.target.value)} className={inputCls}>
                    {Object.entries(COLOR_SCHEMES).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs text-slate-300 mb-1">Event date</label><input type="text" value={poDate} onChange={(e) => setPoDate(e.target.value)} className={inputCls} /></div>
                  <div><label className="block text-xs text-slate-300 mb-1">Location</label><input type="text" value={poLocation} onChange={(e) => setPoLocation(e.target.value)} className={inputCls} /></div>
                </div>
                <button onClick={generatePoster} className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm flex items-center justify-center space-x-2">
                  <Sparkles className="w-4 h-4" /><span>Generate Layout</span>
                </button>
              </div>

              <div className="md:col-span-2 rounded-2xl bg-slate-950 border border-slate-800 p-6 flex flex-col items-center space-y-4">
                {poSvg && poLayout ? (
                  <div className="w-full space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <h3 className="text-lg font-bold text-white">{poLayout.title}</h3>
                        <p className="text-xs text-slate-400">{poLayout.widthMm}×{poLayout.heightMm}mm · {poLayout.dpi} DPI · {poLayout.bleedMm}mm bleed · {poLayout.widthPx}×{poLayout.heightPx}px</p>
                      </div>
                      <div className="flex space-x-2">
                        <button onClick={downloadPosterSvg} className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white flex items-center space-x-1"><Download className="w-3.5 h-3.5" /><span>SVG</span></button>
                        <button onClick={() => triggerSave(`Poster: ${poLayout.title}`, 'Poster', `${poLayout.widthMm}×${poLayout.heightMm}mm`, poLayout)} className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white flex items-center space-x-1"><Save className="w-3.5 h-3.5" /><span>Save</span></button>
                      </div>
                    </div>
                    <div className="w-full max-w-sm mx-auto rounded-2xl bg-slate-900 border border-slate-800 p-2 overflow-hidden">
                      {/* SVG rendered in an <img> context — scripts cannot execute here. */}
                      <img src={`data:image/svg+xml;utf8,${encodeURIComponent(poSvg)}`} alt="Poster preview" className="w-full h-auto" />
                    </div>
                    <p className="text-[11px] text-slate-500">Recommended stock: {poLayout.recommendedPaper}</p>
                  </div>
                ) : (
                  <EmptyState icon={ImageIcon} text="Fill in the title and generate a deterministic poster layout." />
                )}
              </div>
            </div>
          </div>
        )}

        {/* ---- COST ---- */}
        {activeTool === 'cost' && (
          <div className="space-y-6">
            <ToolHead icon={DollarSign} tone="cyan" title="Print Cost Estimator" sub="Transparent deterministic model: real sheet-nesting, GSM-based paper weight, plate/ink/labour/finishing rate cards and volume margin tiers. No invented figures." />
            {costError && <ErrorBox msg={costError} />}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="block text-[11px] text-slate-300">Quantity</label><input type="number" value={costQty} onChange={(e) => setCostQty(Number(e.target.value))} className={inputCls} /></div>
                  <div><label className="block text-[11px] text-slate-300">Pages/item</label><input type="number" value={costPages} onChange={(e) => setCostPages(Number(e.target.value))} className={inputCls} /></div>
                  <div><label className="block text-[11px] text-slate-300">Item W (mm)</label><input type="number" value={costItemW} onChange={(e) => setCostItemW(Number(e.target.value))} className={inputCls} /></div>
                  <div><label className="block text-[11px] text-slate-300">Item H (mm)</label><input type="number" value={costItemH} onChange={(e) => setCostItemH(Number(e.target.value))} className={inputCls} /></div>
                  <div><label className="block text-[11px] text-slate-300">GSM</label><input type="number" value={costGsm} onChange={(e) => setCostGsm(Number(e.target.value))} className={inputCls} /></div>
                  <div><label className="block text-[11px] text-slate-300">Days</label><input type="number" value={costTurnaround} onChange={(e) => setCostTurnaround(Number(e.target.value))} className={inputCls} /></div>
                </div>
                <div><label className="block text-[11px] text-slate-300">Parent sheet</label>
                  <select value={costSheet} onChange={(e) => setCostSheet(e.target.value)} className={inputCls}>
                    {Object.entries(SHEETS).map(([k, v]) => <option key={k} value={k}>{v.w}×{v.h} mm — {v.label}</option>)}
                  </select>
                </div>
                <div><label className="block text-[11px] text-slate-300">Colour</label>
                  <select value={costColorType} onChange={(e) => setCostColorType(e.target.value as typeof costColorType)} className={inputCls}>
                    <option>4/4 CMYK Double Sided</option><option>4/0 CMYK Single Sided</option><option>2/2 Two-Colour</option><option>1/1 Black & White</option>
                  </select>
                </div>
                <div><label className="block text-[11px] text-slate-300 mb-1">Finishing</label>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.keys(FINISHING_RATES_PER_1000).map((op) => (
                      <button key={op} onClick={() => toggleFinishing(op)} className={`px-2 py-1 rounded-lg text-[10px] border ${costFinishing.includes(op) ? 'bg-cyan-600/30 border-cyan-500 text-white' : 'bg-white/5 border-white/10 text-slate-400'}`}>{op}</button>
                    ))}
                  </div>
                </div>
                <button onClick={runCost} className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center justify-center space-x-2"><DollarSign className="w-4 h-4" /><span>Calculate Estimate</span></button>
              </div>

              <div className="md:col-span-2 rounded-2xl bg-slate-950 border border-slate-800 p-6 space-y-4">
                {costData ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <span className="text-xs text-slate-400">Base production ${costData.totalBaseProductionCost}</span>
                        <h3 className="text-xl font-extrabold text-emerald-400">Suggested retail ${costData.suggestedRetailPrice}</h3>
                      </div>
                      <button onClick={() => triggerSave('Cost Estimate', 'Cost', `Retail $${costData.suggestedRetailPrice}`, costData)} className="px-3 py-1.5 rounded-xl bg-slate-800 text-xs font-semibold text-white flex items-center space-x-1"><Save className="w-3.5 h-3.5 text-indigo-400" /><span>Save</span></button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <MiniStat label="Unit cost" value={`$${costData.perUnitPrice}`} />
                      <MiniStat label="Margin" value={costData.estimatedProfitMargin} />
                      <MiniStat label="Paper" value={`$${costData.estimatedRawPaperCost}`} />
                      <MiniStat label="Finishing" value={`$${costData.estimatedFinishingCost}`} />
                      <MiniStat label="Ink" value={`$${costData.estimatedInkSolventCost}`} />
                      <MiniStat label="Labour+machine" value={`$${costData.labourAndMachineCost}`} />
                      <MiniStat label="Plate/prepress" value={`$${costData.estimatedPlateAndPrepressCost}`} />
                      <MiniStat label="Rush" value={`$${costData.rushSurcharge}`} />
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300 space-y-1">
                      <p><span className="text-slate-500">Nesting:</span> {costData.sheetOptimization.upsPerSheet}-up ({costData.sheetOptimization.columns}×{costData.sheetOptimization.rows}{costData.sheetOptimization.itemRotated ? ', rotated' : ''}) · {costData.sheetOptimization.totalParentSheetsRequired} sheets incl. {costData.sheetOptimization.spoilageAllowanceSheets} spoilage ({costData.sheetOptimization.paperWastePercent})</p>
                      <p><span className="text-slate-500">Paper weight:</span> {costData.paperWeightKg} kg</p>
                    </div>
                    <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-900 text-[11px] text-slate-300">
                      <span className="font-bold block text-cyan-300 mb-1">Savings tips:</span>
                      <ul className="list-disc list-inside space-y-0.5">{costData.costSavingsTips.map((t, i) => <li key={i}>{t}</li>)}</ul>
                    </div>
                  </div>
                ) : (
                  <EmptyState icon={DollarSign} text="Set quantity, size and stock, then calculate a transparent estimate." />
                )}
              </div>
            </div>
          </div>
        )}

        {/* ---- COLOR ---- */}
        {activeTool === 'color' && (
          <div className="space-y-6">
            <ToolHead icon={Palette} tone="rose" title="Color Advisor" sub="Deterministic RGB→CMYK conversion, CIE76 ΔE gamut estimation, nearest-Pantone matching and total ink coverage checks." />
            {colorError && <ErrorBox msg={colorError} />}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div><label className="block text-xs text-slate-300 mb-1">Hex colours (comma separated)</label><input type="text" value={colorInput} onChange={(e) => setColorInput(e.target.value)} placeholder="#0033FF, #FF0033" className={inputCls} /></div>
                <div><label className="block text-xs text-slate-300 mb-1">Substrate</label>
                  <select value={colorSubstrate} onChange={(e) => setColorSubstrate(e.target.value)} className={inputCls}>
                    <option>Coated Art Paper (Gloss)</option><option>Uncoated Offset Bond</option><option>Newsprint</option><option>Matte Art Paper</option>
                  </select>
                </div>
                <button onClick={runColor} className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center justify-center space-x-2"><Palette className="w-4 h-4" /><span>Analyse Colours</span></button>
              </div>

              <div className="md:col-span-2 rounded-2xl bg-slate-950 border border-slate-800 p-6 space-y-4">
                {colorData ? (
                  <div className="space-y-4">
                    <p className="text-xs font-bold text-amber-400 border-b border-slate-800 pb-2">{colorData.gamutStatus}</p>
                    <div className="space-y-3">
                      {colorData.analyzedColors.map((col, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-3">
                            <div className="flex flex-col gap-0.5">
                              <div className="w-6 h-6 rounded border border-slate-700" style={{ backgroundColor: col.sourceHex }} title="source" />
                              <div className="w-6 h-6 rounded border border-slate-700" style={{ backgroundColor: col.correctedHex }} title="CMYK press preview" />
                            </div>
                            <div>
                              <span className="font-bold text-white">{col.sourceHex} → {col.correctedHex}</span>
                              <span className="text-[11px] text-slate-400 block">{col.cmykString} · TAC {col.totalInkCoverage}%</span>
                              <span className="text-[10px] text-slate-500 block">{col.gamutWarning}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-indigo-400 block">{col.nearestPantone.name}</span>
                            <span className="text-[10px] text-slate-500">ΔE {col.nearestPantone.deltaE}</span>
                            <span className={`block text-[10px] ${col.inGamut ? 'text-emerald-400' : 'text-amber-400'}`}>{col.inGamut ? 'In gamut' : 'Gamut shift'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300 space-y-1">
                      <p><span className="text-slate-500">TAC:</span> {colorData.tacAdvice}</p>
                      <p><span className="text-slate-500">Profile:</span> {colorData.pressProfileRecommendation}</p>
                    </div>
                  </div>
                ) : (
                  <EmptyState icon={Palette} text="Enter hex colours and analyse gamut, CMYK and Pantone matches." />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const TONE_CLASSES: Record<string, string> = {
  emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  amber: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  indigo: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  cyan: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  rose: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
};

const ToolHead: React.FC<{ icon: React.ElementType; tone: string; title: string; sub: string }> = ({ icon: Icon, tone, title, sub }) => (
  <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
    <div className={`p-3 rounded-2xl border ${TONE_CLASSES[tone] ?? TONE_CLASSES.indigo}`}><Icon className="w-6 h-6" /></div>
    <div><h2 className="text-xl font-bold text-white">{title}</h2><p className="text-xs text-slate-400 max-w-2xl">{sub}</p></div>
  </div>
);

const ErrorBox: React.FC<{ msg: string }> = ({ msg }) => (
  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-start gap-2">
    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{msg}</span>
  </div>
);

const EmptyState: React.FC<{ icon: React.ElementType; text: string }> = ({ icon: Icon, text }) => (
  <div className="h-64 flex flex-col items-center justify-center text-center text-slate-500 text-xs space-y-2 w-full">
    <Icon className="w-10 h-10 text-slate-700" /><p>{text}</p>
  </div>
);

const MiniStat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
    <span className="text-slate-500 block text-[10px]">{label}</span>
    <span className="font-bold text-white text-sm">{value}</span>
  </div>
);

import React, { useState } from 'react';
import {
  Upload,
  CheckCircle2,
  Printer,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  FileText,
  Check,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PaperSizeManager, paperSizePresets, PaperSizeSpec } from './PaperSizeManager';
import { PaperQualitySelector, paperQualityOptions, PaperQualityOption } from './PaperQualitySelector';
import { PrintSettingsPanel, PrintSettingsState } from './PrintSettingsPanel';
import { loadImage } from '../../lib/imageEngine';
import { getPdfInfo, loadPdf } from '../../lib/pdfEngine';
import { readEmbeddedDpi, runPreflight, type PreflightResult } from '../../lib/preflight';
import { estimateCost, type CostBreakdown } from '../../lib/costEstimator';
import { validateImageFile, validatePdfFile, errorMessage, openPrintWindow, addStyles, el } from '../../lib/security';
import { recommendedDpi } from '../../lib/printSpecs';

// Representative GSM for each substrate so the cost engine has a real weight.
const GSM_BY_QUALITY: Record<string, number> = {
  'plain-white': 90,
  'premium-white': 110,
  glossy: 200,
  matte: 250,
  'photo-paper': 230,
  'art-card': 320,
  'pvc-card': 700,
  'sticker-paper': 120,
  canvas: 400,
  vinyl: 150,
};

// Common parent press sheet (fits every preset trim size above).
const PARENT_SHEET = { widthMm: 700, heightMm: 1000 };

interface UploadedMeta {
  fileName: string;
  fileSizeMb: number;
  format: string;
  kind: 'image' | 'pdf';
  widthPx: number | null;
  heightPx: number | null;
  embeddedDpi: number | null;
  pdfPages?: number;
  pdfPageMm?: { widthMm: number; heightMm: number };
}

export const PrintOrderWizard: React.FC = () => {
  const { savePrintJob } = useAuth();

  const [step, setStep] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<UploadedMeta | null>(null);
  const [hasBleed, setHasBleed] = useState<boolean>(false);

  const [selectedSize, setSelectedSize] = useState<PaperSizeSpec>(paperSizePresets[1]); // A4
  const [selectedQuality, setSelectedQuality] = useState<PaperQualityOption>(paperQualityOptions[5]); // Art Card
  const [settings, setSettings] = useState<PrintSettingsState>({
    orientation: 'portrait',
    scaling: 'fit',
    marginMm: 10,
    duplex: 'single',
    qualityDpi: 300,
    copies: 500,
  });

  const stepsList = [
    { num: 1, label: 'Upload File' },
    { num: 2, label: 'Paper Size' },
    { num: 3, label: 'Paper Quality' },
    { num: 4, label: 'Print Settings' },
    { num: 5, label: 'Pre-flight Proof' },
    { num: 6, label: 'Cost Quote' },
    { num: 7, label: 'Job Ticket' },
  ];

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError(null);
    setMeta(null);
    try {
      const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
      if (isPdf) {
        const verr = validatePdfFile(file, 50);
        if (verr) throw new Error(verr);
        const loaded = await loadPdf(file);
        const info = getPdfInfo(loaded);
        const first = info.pageSizes[0];
        setMeta({
          fileName: file.name,
          fileSizeMb: file.size / 1024 / 1024,
          format: 'application/pdf',
          kind: 'pdf',
          widthPx: null,
          heightPx: null,
          embeddedDpi: null,
          pdfPages: info.pageCount,
          pdfPageMm: first ? { widthMm: first.widthMm, heightMm: first.heightMm } : undefined,
        });
      } else {
        const verr = validateImageFile(file, 25);
        if (verr) throw new Error(verr);
        const buffer = await file.arrayBuffer();
        const img = await loadImage(file);
        setMeta({
          fileName: file.name,
          fileSizeMb: file.size / 1024 / 1024,
          format: file.type || 'image',
          kind: 'image',
          widthPx: img.naturalWidth,
          heightPx: img.naturalHeight,
          embeddedDpi: readEmbeddedDpi(buffer, file.name),
        });
      }
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  // Real pre-flight from the uploaded file's actual metadata.
  const preflight: PreflightResult | null = (() => {
    if (!meta || meta.kind !== 'image' || meta.widthPx == null || meta.heightPx == null) return null;
    return runPreflight({
      fileName: meta.fileName,
      fileSizeMb: meta.fileSizeMb,
      format: meta.format,
      widthPx: meta.widthPx,
      heightPx: meta.heightPx,
      embeddedDpi: meta.embeddedDpi,
      hasAlpha: null,
      printWidthMm: selectedSize.widthMm,
      printHeightMm: selectedSize.heightMm,
      hasBleed,
      colorMode: 'RGB',
    });
  })();

  // Real deterministic cost from the cost engine.
  const cost: CostBreakdown | null = (() => {
    try {
      return estimateCost({
        itemName: selectedSize.name,
        quantity: settings.copies,
        pagesPerItem: settings.duplex === 'single' ? 1 : 2,
        itemWidthMm: selectedSize.widthMm,
        itemHeightMm: selectedSize.heightMm,
        sheetWidthMm: PARENT_SHEET.widthMm,
        sheetHeightMm: PARENT_SHEET.heightMm,
        paperGsm: GSM_BY_QUALITY[selectedQuality.id] ?? 150,
        paperType: selectedQuality.name,
        colorType: settings.duplex === 'single' ? '4/0 CMYK Single Sided' : '4/4 CMYK Double Sided',
        finishing: [],
        turnaroundDays: 3,
      });
    } catch {
      return null;
    }
  })();

  const handleFinishWizard = () => {
    savePrintJob({
      title: `Order: ${meta?.fileName ?? 'Untitled'} (${settings.copies}× ${selectedSize.name})`,
      toolType: 'OrderWizard',
      status: 'Ready',
      summary: `Job ticket — ${settings.copies} copies of ${selectedSize.name} on ${selectedQuality.name}${cost ? `, suggested retail $${cost.suggestedRetailPrice.toFixed(2)}` : ''}.`,
    });

    openPrintWindow('PrintPilot AI — Job Ticket', (doc) => {
      addStyles(doc, `
        @page { size: A4 portrait; margin: 15mm; }
        body { font-family: sans-serif; padding: 0; color: #0f172a; }
        .box { border: 2px solid #2563eb; padding: 20px; border-radius: 12px; }
        h1 { color: #2563eb; margin: 0 0 6px 0; font-size: 18px; }
        p { margin: 4px 0; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; margin-top: 14px; }
        td, th { border: 1px solid #cbd5e1; padding: 7px 10px; font-size: 11.5px; text-align: left; }
        th { background: #f1f5f9; }
      `);

      const box = el(doc, 'div', { className: 'box' });
      box.appendChild(el(doc, 'h1', { text: 'PrintPilot AI — Commercial Job Ticket' }));
      box.appendChild(el(doc, 'p', { text: `Job file: ${meta ? `${meta.fileName} (${meta.fileSizeMb.toFixed(2)} MB)` : 'None uploaded'}` }));

      const rows: [string, string][] = [
        ['Paper size', `${selectedSize.name} (${selectedSize.widthMm} × ${selectedSize.heightMm} mm)`],
        ['Paper stock', `${selectedQuality.name} (${selectedQuality.gsm})`],
        ['Orientation', settings.orientation.toUpperCase()],
        ['Duplex', settings.duplex.toUpperCase()],
        ['Press quality', `${settings.qualityDpi} DPI`],
        ['Quantity', `${settings.copies} copies`],
      ];
      if (preflight) {
        rows.push(['Pre-flight', `${preflight.overallStatus} — score ${preflight.preflightScore}/100, ${preflight.effectiveDpi} DPI effective`]);
      } else if (meta?.kind === 'pdf') {
        rows.push(['PDF info', `${meta.pdfPages} page(s)${meta.pdfPageMm ? `, page ${meta.pdfPageMm.widthMm.toFixed(0)} × ${meta.pdfPageMm.heightMm.toFixed(0)} mm` : ''}`]);
      }
      if (cost) {
        rows.push(['Sheet utilisation', `${cost.sheetOptimization.upsPerSheet}-up, ${cost.sheetOptimization.totalParentSheetsRequired} parent sheets`]);
        rows.push(['Suggested retail', `$${cost.suggestedRetailPrice.toFixed(2)} ($${cost.perUnitPrice.toFixed(3)} / unit)`]);
      }

      const table = el(doc, 'table');
      const headRow = el(doc, 'tr');
      headRow.appendChild(el(doc, 'th', { text: 'Parameter' }));
      headRow.appendChild(el(doc, 'th', { text: 'Value' }));
      table.appendChild(headRow);
      for (const [k, v] of rows) {
        const tr = el(doc, 'tr');
        tr.appendChild(el(doc, 'td', { text: k }));
        tr.appendChild(el(doc, 'td', { text: v }));
        table.appendChild(tr);
      }
      box.appendChild(table);
      doc.body.appendChild(box);
    });
  };

  const canAdvanceFromStep1 = meta !== null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-semibold px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Guided Pre-press Production Pipeline</span>
          </div>
          <h2 className="text-2xl font-bold text-white">7-Step Print Order Wizard</h2>
          <p className="text-xs text-gray-400">Upload a real file, choose stock and press settings, then run a deterministic pre-flight and cost quote before generating the job ticket.</p>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-200 flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Stepper */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 bg-white/[0.03] border border-white/10 rounded-2xl p-2.5 backdrop-blur-md">
        {stepsList.map((s) => {
          const isActive = step === s.num;
          const isDone = step > s.num;
          return (
            <button
              key={s.num}
              onClick={() => setStep(s.num)}
              className={`p-2.5 rounded-xl border text-left transition-all flex items-center space-x-2 ${
                isActive
                  ? 'bg-blue-600 border-blue-500 text-white font-bold shadow-md'
                  : isDone
                  ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                  : 'bg-white/[0.02] border-white/10 text-gray-400 hover:text-white'
              }`}
            >
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                isActive ? 'bg-white text-blue-600' : isDone ? 'bg-emerald-500 text-slate-950' : 'bg-white/10'
              }`}>
                {isDone ? <Check className="w-3.5 h-3.5" /> : s.num}
              </div>
              <span className="text-xs truncate">{s.label}</span>
            </button>
          );
        })}
      </div>

      {/* Step content */}
      <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-md min-h-[420px] flex flex-col justify-between">
        {step === 1 && (
          <div className="space-y-6 max-w-xl mx-auto text-center py-6 w-full">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 mx-auto">
              <Upload className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Step 1: Upload Your Print File</h3>
              <p className="text-xs text-gray-400 mt-1">Select a real PDF or image (JPEG/PNG/WEBP). Its actual metadata drives the pre-flight audit.</p>
            </div>

            <label className="block p-6 rounded-2xl border-2 border-dashed border-white/10 bg-slate-950/50 space-y-3 cursor-pointer hover:border-blue-500/50 transition-colors">
              <input type="file" accept="application/pdf,image/*" onChange={handleFile} className="hidden" />
              <FileText className="w-10 h-10 text-blue-400 mx-auto" />
              {meta ? (
                <div>
                  <p className="text-sm font-bold text-white truncate">{meta.fileName}</p>
                  <p className="text-xs text-blue-300 font-mono">
                    {meta.fileSizeMb.toFixed(2)} MB ·{' '}
                    {meta.kind === 'image'
                      ? `${meta.widthPx}×${meta.heightPx}px${meta.embeddedDpi ? ` · ${meta.embeddedDpi} DPI tag` : ''}`
                      : `${meta.pdfPages} page PDF`}
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-bold text-white">Click to choose a file</p>
                  <p className="text-xs text-gray-400">No file is uploaded to a server — everything is read locally.</p>
                </div>
              )}
            </label>

            <label className="inline-flex items-center space-x-2 text-xs text-gray-300">
              <input type="checkbox" checked={hasBleed} onChange={(e) => setHasBleed(e.target.checked)} className="rounded accent-blue-500" />
              <span>Artwork includes 3mm bleed</span>
            </label>
          </div>
        )}

        {step === 2 && <PaperSizeManager selectedSizeId={selectedSize.id} onSelectSize={(s) => setSelectedSize(s)} />}

        {step === 3 && <PaperQualitySelector selectedQualityId={selectedQuality.id} onSelectQuality={(q) => setSelectedQuality(q)} />}

        {step === 4 && <PrintSettingsPanel settings={settings} onChange={(s) => setSettings(s)} />}

        {step === 5 && (
          <div className="space-y-6 max-w-2xl mx-auto py-4 w-full">
            <div className="text-center space-y-1">
              <h3 className="text-xl font-bold text-white">Step 5: Pre-flight Proof &amp; Audit</h3>
              <p className="text-xs text-gray-400">Computed from the real uploaded file against {selectedSize.name} ({selectedSize.widthMm}×{selectedSize.heightMm}mm).</p>
            </div>

            {!meta ? (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 text-center">
                No file uploaded yet. Go back to Step 1 and select a real file to run the audit.
              </div>
            ) : preflight ? (
              <>
                <div className="flex items-center justify-center space-x-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    preflight.overallStatus === 'Pass'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : preflight.overallStatus === 'Warning'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                  }`}>
                    {preflight.overallStatus} · {preflight.preflightScore}/100
                  </span>
                  <span className="text-xs text-gray-400 font-mono">{preflight.effectiveDpi} DPI effective</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {preflight.checklistResults.map((item, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
                      <div className="flex items-center justify-between font-bold text-xs text-white">
                        <span>{item.checkItem}</span>
                        <span className={item.status === 'Pass' ? 'text-emerald-400' : item.status === 'Warning' ? 'text-amber-400' : 'text-rose-400'}>{item.status}</span>
                      </div>
                      <p className="text-[11px] text-gray-400 leading-tight">{item.detail}</p>
                    </div>
                  ))}
                </div>
                {preflight.autoFixActions.length > 0 && (
                  <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 space-y-1">
                    <p className="text-xs font-bold text-blue-300">Recommended fixes</p>
                    <ul className="list-disc list-inside space-y-1 text-[11px] text-gray-300">
                      {preflight.autoFixActions.map((a, i) => <li key={i}>{a}</li>)}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 text-xs text-gray-300 space-y-1">
                <p className="font-bold text-white">PDF detected — resolution audit not applicable.</p>
                <p>{meta.pdfPages} page(s){meta.pdfPageMm ? `, first page ${meta.pdfPageMm.widthMm.toFixed(1)} × ${meta.pdfPageMm.heightMm.toFixed(1)} mm` : ''}. Vector PDFs scale without loss; verify any placed raster images separately with the Pre-flight Checker tool.</p>
              </div>
            )}
          </div>
        )}

        {step === 6 && (
          <div className="space-y-6 max-w-xl mx-auto py-4 w-full">
            <div className="text-center space-y-1">
              <h3 className="text-xl font-bold text-white">Step 6: Cost Quote Breakdown</h3>
              <p className="text-xs text-gray-400">Deterministic quote from sheet nesting, GSM paper weight, colour sides and run volume.</p>
            </div>

            {cost ? (
              <div className="p-6 rounded-3xl bg-slate-950 border border-white/10 space-y-3">
                <div className="flex justify-between text-xs text-gray-300"><span>Stock:</span><span className="font-bold text-white">{selectedQuality.name} ({selectedQuality.gsm})</span></div>
                <div className="flex justify-between text-xs text-gray-300"><span>Trim size:</span><span className="font-bold text-white">{selectedSize.name}</span></div>
                <div className="flex justify-between text-xs text-gray-300"><span>Run volume:</span><span className="font-bold text-white">{settings.copies.toLocaleString()} copies</span></div>
                <div className="flex justify-between text-xs text-gray-300"><span>Sheet utilisation:</span><span className="font-mono text-blue-300">{cost.sheetOptimization.upsPerSheet}-up · {cost.sheetOptimization.totalParentSheetsRequired} sheets</span></div>
                <div className="flex justify-between text-xs text-gray-300"><span>Paper cost:</span><span className="font-mono text-gray-200">${cost.estimatedRawPaperCost.toFixed(2)}</span></div>
                <div className="flex justify-between text-xs text-gray-300"><span>Ink + press + labour:</span><span className="font-mono text-gray-200">${(cost.estimatedInkSolventCost + cost.labourAndMachineCost).toFixed(2)}</span></div>
                <div className="pt-3 border-t border-white/10 flex justify-between items-center">
                  <span className="text-sm font-bold text-white">Suggested retail:</span>
                  <span className="text-3xl font-extrabold text-emerald-400">${cost.suggestedRetailPrice.toFixed(2)} <span className="text-xs font-normal text-gray-400">(${cost.perUnitPrice.toFixed(3)}/unit)</span></span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-200 text-center">
                Unable to compute a quote for this configuration. Check that the trim size fits a standard parent sheet.
              </div>
            )}
          </div>
        )}

        {step === 7 && (
          <div className="space-y-6 max-w-lg mx-auto text-center py-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">Order Specification Complete</h3>
              <p className="text-xs text-gray-400 mt-1">Generate the job ticket with all selected specs, pre-flight result and quote.</p>
            </div>
            <button
              onClick={handleFinishWizard}
              className="px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-xl shadow-blue-600/30 transition-all flex items-center justify-center space-x-2 mx-auto active:scale-95"
            >
              <Printer className="w-5 h-5" />
              <span>Generate &amp; Print Job Ticket</span>
            </button>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-between pt-6 border-t border-white/10 mt-6">
          <button
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1}
            className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 border border-white/10 text-xs font-semibold text-gray-300 flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <span className="text-xs font-mono text-gray-400">Step {step} of 7</span>

          {step < 7 ? (
            <button
              onClick={() => setStep((s) => Math.min(7, s + 1))}
              disabled={step === 1 && !canAdvanceFromStep1}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center space-x-2"
            >
              <span>Next</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinishWizard}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center space-x-2"
            >
              <Printer className="w-4 h-4" />
              <span>Print Job Ticket</span>
            </button>
          )}
        </div>
      </div>

      <p className="text-[11px] text-gray-500 text-center">
        Pre-flight target for {selectedSize.name}: {recommendedDpi(selectedSize.widthMm, selectedSize.heightMm)} DPI · parent press sheet {PARENT_SHEET.widthMm}×{PARENT_SHEET.heightMm}mm
      </p>
    </div>
  );
};

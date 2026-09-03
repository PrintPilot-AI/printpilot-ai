import React, { useState } from 'react';
import { 
  Upload, 
  Ruler, 
  Layers, 
  Sliders, 
  CheckCircle2, 
  DollarSign, 
  Printer, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  FileText,
  Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PaperSizeManager, paperSizePresets, PaperSizeSpec } from './PaperSizeManager';
import { PaperQualitySelector, paperQualityOptions, PaperQualityOption } from './PaperQualitySelector';
import { PrintSettingsPanel, PrintSettingsState } from './PrintSettingsPanel';

export const PrintOrderWizard: React.FC = () => {
  const { savePrintJob, navigateToTool } = useAuth();

  const [step, setStep] = useState<number>(1);
  const [fileName, setFileName] = useState<string>('Commercial_Catalog_2026.pdf');
  const [fileSizeMb, setFileSizeMb] = useState<number>(14.2);
  const [selectedSize, setSelectedSize] = useState<PaperSizeSpec>(paperSizePresets[1]); // A4
  const [selectedQuality, setSelectedQuality] = useState<PaperQualityOption>(paperQualityOptions[2]); // Glossy Art
  const [settings, setSettings] = useState<PrintSettingsState>({
    orientation: 'portrait',
    scaling: 'fit',
    marginMm: 10,
    duplex: 'single',
    qualityDpi: 300,
    copies: 500,
  });

  const stepsList = [
    { num: 1, label: 'Upload File', icon: Upload },
    { num: 2, label: 'Paper Size', icon: Ruler },
    { num: 3, label: 'Paper Quality', icon: Layers },
    { num: 4, label: 'Print Settings', icon: Sliders },
    { num: 5, label: 'Pre-flight Proof', icon: CheckCircle2 },
    { num: 6, label: 'Cost Quote', icon: DollarSign },
    { num: 7, label: 'Generate PDF', icon: Printer },
  ];

  // Price Calculation Logic
  const unitBasePrice = selectedQuality.id === 'pvc-card' ? 0.75 : selectedQuality.id === 'canvas' ? 1.20 : 0.12;
  const sizeMultiplier = selectedSize.id === 'a3' ? 1.8 : selectedSize.id === 'a5' ? 0.7 : 1.0;
  const duplexMultiplier = settings.duplex !== 'single' ? 1.45 : 1.0;
  const totalCost = (unitBasePrice * sizeMultiplier * duplexMultiplier * settings.copies).toFixed(2);
  const costPerUnit = ((unitBasePrice * sizeMultiplier * duplexMultiplier)).toFixed(3);

  const handleFinishWizard = () => {
    savePrintJob({
      title: `Wizard Order: ${fileName} (${settings.copies}x ${selectedSize.name})`,
      toolType: 'Preflight',
      status: 'Ready',
      summary: `Completed 7-step wizard. Total Quote $${totalCost} for ${settings.copies} copies on ${selectedQuality.name}.`
    });

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>PrintPilot AI - Commercial Job Ticket</title>
          <style>
            body { font-family: sans-serif; padding: 20px; color: #0f172a; }
            .box { border: 2px solid #2563eb; padding: 20px; border-radius: 12px; }
            h1 { color: #2563eb; margin-top: 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            td, th { border: 1px solid #cbd5e1; padding: 8px 12px; font-size: 12px; text-align: left; }
            th { background: #f1f5f9; }
          </style>
        </head>
        <body>
          <div class="box">
            <h1>PrintPilot AI - Commercial Job Ticket & Pre-press Pass</h1>
            <p><strong>Job File:</strong> ${fileName} (${fileSizeMb} MB)</p>
            <table>
              <tr><th>Parameter</th><th>Selected Spec</th></tr>
              <tr><td>Paper Size</td><td>${selectedSize.name} (${selectedSize.widthMm} x ${selectedSize.heightMm} mm)</td></tr>
              <tr><td>Paper Stock Quality</td><td>${selectedQuality.name} (${selectedQuality.gsm})</td></tr>
              <tr><td>Page Orientation</td><td>${settings.orientation.toUpperCase()}</td></tr>
              <tr><td>Duplex Mode</td><td>${settings.duplex.toUpperCase()}</td></tr>
              <tr><td>Press Quality DPI</td><td>${settings.qualityDpi} DPI</td></tr>
              <tr><td>Total Quantity</td><td>${settings.copies} copies</td></tr>
              <tr><td>Estimated Total Cost</td><td><strong>$${totalCost} USD</strong> ($${costPerUnit} / unit)</td></tr>
            </table>
          </div>
          <script>window.onload = function() { window.print(); };</script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

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
          <p className="text-xs text-gray-400">Step-by-step guided workflow from file upload to paper stock, RIP settings, pre-flight proof, quote & PDF generation.</p>
        </div>
      </div>

      {/* Wizard Progress Stepper Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 bg-white/[0.03] border border-white/10 rounded-2xl p-2.5 backdrop-blur-md">
        {stepsList.map((s) => {
          const IconComp = s.icon;
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

      {/* Step Content Box */}
      <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-md min-h-[420px] flex flex-col justify-between">
        
        {step === 1 && (
          <div className="space-y-6 max-w-xl mx-auto text-center py-6">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 mx-auto">
              <Upload className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Step 1: Upload Your Print File</h3>
              <p className="text-xs text-gray-400 mt-1">Select your PDF, TIFF, EPS, or high-resolution image file for pre-press audit.</p>
            </div>

            <div className="p-6 rounded-2xl border-2 border-dashed border-white/10 bg-slate-950/50 space-y-3">
              <FileText className="w-10 h-10 text-blue-400 mx-auto" />
              <div>
                <p className="text-sm font-bold text-white">{fileName}</p>
                <p className="text-xs text-blue-300 font-mono">{fileSizeMb} MB • 300 DPI CMYK Vector PDF</p>
              </div>
              <button
                onClick={() => { setFileName('New_Product_Brochure_300DPI.pdf'); setFileSizeMb(22.4); }}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-gray-300 hover:text-white"
              >
                Change Sample File
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <PaperSizeManager
            selectedSizeId={selectedSize.id}
            onSelectSize={(s) => setSelectedSize(s)}
          />
        )}

        {step === 3 && (
          <PaperQualitySelector
            selectedQualityId={selectedQuality.id}
            onSelectQuality={(q) => setSelectedQuality(q)}
          />
        )}

        {step === 4 && (
          <PrintSettingsPanel
            settings={settings}
            onChange={(s) => setSettings(s)}
          />
        )}

        {step === 5 && (
          <div className="space-y-6 max-w-2xl mx-auto py-4">
            <div className="text-center space-y-1">
              <h3 className="text-xl font-bold text-white">Step 5: Pre-flight Proof & Audit</h3>
              <p className="text-xs text-gray-400">Automated pre-press inspection check passed for commercial press execution.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-1">
                <div className="flex items-center justify-between font-bold text-xs text-emerald-300">
                  <span>300 DPI Resolution</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-[11px] text-gray-400">All raster assets meet 300 DPI print threshold.</p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-1">
                <div className="flex items-center justify-between font-bold text-xs text-emerald-300">
                  <span>CMYK Color Space</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-[11px] text-gray-400">Zero RGB color warnings detected.</p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-1">
                <div className="flex items-center justify-between font-bold text-xs text-emerald-300">
                  <span>3mm Bleed Guidelines</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-[11px] text-gray-400">Trim bleed area verified for guillotine cutting.</p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-1">
                <div className="flex items-center justify-between font-bold text-xs text-emerald-300">
                  <span>Fonts Outlined & Embedded</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-[11px] text-gray-400">Zero missing font glyph errors.</p>
              </div>
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-6 max-w-xl mx-auto py-4">
            <div className="text-center space-y-1">
              <h3 className="text-xl font-bold text-white">Step 6: Instant Cost Quote Breakdown</h3>
              <p className="text-xs text-gray-400">Calculated based on paper stock GSM, unit run quantity, and press duplexing.</p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-950 border border-white/10 space-y-4">
              <div className="flex justify-between text-xs text-gray-300">
                <span>Selected Stock:</span>
                <span className="font-bold text-white">{selectedQuality.name} ({selectedQuality.gsm})</span>
              </div>
              <div className="flex justify-between text-xs text-gray-300">
                <span>Media Trim Size:</span>
                <span className="font-bold text-white">{selectedSize.name}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-300">
                <span>Run Volume:</span>
                <span className="font-bold text-white">{settings.copies.toLocaleString()} copies</span>
              </div>
              <div className="flex justify-between text-xs text-gray-300">
                <span>Unit Cost:</span>
                <span className="font-mono text-blue-300">${costPerUnit} / unit</span>
              </div>
              <div className="pt-3 border-t border-white/10 flex justify-between items-center">
                <span className="text-sm font-bold text-white">Total Estimated Quote:</span>
                <span className="text-3xl font-extrabold text-emerald-400">${totalCost} <span className="text-xs font-normal text-gray-400">USD</span></span>
              </div>
            </div>
          </div>
        )}

        {step === 7 && (
          <div className="space-y-6 max-w-lg mx-auto text-center py-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">Order Specification Complete!</h3>
              <p className="text-xs text-gray-400 mt-1">Ready to generate 300 DPI job ticket and send to press operator queue.</p>
            </div>

            <button
              onClick={handleFinishWizard}
              className="px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-xl shadow-blue-600/30 transition-all flex items-center justify-center space-x-2 mx-auto active:scale-95"
            >
              <Printer className="w-5 h-5" />
              <span>Generate Job Ticket & Download PDF</span>
            </button>
          </div>
        )}

        {/* Wizard Controls Footer */}
        <div className="flex items-center justify-between pt-6 border-t border-white/10 mt-6">
          <button
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1}
            className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 border border-white/10 text-xs font-semibold text-gray-300 flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous Step</span>
          </button>

          <span className="text-xs font-mono text-gray-400">Step {step} of 7</span>

          {step < 7 ? (
            <button
              onClick={() => setStep((s) => Math.min(7, s + 1))}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center space-x-2"
            >
              <span>Next Step</span>
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
    </div>
  );
};

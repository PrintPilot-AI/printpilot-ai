import React, { useState } from 'react';
import { 
  Printer, 
  Sliders, 
  Copy, 
  Layout, 
  Maximize, 
  Layers, 
  Gauge, 
  FileText,
  Check
} from 'lucide-react';

export interface PrintSettingsState {
  orientation: 'portrait' | 'landscape';
  scaling: 'fit' | 'borderless' | 'actual';
  marginMm: number;
  duplex: 'single' | 'double-long' | 'double-short';
  qualityDpi: number; // 150, 300, 600, 1200
  copies: number;
}

interface PrintSettingsPanelProps {
  settings?: PrintSettingsState;
  onChange?: (updated: PrintSettingsState) => void;
}

export const PrintSettingsPanel: React.FC<PrintSettingsPanelProps> = ({
  settings,
  onChange,
}) => {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(settings?.orientation || 'portrait');
  const [scaling, setScaling] = useState<'fit' | 'borderless' | 'actual'>(settings?.scaling || 'fit');
  const [marginMm, setMarginMm] = useState<number>(settings?.marginMm || 10);
  const [duplex, setDuplex] = useState<'single' | 'double-long' | 'double-short'>(settings?.duplex || 'single');
  const [qualityDpi, setQualityDpi] = useState<number>(settings?.qualityDpi || 300);
  const [copies, setCopies] = useState<number>(settings?.copies || 100);

  const update = (partial: Partial<PrintSettingsState>) => {
    const newState: PrintSettingsState = {
      orientation: partial.orientation ?? orientation,
      scaling: partial.scaling ?? scaling,
      marginMm: partial.marginMm ?? marginMm,
      duplex: partial.duplex ?? duplex,
      qualityDpi: partial.qualityDpi ?? qualityDpi,
      copies: partial.copies ?? copies,
    };
    if (onChange) onChange(newState);
  };

  const qualityLabels: Record<number, { title: string; desc: string }> = {
    150: { title: 'Draft (150 DPI)', desc: 'Fast proofing, low ink density' },
    300: { title: 'Standard Press (300 DPI)', desc: 'Commercial offset & digital standard' },
    600: { title: 'High Resolution (600 DPI)', desc: 'Fine line vector & micro-text sharp' },
    1200: { title: 'Ultra HD RIP (1200 DPI)', desc: 'Master gallery & photogravure quality' },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-semibold px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 mb-1">
            <Sliders className="w-3.5 h-3.5 text-blue-400" />
            <span>Rip & Press Parameter Engine</span>
          </div>
          <h2 className="text-2xl font-bold text-white">Press Print Settings</h2>
          <p className="text-xs text-gray-400">Configure page orientation, scaling, margins, duplexing, press DPI quality, and run quantity.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Side: Layout & Page Specs */}
        <div className="space-y-5 bg-white/[0.03] border border-white/10 rounded-3xl p-5 backdrop-blur-md">
          
          {/* Orientation */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider">Page Orientation</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { setOrientation('portrait'); update({ orientation: 'portrait' }); }}
                className={`p-3 rounded-xl border text-center text-xs font-bold transition-all ${
                  orientation === 'portrait' ? 'bg-blue-600 border-blue-500 text-white shadow' : 'bg-white/[0.02] border-white/10 text-gray-400'
                }`}
              >
                Portrait (Vertical)
              </button>
              <button
                onClick={() => { setOrientation('landscape'); update({ orientation: 'landscape' }); }}
                className={`p-3 rounded-xl border text-center text-xs font-bold transition-all ${
                  orientation === 'landscape' ? 'bg-blue-600 border-blue-500 text-white shadow' : 'bg-white/[0.02] border-white/10 text-gray-400'
                }`}
              >
                Landscape (Horizontal)
              </button>
            </div>
          </div>

          {/* Scaling Mode */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider">Page Scaling & Fit</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => { setScaling('fit'); setMarginMm(10); update({ scaling: 'fit', marginMm: 10 }); }}
                className={`p-2.5 rounded-xl border text-center text-xs font-medium transition-all ${
                  scaling === 'fit' ? 'bg-blue-600/30 border-blue-500 text-white font-bold' : 'bg-white/[0.02] border-white/10 text-gray-400'
                }`}
              >
                Fit Printable
              </button>
              <button
                onClick={() => { setScaling('borderless'); setMarginMm(0); update({ scaling: 'borderless', marginMm: 0 }); }}
                className={`p-2.5 rounded-xl border text-center text-xs font-medium transition-all ${
                  scaling === 'borderless' ? 'bg-blue-600/30 border-blue-500 text-white font-bold' : 'bg-white/[0.02] border-white/10 text-gray-400'
                }`}
              >
                Borderless (0mm)
              </button>
              <button
                onClick={() => { setScaling('actual'); setMarginMm(5); update({ scaling: 'actual', marginMm: 5 }); }}
                className={`p-2.5 rounded-xl border text-center text-xs font-medium transition-all ${
                  scaling === 'actual' ? 'bg-blue-600/30 border-blue-500 text-white font-bold' : 'bg-white/[0.02] border-white/10 text-gray-400'
                }`}
              >
                Actual (100%)
              </button>
            </div>
          </div>

          {/* Margins Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-gray-300 uppercase tracking-wider">
              <span>Page Margin Width</span>
              <span className="text-blue-300 font-mono">{marginMm} mm</span>
            </div>
            <input
              type="range"
              min="0"
              max="30"
              value={marginMm}
              onChange={(e) => { const v = Number(e.target.value); setMarginMm(v); update({ marginMm: v }); }}
              className="w-full accent-blue-500"
            />
          </div>

          {/* Duplex Printing */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider">Duplex Mode (Sides)</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => { setDuplex('single'); update({ duplex: 'single' }); }}
                className={`p-2.5 rounded-xl border text-center text-xs font-medium transition-all ${
                  duplex === 'single' ? 'bg-blue-600/30 border-blue-500 text-white font-bold' : 'bg-white/[0.02] border-white/10 text-gray-400'
                }`}
              >
                Single Sided
              </button>
              <button
                onClick={() => { setDuplex('double-long'); update({ duplex: 'double-long' }); }}
                className={`p-2.5 rounded-xl border text-center text-xs font-medium transition-all ${
                  duplex === 'double-long' ? 'bg-blue-600/30 border-blue-500 text-white font-bold' : 'bg-white/[0.02] border-white/10 text-gray-400'
                }`}
              >
                Double (Long Edge)
              </button>
              <button
                onClick={() => { setDuplex('double-short'); update({ duplex: 'double-short' }); }}
                className={`p-2.5 rounded-xl border text-center text-xs font-medium transition-all ${
                  duplex === 'double-short' ? 'bg-blue-600/30 border-blue-500 text-white font-bold' : 'bg-white/[0.02] border-white/10 text-gray-400'
                }`}
              >
                Double (Short Edge)
              </button>
            </div>
          </div>

        </div>

        {/* Right Side: Quality, Copies & Press Calculation */}
        <div className="space-y-5 bg-white/[0.03] border border-white/10 rounded-3xl p-5 backdrop-blur-md">
          
          {/* Print Quality DPI */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider">Press Resolution (DPI Quality)</label>
            <div className="grid grid-cols-2 gap-2">
              {[150, 300, 600, 1200].map((dpi) => {
                const isSel = qualityDpi === dpi;
                return (
                  <button
                    key={dpi}
                    onClick={() => { setQualityDpi(dpi); update({ qualityDpi: dpi }); }}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSel ? 'bg-blue-600/30 border-blue-500 text-white font-bold' : 'bg-white/[0.02] border-white/10 text-gray-400'
                    }`}
                  >
                    <span className="block text-xs font-bold">{qualityLabels[dpi].title}</span>
                    <span className="block text-[10px] text-gray-400 mt-0.5">{qualityLabels[dpi].desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Number of Copies Stepper */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider">Number of Copies / Run Quantity</label>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => { const v = Math.max(1, copies - 50); setCopies(v); update({ copies: v }); }}
                className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10"
              >
                -50
              </button>
              <input
                type="number"
                min="1"
                value={copies}
                onChange={(e) => { const v = Number(e.target.value); setCopies(v); update({ copies: v }); }}
                className="w-full text-center py-2.5 rounded-xl bg-slate-950 border border-white/10 text-sm font-bold text-white focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={() => { const v = copies + 50; setCopies(v); update({ copies: v }); }}
                className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10"
              >
                +50
              </button>
            </div>
          </div>

          {/* Summary Box */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 text-xs text-gray-300 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Run Volume:</span>
              <span className="font-bold text-white">{copies.toLocaleString()} copies</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Print Sides:</span>
              <span className="font-mono text-blue-300">{duplex === 'single' ? 'Single Sided' : 'Duplex Double-Sided'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Press RIP Quality:</span>
              <span className="font-mono text-emerald-400 font-bold">{qualityDpi} DPI</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { 
  FileText, 
  Ruler, 
  Sliders, 
  Maximize2, 
  RotateCw, 
  Sparkles,
  Check,
  Info
} from 'lucide-react';

export interface PaperSizeSpec {
  id: string;
  name: string;
  widthMm: number;
  heightMm: number;
  widthIn: number;
  heightIn: number;
  category: 'ISO Standard' | 'US Standard' | 'Specialty';
  description: string;
}

export const paperSizePresets: PaperSizeSpec[] = [
  { id: 'a3', name: 'A3', widthMm: 297, heightMm: 420, widthIn: 11.69, heightIn: 16.54, category: 'ISO Standard', description: 'Large posters, architectural drawings, ledger prints' },
  { id: 'a4', name: 'A4', widthMm: 210, heightMm: 297, widthIn: 8.27, heightIn: 11.69, category: 'ISO Standard', description: 'Global commercial standard for letters, reports, brochures' },
  { id: 'a5', name: 'A5', widthMm: 148, heightMm: 210, widthIn: 5.83, heightIn: 8.27, category: 'ISO Standard', description: 'Notepads, flyers, pocket booklets, invites' },
  { id: 'a6', name: 'A6', widthMm: 105, heightMm: 148, widthIn: 4.13, heightIn: 5.83, category: 'ISO Standard', description: 'Postcards, table tents, pocket cards' },
  { id: 'letter', name: 'US Letter', widthMm: 215.9, heightMm: 279.4, widthIn: 8.5, heightIn: 11.0, category: 'US Standard', description: 'Standard North American office & business documents' },
  { id: 'legal', name: 'US Legal', widthMm: 215.9, heightMm: 355.6, widthIn: 8.5, heightIn: 14.0, category: 'US Standard', description: 'Contracts, legal briefs, extended accounting statements' },
  { id: 'executive', name: 'Executive', widthMm: 184.15, heightMm: 266.7, widthIn: 7.25, heightIn: 10.5, category: 'US Standard', description: 'Corporate stationery, executive memo sheets' },
  { id: 'photo-4x6', name: 'Photo Paper (4" x 6")', widthMm: 101.6, heightMm: 152.4, widthIn: 4.0, heightIn: 6.0, category: 'Specialty', description: 'Standard photographic portrait prints' },
  { id: 'photo-5x7', name: 'Photo Paper (5" x 7")', widthMm: 127.0, heightMm: 177.8, widthIn: 5.0, heightIn: 7.0, category: 'Specialty', description: 'Enlarged photo prints & greeting cards' },
];

interface PaperSizeManagerProps {
  selectedSizeId?: string;
  onSelectSize?: (size: PaperSizeSpec) => void;
}

export const PaperSizeManager: React.FC<PaperSizeManagerProps> = ({
  selectedSizeId = 'a4',
  onSelectSize,
}) => {
  const [activeSizeId, setActiveSizeId] = useState<string>(selectedSizeId);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [unit, setUnit] = useState<'mm' | 'in'>('mm');
  const [customWidth, setCustomWidth] = useState<number>(210);
  const [customHeight, setCustomHeight] = useState<number>(297);
  const [isCustom, setIsCustom] = useState<boolean>(false);

  const currentPreset = paperSizePresets.find((p) => p.id === activeSizeId) || paperSizePresets[1];

  const effectiveWidthMm = isCustom ? customWidth : currentPreset.widthMm;
  const effectiveHeightMm = isCustom ? customHeight : currentPreset.heightMm;

  const displayWidth = orientation === 'portrait' ? effectiveWidthMm : effectiveHeightMm;
  const displayHeight = orientation === 'portrait' ? effectiveHeightMm : effectiveWidthMm;

  const widthIn = (displayWidth / 25.4).toFixed(2);
  const heightIn = (displayHeight / 25.4).toFixed(2);

  const pixels300DpiW = Math.round((displayWidth / 25.4) * 300);
  const pixels300DpiH = Math.round((displayHeight / 25.4) * 300);

  const handlePresetSelect = (preset: PaperSizeSpec) => {
    setIsCustom(false);
    setActiveSizeId(preset.id);
    if (onSelectSize) {
      onSelectSize(preset);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-semibold px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 mb-1">
            <Ruler className="w-3.5 h-3.5 text-blue-400" />
            <span>Commercial Dimension Manager</span>
          </div>
          <h2 className="text-2xl font-bold text-white">Paper Size Manager</h2>
          <p className="text-xs text-gray-400">Configure media dimensions, custom trim sizes, orientation, and 300 DPI press pixel bounds.</p>
        </div>

        <div className="flex items-center space-x-2 bg-white/[0.03] border border-white/10 rounded-xl p-1 backdrop-blur-sm">
          <button
            onClick={() => setOrientation('portrait')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              orientation === 'portrait' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            Portrait
          </button>
          <button
            onClick={() => setOrientation('landscape')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              orientation === 'landscape' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            Landscape
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Presets List */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">Standard Paper Presets</span>
            <span className="text-[10px] text-gray-400 font-mono">ISO 216 & ANSI Specs</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {paperSizePresets.map((preset) => {
              const isSelected = !isCustom && activeSizeId === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => handlePresetSelect(preset)}
                  className={`p-3.5 rounded-2xl border text-left transition-all backdrop-blur-sm flex items-start justify-between ${
                    isSelected
                      ? 'bg-blue-600/20 border-blue-500 text-white ring-1 ring-blue-500/50'
                      : 'bg-white/[0.03] border-white/10 text-gray-300 hover:bg-white/[0.06]'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-white">{preset.name}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-gray-400">{preset.category}</span>
                    </div>
                    <p className="text-xs text-blue-300 font-mono">
                      {preset.widthMm} × {preset.heightMm} mm ({preset.widthIn}" × {preset.heightIn}")
                    </p>
                    <p className="text-[10px] text-gray-400 line-clamp-1">{preset.description}</p>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-blue-400 shrink-0 mt-1" />}
                </button>
              );
            })}
          </div>

          {/* Custom Size Option */}
          <div className={`p-4 rounded-2xl border transition-all ${
            isCustom ? 'bg-blue-600/20 border-blue-500' : 'bg-white/[0.03] border-white/10'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold text-white flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  checked={isCustom} 
                  onChange={(e) => setIsCustom(e.target.checked)} 
                  className="rounded accent-blue-500" 
                />
                <span>Custom Trim Dimensions</span>
              </label>
              <div className="flex space-x-1 text-[10px]">
                <button 
                  onClick={() => setUnit('mm')} 
                  className={`px-2 py-0.5 rounded ${unit === 'mm' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}
                >
                  mm
                </button>
                <button 
                  onClick={() => setUnit('in')} 
                  className={`px-2 py-0.5 rounded ${unit === 'in' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}
                >
                  inches
                </button>
              </div>
            </div>

            {isCustom && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">Custom Width ({unit})</label>
                  <input
                    type="number"
                    value={customWidth}
                    onChange={(e) => setCustomWidth(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">Custom Height ({unit})</label>
                  <input
                    type="number"
                    value={customHeight}
                    onChange={(e) => setCustomHeight(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Real-time Visualizer Panel */}
        <div className="lg:col-span-5 bg-slate-950/80 border border-white/10 rounded-3xl p-6 backdrop-blur-md flex flex-col justify-between space-y-6">
          
          <div className="space-y-1">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Live Media Canvas Bounds</span>
            <h3 className="text-xl font-bold text-white">
              {isCustom ? 'Custom Trim Format' : currentPreset.name} ({orientation.toUpperCase()})
            </h3>
          </div>

          {/* Canvas Box */}
          <div className="py-8 flex items-center justify-center">
            <div 
              className="border-2 border-blue-500/80 bg-blue-500/10 rounded-xl shadow-2xl flex flex-col items-center justify-center relative p-4 transition-all duration-300"
              style={{
                width: orientation === 'portrait' ? '180px' : '250px',
                height: orientation === 'portrait' ? '250px' : '180px',
              }}
            >
              <div className="absolute inset-2 border border-dashed border-blue-400/40 rounded-lg pointer-events-none"></div>
              <FileText className="w-10 h-10 text-blue-400 mb-2" />
              <span className="text-xs font-bold text-white font-mono">{displayWidth} × {displayHeight} mm</span>
              <span className="text-[10px] text-blue-300 font-mono mt-0.5">{widthIn}" × {heightIn}"</span>
            </div>
          </div>

          {/* Specs Details List */}
          <div className="space-y-2 p-4 rounded-2xl bg-white/[0.02] border border-white/10 text-xs text-gray-300">
            <div className="flex justify-between">
              <span className="text-gray-500">Dimensions (Metric):</span>
              <span className="font-mono text-white">{displayWidth} mm × {displayHeight} mm</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Dimensions (Imperial):</span>
              <span className="font-mono text-white">{widthIn} in × {heightIn} in</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">300 DPI RIP Resolution:</span>
              <span className="font-mono text-blue-300 font-bold">{pixels300DpiW} × {pixels300DpiH} px</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Standard Bleed (3mm):</span>
              <span className="font-mono text-emerald-400">{(displayWidth + 6).toFixed(1)} × {(displayHeight + 6).toFixed(1)} mm</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

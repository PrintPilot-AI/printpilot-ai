import React, { useState } from 'react';
import { Layers, Check, Sparkles, Shield, Info, Gauge } from 'lucide-react';

export interface PaperQualityOption {
  id: string;
  name: string;
  gsm: string;
  finish: string;
  description: string;
  applications: string;
  tactile: string;
  pressType: string;
}

export const paperQualityOptions: PaperQualityOption[] = [
  {
    id: 'plain-white',
    name: 'Plain White',
    gsm: '80 - 100 GSM',
    finish: 'Uncoated Matte',
    description: 'Everyday standard uncoated paper stock for high-volume office documents, invoices, and drafts.',
    applications: 'Invoices, legal notices, internal office reports, memos',
    tactile: 'Lightweight, smooth uncoated texture',
    pressType: 'Laser, Inkjet, Offset High-Speed'
  },
  {
    id: 'premium-white',
    name: 'Premium White',
    gsm: '100 - 120 GSM',
    finish: 'Smooth Super-Calendered',
    description: 'High-opacity crisp white paper with superior brightness for formal executive communications.',
    applications: 'Letterheads, formal proposals, multi-page corporate reports',
    tactile: 'Silky smooth, high opacity feel',
    pressType: 'Digital Offset, Production Laser'
  },
  {
    id: 'glossy',
    name: 'Glossy Art Paper',
    gsm: '170 - 300 GSM',
    finish: 'High Reflective Gloss',
    description: 'Coated paper with ultra-high color saturation and photo-like reflective brilliance.',
    applications: 'Product brochures, marketing flyers, posters, magazine covers',
    tactile: 'Slick, highly reflective smooth surface',
    pressType: 'Digital Press, UV Ink Offset'
  },
  {
    id: 'matte',
    name: 'Matte Art Paper',
    gsm: '170 - 350 GSM',
    finish: 'Non-Reflective Satin Matte',
    description: 'Subtle velvet-coated paper preventing glare under bright lights, offering a sophisticated feel.',
    applications: 'Luxury catalogues, art books, premium restaurant menus, presentation cards',
    tactile: 'Velvety smooth, glare-free finish',
    pressType: 'HP Indigo, Commercial Offset'
  },
  {
    id: 'photo-paper',
    name: 'Photographic Paper',
    gsm: '200 - 260 GSM',
    finish: 'RC Pearl / Luster / Gloss',
    description: 'Resin-coated true photographic media engineered for wide color gamut photo reproduction.',
    applications: 'High-end portraits, photo albums, gallery prints, wedding keepsakes',
    tactile: 'Substantial photo weight, crisp water-resistant backing',
    pressType: 'Pigment Inkjet, Dye Sublimation'
  },
  {
    id: 'art-card',
    name: 'Art Card / Cover Stock',
    gsm: '300 - 350 GSM',
    finish: 'Heavyweight Coated / Uncoated',
    description: 'Thick, rigid cardstock providing structural integrity for premium cards and covers.',
    applications: 'Business cards, greeting cards, book covers, invitation cards',
    tactile: 'Stiff, heavy rigid board feel',
    pressType: 'Digital Production Press, Foil Stamping'
  },
  {
    id: 'pvc-card',
    name: 'PVC Card',
    gsm: '760 Micron (30 Mil)',
    finish: 'Waterproof Plastic Board',
    description: 'Ultra-durable, waterproof synthetic plastic card stock designed for long-lasting credentials.',
    applications: 'Employee ID badges, membership cards, loyalty cards, access keys',
    tactile: 'Hard waterproof plastic, rounded edge finish',
    pressType: 'Thermal Transfer, Re-transfer Dye Sub'
  },
  {
    id: 'sticker-paper',
    name: 'Self-Adhesive Sticker Paper',
    gsm: '80 - 150 GSM',
    finish: 'Glossy / Matte Peelable Backing',
    description: 'Self-adhesive label stock with permanent or removable pressure-sensitive acrylic glue.',
    applications: 'Product packaging labels, barcode stickers, shipping labels, branding seals',
    tactile: 'Adhesive backing with liner sheet',
    pressType: 'Die-cut Label Press, Digital Toner'
  },
  {
    id: 'canvas',
    name: 'Fine Art Cotton Canvas',
    gsm: '380 - 420 GSM',
    finish: 'Textured Natural Woven',
    description: 'Archival 100% cotton woven canvas media delivering museum-grade texture for fine art.',
    applications: 'Canvas gallery wraps, art reproductions, luxury wall banners',
    tactile: 'Heavy woven fabric texture',
    pressType: 'Eco-Solvent, Pigment Wide-Format'
  },
  {
    id: 'vinyl',
    name: 'Outdoor Heavy Vinyl',
    gsm: '80 - 100 Micron',
    finish: 'Weatherproof Gloss / Matte Film',
    description: 'Flexible, tear-resistant polymeric vinyl film formulated for outdoor weather resistance.',
    applications: 'Outdoor flex banners, vehicle decals, window wraps, signage',
    tactile: 'Flexible rubberized synthetic film',
    pressType: 'UV Curable, Latex, Eco-Solvent'
  }
];

interface PaperQualitySelectorProps {
  selectedQualityId?: string;
  onSelectQuality?: (option: PaperQualityOption) => void;
}

export const PaperQualitySelector: React.FC<PaperQualitySelectorProps> = ({
  selectedQualityId = 'art-card',
  onSelectQuality,
}) => {
  const [activeId, setActiveId] = useState<string>(selectedQualityId);

  const activeOption = paperQualityOptions.find((q) => q.id === activeId) || paperQualityOptions[5];

  const handleSelect = (option: PaperQualityOption) => {
    setActiveId(option.id);
    if (onSelectQuality) {
      onSelectQuality(option);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-semibold px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 mb-1">
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span>Commercial Substrate Library</span>
          </div>
          <h2 className="text-2xl font-bold text-white">Paper Quality & Media Stock</h2>
          <p className="text-xs text-gray-400">Choose substrate GSM weight, coating finish, tactile texture, and press ink compatibility.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Media Grid */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
          {paperQualityOptions.map((opt) => {
            const isSelected = activeId === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => handleSelect(opt)}
                className={`p-4 rounded-2xl border text-left transition-all backdrop-blur-sm flex flex-col justify-between space-y-2 ${
                  isSelected
                    ? 'bg-blue-600/20 border-blue-500 text-white ring-1 ring-blue-500/50 shadow-lg'
                    : 'bg-white/[0.03] border-white/10 text-gray-300 hover:bg-white/[0.06]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-white">{opt.name}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {opt.gsm}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 font-mono">{opt.finish}</p>
                </div>
                <p className="text-[11px] text-gray-400 line-clamp-2 leading-tight">{opt.description}</p>
              </button>
            );
          })}
        </div>

        {/* Selected Media Detail Panel */}
        <div className="lg:col-span-5 bg-slate-950/80 border border-white/10 rounded-3xl p-6 backdrop-blur-md space-y-5">
          
          <div className="space-y-1 pb-4 border-b border-white/10">
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block font-mono">Selected Substrate Spec</span>
            <h3 className="text-xl font-bold text-white">{activeOption.name}</h3>
            <div className="flex items-center space-x-2 pt-1">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-600 text-white font-mono">{activeOption.gsm}</span>
              <span className="text-xs text-gray-400 font-mono">{activeOption.finish}</span>
            </div>
          </div>

          <div className="space-y-3 text-xs text-gray-300">
            <div>
              <span className="text-gray-500 block font-semibold mb-0.5">Overview & Characteristics</span>
              <p className="leading-relaxed bg-white/[0.02] p-3 rounded-xl border border-white/5">{activeOption.description}</p>
            </div>

            <div>
              <span className="text-gray-500 block font-semibold mb-0.5">Recommended Applications</span>
              <p className="text-blue-300 font-medium">{activeOption.applications}</p>
            </div>

            <div>
              <span className="text-gray-500 block font-semibold mb-0.5">Tactile & Surface Feel</span>
              <p className="text-gray-300">{activeOption.tactile}</p>
            </div>

            <div>
              <span className="text-gray-500 block font-semibold mb-0.5">Press & Ink Compatibility</span>
              <p className="text-emerald-400 font-mono">{activeOption.pressType}</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

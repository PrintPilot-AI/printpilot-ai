import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Building, Mail, Layers, FileText, CheckCircle2, Save, Printer, ShieldCheck } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { shopProfile, updateShopProfile } = useAuth();

  const [shopName, setShopName] = useState(shopProfile.shopName);
  const [ownerName, setOwnerName] = useState(shopProfile.ownerName);
  const [email, setEmail] = useState(shopProfile.email);
  const [primaryPrintTech, setPrimaryPrintTech] = useState(shopProfile.primaryPrintTech);
  const [defaultPaperStock, setDefaultPaperStock] = useState(shopProfile.defaultPaperStock);
  const [gstNumber, setGstNumber] = useState(shopProfile.gstNumber || 'GSTIN27AABCU9603R1ZM');
  const [defaultBleed, setDefaultBleed] = useState(shopProfile.defaultBleed);

  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateShopProfile({
      shopName,
      ownerName,
      email,
      primaryPrintTech,
      defaultPaperStock,
      gstNumber,
      defaultBleed
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-8">
      
      <div className="flex items-center justify-between border-b border-slate-800 pb-6">
        <div>
          <span className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">Shop Profile Configuration</span>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mt-1">
            Print Shop Settings
          </h1>
          <p className="text-sm text-slate-400">
            Configure default paper stocks, print technology defaults, tax IDs, and pre-press preferences.
          </p>
        </div>

        {saved && (
          <div className="px-4 py-2 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs font-semibold flex items-center space-x-2 animate-in fade-in duration-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Profile Saved!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 space-y-6">
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-300">Print Shop Business Name</label>
            <div className="relative">
              <Building className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-300">Shop Operator / Manager</label>
            <input
              type="text"
              required
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-300">Operator Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-300">GST / Tax Identification ID</label>
            <input
              type="text"
              value={gstNumber}
              onChange={(e) => setGstNumber(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-300">Primary Printing Technology</label>
            <div className="relative">
              <Layers className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <select
                value={primaryPrintTech}
                onChange={(e) => setPrimaryPrintTech(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="Commercial Digital & Offset">Commercial Digital & Offset</option>
                <option value="Wide Format Flex & Billboard Vinyl">Wide Format Flex & Billboard Vinyl</option>
                <option value="Screen Printing & Apparel">Screen Printing & Apparel</option>
                <option value="Packaging & Die-Cut Boxes">Packaging & Die-Cut Boxes</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-300">Default Paper Stock Preference</label>
            <input
              type="text"
              value={defaultPaperStock}
              onChange={(e) => setDefaultPaperStock(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-300">Default Bleed Margin Allowance</label>
          <select
            value={defaultBleed}
            onChange={(e) => setDefaultBleed(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="3mm (Standard Commercial)">3mm (0.125 in - Standard Commercial Offset)</option>
            <option value="5mm (Wide Format Flex)">5mm (0.2 in - Wide Format Flex & Canvas)</option>
            <option value="1.5mm (Compact Stationery)">1.5mm (0.06 in - Compact Stationery)</option>
          </select>
        </div>

        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Save Shop Configuration</span>
          </button>
        </div>

      </form>
    </div>
  );
};

import React, { useState, useRef } from 'react';
import { 
  CreditCard, 
  QrCode, 
  Barcode, 
  Upload, 
  Printer, 
  Sparkles, 
  Check, 
  User, 
  Building, 
  ShieldCheck, 
  School, 
  Briefcase 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export interface IdCardData {
  cardType: 'employee' | 'student' | 'school' | 'college' | 'visitor';
  holderName: string;
  titleOrClass: string;
  idNumber: string;
  department: string;
  issueDate: string;
  expiryDate: string;
  bloodGroup: string;
  emergencyContact: string;
  organizationName: string;
  organizationLogo?: string;
  photoUrl?: string;
  themeColor: 'navy' | 'emerald' | 'crimson' | 'dark' | 'gold';
}

export const IdCardDesigner: React.FC = () => {
  const { savePrintJob } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [cardData, setCardData] = useState<IdCardData>({
    cardType: 'employee',
    holderName: 'Ayesha Mahmood',
    titleOrClass: 'Senior Pre-press Specialist',
    idNumber: 'EMP-2026-8891',
    department: 'Digital Printing & RIP Tech',
    issueDate: '2026-01-15',
    expiryDate: '2028-01-15',
    bloodGroup: 'B+',
    emergencyContact: '+92 321 9876543',
    organizationName: 'Apex Printing Systems',
    themeColor: 'navy',
  });

  const [cardSide, setCardSide] = useState<'front' | 'back'>('front');

  const themes = {
    navy: { bg: 'bg-slate-900', text: 'text-white', header: 'bg-blue-600', accent: 'text-blue-400', border: 'border-blue-500', hex: '#2563eb' },
    emerald: { bg: 'bg-emerald-950', text: 'text-white', header: 'bg-emerald-600', accent: 'text-emerald-300', border: 'border-emerald-500', hex: '#059669' },
    crimson: { bg: 'bg-rose-950', text: 'text-white', header: 'bg-rose-700', accent: 'text-rose-300', border: 'border-rose-500', hex: '#be123c' },
    dark: { bg: 'bg-black', text: 'text-white', header: 'bg-gray-800', accent: 'text-gray-300', border: 'border-gray-700', hex: '#1f2937' },
    gold: { bg: 'bg-stone-900', text: 'text-amber-100', header: 'bg-amber-600', accent: 'text-amber-300', border: 'border-amber-500', hex: '#d97706' },
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCardData((prev) => ({ ...prev, photoUrl: event.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePrint = () => {
    savePrintJob({
      title: `ID Card: ${cardData.holderName} (${cardData.cardType.toUpperCase()})`,
      toolType: 'IDCard',
      status: 'Ready',
      summary: `Standard CR80 PVC ID Card (85.6mm x 53.9mm) formatted with barcode & QR security features.`
    });

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const currentTheme = themes[cardData.themeColor];

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${cardData.holderName} - CR80 ID Card Print Sheet</title>
          <style>
            @page { size: A4 portrait; margin: 15mm; }
            body { font-family: sans-serif; background: #fff; padding: 10mm; }
            .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15mm; justify-content: center; }
            .cr80-card {
              width: 85.6mm;
              height: 53.9mm;
              background: #0f172a;
              color: #fff;
              border-radius: 4mm;
              border: 1px solid #334155;
              padding: 4mm;
              box-sizing: border-box;
              position: relative;
              overflow: hidden;
            }
            .header-bar {
              background: ${currentTheme.hex};
              margin: -4mm -4mm 3mm -4mm;
              padding: 2mm 4mm;
              font-size: 11px;
              font-weight: bold;
              text-align: center;
              text-transform: uppercase;
            }
            .content { display: flex; gap: 3mm; align-items: center; }
            .photo-box { width: 22mm; height: 28mm; background: #334155; border-radius: 2mm; overflow: hidden; flex-shrink: 0; }
            .photo-box img { width: 100%; height: 100%; object-fit: cover; }
            .details { font-size: 8.5px; line-height: 1.35; color: #cbd5e1; }
            .details strong { font-size: 10px; color: #fff; display: block; }
          </style>
        </head>
        <body>
          <h2 style="text-align: center;">PrintPilot AI - CR80 PVC Plastic ID Card Sheet</h2>
          <div class="grid">
            <div class="cr80-card">
              <div class="header-bar">${cardData.organizationName}</div>
              <div class="content">
                <div class="photo-box">
                  ${cardData.photoUrl ? `<img src="${cardData.photoUrl}" />` : `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#94a3b8;font-size:8px;">PHOTO</div>`}
                </div>
                <div class="details">
                  <strong>${cardData.holderName}</strong>
                  <span style="color:#38bdf8;">${cardData.titleOrClass}</span><br/>
                  ID: ${cardData.idNumber}<br/>
                  Dept: ${cardData.department}<br/>
                  Blood: ${cardData.bloodGroup} | Exp: ${cardData.expiryDate}
                </div>
              </div>
            </div>
            <div class="cr80-card" style="display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;">
              <h4 style="margin:0;font-size:11px;">SECURITY VERIFICATION</h4>
              <p style="font-size:8px;color:#94a3b8;margin-top:4px;">Property of ${cardData.organizationName}. If found, please return to security office.</p>
              <div style="font-family:monospace;font-size:10px;letter-spacing:2px;margin-top:6px;background:#fff;color:#000;padding:2px 8px;border-radius:2px;">
                ||| || ||| | |||| ||
              </div>
            </div>
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
            <CreditCard className="w-3.5 h-3.5 text-blue-400" />
            <span>CR80 PVC Plastic Card Suite</span>
          </div>
          <h2 className="text-2xl font-bold text-white">ID Card & Credential Designer Pro</h2>
          <p className="text-xs text-gray-400">Design Employee, Student, School, Visitor, and Office ID cards with barcode and QR verification.</p>
        </div>

        <button
          onClick={handlePrint}
          className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center space-x-2 active:scale-95"
        >
          <Printer className="w-4 h-4" />
          <span>Export CR80 PVC Print PDF</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Editor Form */}
        <div className="lg:col-span-6 space-y-4 bg-white/[0.03] border border-white/10 rounded-3xl p-5 backdrop-blur-md">
          <span className="text-xs font-bold text-gray-300 uppercase tracking-wider block">ID Card Specifications</span>

          {/* Card Type Selector */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'employee', label: 'Employee ID' },
              { id: 'student', label: 'Student ID' },
              { id: 'school', label: 'School Badge' },
              { id: 'college', label: 'College Card' },
              { id: 'visitor', label: 'Visitor Pass' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setCardData({ ...cardData, cardType: t.id as any })}
                className={`p-2 rounded-xl border text-center text-xs font-bold transition-all ${
                  cardData.cardType === t.id
                    ? 'bg-blue-600 border-blue-500 text-white shadow'
                    : 'bg-white/[0.02] border-white/10 text-gray-400 hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-gray-400 mb-1">Organization / School Name</label>
              <input
                type="text"
                value={cardData.organizationName}
                onChange={(e) => setCardData({ ...cardData, organizationName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-[10px] text-gray-400 mb-1">Card Holder Full Name</label>
              <input
                type="text"
                value={cardData.holderName}
                onChange={(e) => setCardData({ ...cardData, holderName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-gray-400 mb-1">Job Title / Class</label>
              <input
                type="text"
                value={cardData.titleOrClass}
                onChange={(e) => setCardData({ ...cardData, titleOrClass: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-[10px] text-gray-400 mb-1">ID / Roll Number</label>
              <input
                type="text"
                value={cardData.idNumber}
                onChange={(e) => setCardData({ ...cardData, idNumber: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] text-gray-400 mb-1">Department</label>
              <input
                type="text"
                value={cardData.department}
                onChange={(e) => setCardData({ ...cardData, department: e.target.value })}
                className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] text-gray-400 mb-1">Blood Group</label>
              <input
                type="text"
                value={cardData.bloodGroup}
                onChange={(e) => setCardData({ ...cardData, bloodGroup: e.target.value })}
                className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] text-gray-400 mb-1">Expiry Date</label>
              <input
                type="text"
                value={cardData.expiryDate}
                onChange={(e) => setCardData({ ...cardData, expiryDate: e.target.value })}
                className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white"
              />
            </div>
          </div>

          {/* Photo Upload */}
          <div>
            <label className="block text-[10px] text-gray-400 mb-1">Holder Portrait Photo</label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoUpload}
              accept="image/*"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-gray-300 hover:text-white flex items-center justify-center space-x-2"
            >
              <Upload className="w-4 h-4 text-blue-400" />
              <span>{cardData.photoUrl ? 'Change Portrait Photo' : 'Upload Holder Photo'}</span>
            </button>
          </div>

          {/* Theme Color Switcher */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider">Card Accent Theme</label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(themes) as Array<keyof typeof themes>).map((key) => {
                const t = themes[key];
                return (
                  <button
                    key={key}
                    onClick={() => setCardData({ ...cardData, themeColor: key })}
                    className={`p-2 rounded-xl border text-left text-xs font-semibold flex items-center space-x-2 transition-all ${
                      cardData.themeColor === key ? 'bg-blue-600/30 border-blue-500 text-white font-bold' : 'bg-white/[0.02] border-white/10 text-gray-400'
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: t.hex }}></span>
                    <span className="capitalize text-[11px]">{key}</span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Live Card Preview */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex space-x-1 bg-white/[0.03] border border-white/10 rounded-xl p-1 backdrop-blur-sm">
              <button
                onClick={() => setCardSide('front')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  cardSide === 'front' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'
                }`}
              >
                Front Side
              </button>
              <button
                onClick={() => setCardSide('back')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  cardSide === 'back' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'
                }`}
              >
                Back Side
              </button>
            </div>

            <span className="text-[10px] font-mono text-blue-300">CR80 Plastic PVC Standard</span>
          </div>

          <div className="bg-slate-950/80 border border-white/10 rounded-3xl p-8 backdrop-blur-md flex items-center justify-center min-h-[380px]">
            
            {/* CR80 PVC Box */}
            <div className={`w-[320px] h-[200px] rounded-2xl ${themes[cardData.themeColor].bg} border-2 ${themes[cardData.themeColor].border} shadow-2xl relative overflow-hidden flex flex-col justify-between transition-all duration-300`}>
              
              {/* Header Ribbon */}
              <div className={`${themes[cardData.themeColor].header} px-4 py-2 text-center`}>
                <span className="text-xs font-extrabold text-white uppercase tracking-wider block truncate">
                  {cardData.organizationName}
                </span>
              </div>

              {cardSide === 'front' ? (
                <div className="p-4 flex items-center space-x-3.5 h-full">
                  <div className="w-20 h-24 rounded-xl bg-slate-800 border border-white/20 overflow-hidden shrink-0 flex items-center justify-center">
                    {cardData.photoUrl ? (
                      <img src={cardData.photoUrl} className="w-full h-full object-cover" alt="Holder" />
                    ) : (
                      <User className="w-8 h-8 text-slate-500" />
                    )}
                  </div>

                  <div className="space-y-1 overflow-hidden text-xs">
                    <h3 className="font-extrabold text-white text-sm truncate">{cardData.holderName}</h3>
                    <p className={`${themes[cardData.themeColor].accent} font-semibold text-[11px] truncate`}>
                      {cardData.titleOrClass}
                    </p>
                    <div className="text-[10px] text-gray-300 font-mono space-y-0.5 pt-1">
                      <div>ID: <span className="font-bold text-white">{cardData.idNumber}</span></div>
                      <div>Dept: {cardData.department}</div>
                      <div>Blood: <span className="text-rose-400 font-bold">{cardData.bloodGroup}</span></div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 h-full flex flex-col items-center justify-center text-center space-y-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Property Verification</span>
                  <p className="text-[9.5px] text-gray-300 px-2 leading-tight">
                    This card is non-transferable. If found, please return to security office at {cardData.organizationName}.
                  </p>
                  <div className="bg-white px-3 py-1 rounded text-slate-950 font-mono text-[10px] font-bold tracking-widest mt-1">
                    ||| |||| || | |||| ||
                  </div>
                  <div className="inline-flex items-center space-x-1 text-[9px] text-blue-400 font-mono">
                    <QrCode className="w-3 h-3" />
                    <span>Scan to Verify ID Credential</span>
                  </div>
                </div>
              )}

            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { 
  CreditCard, 
  Sparkles, 
  RotateCw, 
  Download, 
  Printer, 
  QrCode, 
  Building, 
  Phone, 
  Mail, 
  Globe, 
  MapPin,
  Check,
  Palette
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const VisitingCardV2: React.FC = () => {
  const { savePrintJob } = useAuth();

  const [bizName, setBizName] = useState('Apex Printing Systems');
  const [personName, setPersonName] = useState('Alex Vance');
  const [personTitle, setPersonTitle] = useState('Managing Director & Pre-press Lead');
  const [phone, setPhone] = useState('+1 (555) 019-2834');
  const [email, setEmail] = useState('alex@apexgraphics.com');
  const [website, setWebsite] = useState('www.apexgraphics.com');
  const [address, setAddress] = useState('102 Industrial Parkway, San Jose CA');
  const [qrLink, setQrLink] = useState('https://apexgraphics.com/vcard/alex');
  const [socials, setSocials] = useState('@apexgraphics');
  const [themeColor, setThemeColor] = useState<'navy' | 'gold' | 'emerald' | 'dark'>('navy');
  const [cardSide, setCardSide] = useState<'front' | 'back'>('front');

  const themes = {
    navy: { name: 'Deep Royal Navy', bg: 'bg-slate-900', border: 'border-blue-500', text: 'text-white', accent: 'text-blue-400', hex: '#0f172a' },
    gold: { name: 'Champagne Gold Luxury', bg: 'bg-stone-900', border: 'border-amber-500', text: 'text-amber-100', accent: 'text-amber-400', hex: '#1c1917' },
    emerald: { name: 'Emerald Velvet', bg: 'bg-emerald-950', border: 'border-emerald-500', text: 'text-white', accent: 'text-emerald-400', hex: '#022c22' },
    dark: { name: 'Matte Obsidian Black', bg: 'bg-black', border: 'border-gray-700', text: 'text-white', accent: 'text-gray-300', hex: '#000000' },
  };

  const handleExport = () => {
    savePrintJob({
      title: `Business Card: ${personName} (${bizName})`,
      toolType: 'Card',
      status: 'Ready',
      summary: `350 GSM soft-touch double-sided business card generated with spot UV and 3mm bleed.`
    });

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const currentTheme = themes[themeColor];

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${bizName} - Business Card Print Layout</title>
          <style>
            @page { size: A4 portrait; margin: 15mm; }
            body { font-family: sans-serif; background: #fff; padding: 10mm; }
            .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15mm; justify-content: center; }
            .card {
              width: 88.9mm;
              height: 50.8mm;
              background: ${currentTheme.hex};
              color: #fff;
              padding: 6mm;
              box-sizing: border-box;
              border: 1px dashed #ccc;
              position: relative;
            }
            .title { font-size: 14px; font-weight: bold; margin: 0; }
            .sub { font-size: 10px; color: #38bdf8; margin-top: 2px; }
            .info { font-size: 8.5px; margin-top: 8px; line-height: 1.4; color: #cbd5e1; }
          </style>
        </head>
        <body>
          <h2 style="text-align: center;">PrintPilot AI - 300 DPI Business Card Print Sheet</h2>
          <div class="grid">
            <div class="card">
              <div class="title">${personName}</div>
              <div class="sub">${personTitle}</div>
              <p style="font-weight: bold; margin-top: 10px; font-size: 11px;">${bizName}</p>
              <div class="info">
                📞 ${phone}<br/>
                ✉️ ${email}<br/>
                🌐 ${website}<br/>
                📍 ${address}
              </div>
            </div>
            <div class="card" style="display: flex; flex-col; align-items: center; justify-content: center; text-align: center;">
              <h3 style="margin: 0; font-size: 16px;">${bizName}</h3>
              <p style="font-size: 10px; color: #38bdf8; margin-top: 4px;">Premium Commercial Printing</p>
              <p style="font-size: 9px; color: #94a3b8; margin-top: 8px;">${socials}</p>
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
            <span>Double-Sided 300 DPI Vector Card Engine</span>
          </div>
          <h2 className="text-2xl font-bold text-white">AI Visiting Card Generator V2</h2>
          <p className="text-xs text-gray-400">Design 350 GSM soft-touch double-sided business cards with QR codes and 3mm press bleed marks.</p>
        </div>

        <button
          onClick={handleExport}
          className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center space-x-2 active:scale-95"
        >
          <Printer className="w-4 h-4" />
          <span>Export Print-Ready PDF</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Editor Form */}
        <div className="lg:col-span-6 space-y-4 bg-white/[0.03] border border-white/10 rounded-3xl p-5 backdrop-blur-md">
          <span className="text-xs font-bold text-gray-300 uppercase tracking-wider block">Business Card Info</span>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-gray-400 mb-1">Company / Business Name</label>
              <input
                type="text"
                value={bizName}
                onChange={(e) => setBizName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-[10px] text-gray-400 mb-1">Full Name</label>
              <input
                type="text"
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-gray-400 mb-1">Job Title</label>
              <input
                type="text"
                value={personTitle}
                onChange={(e) => setPersonTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-[10px] text-gray-400 mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-gray-400 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-[10px] text-gray-400 mb-1">Website URL</label>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-gray-400 mb-1">Physical Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Theme Color Switcher */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider">Brand Color Theme</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(themes) as Array<keyof typeof themes>).map((key) => {
                const t = themes[key];
                return (
                  <button
                    key={key}
                    onClick={() => setThemeColor(key)}
                    className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center space-x-2 transition-all ${
                      themeColor === key ? 'bg-blue-600/30 border-blue-500 text-white font-bold' : 'bg-white/[0.02] border-white/10 text-gray-400'
                    }`}
                  >
                    <span className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0" style={{ backgroundColor: t.hex }}></span>
                    <span className="truncate">{t.name}</span>
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

            <span className="text-[10px] font-mono text-gray-400">Spec: 3.5" × 2.0" (3mm Bleed)</span>
          </div>

          {/* Card Box */}
          <div className="bg-slate-950/80 border border-white/10 rounded-3xl p-8 backdrop-blur-md flex items-center justify-center min-h-[380px]">
            
            <div className={`w-[360px] h-[210px] rounded-2xl ${themes[themeColor].bg} border-2 ${themes[themeColor].border} p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between transition-all duration-300`}>
              
              {/* Bleed line indicator overlay */}
              <div className="absolute inset-2 border border-dashed border-white/20 rounded-xl pointer-events-none"></div>

              {cardSide === 'front' ? (
                <>
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className={`text-base font-extrabold ${themes[themeColor].text}`}>{personName}</h3>
                      <span className="text-[10px] font-mono text-blue-400 font-bold">350 GSM</span>
                    </div>
                    <p className={`text-xs ${themes[themeColor].accent} font-medium`}>{personTitle}</p>
                    <p className="text-xs text-white font-bold mt-1">{bizName}</p>
                  </div>

                  <div className="space-y-1 text-[10.5px] text-gray-300 font-mono">
                    <div className="flex items-center space-x-1.5">
                      <Phone className="w-3 h-3 text-blue-400" />
                      <span>{phone}</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <Mail className="w-3 h-3 text-blue-400" />
                      <span>{email}</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <Globe className="w-3 h-3 text-blue-400" />
                      <span>{website}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                    <Building className="w-6 h-6" />
                  </div>
                  <h3 className={`text-lg font-extrabold ${themes[themeColor].text}`}>{bizName}</h3>
                  <p className="text-xs text-gray-400 font-mono">{socials}</p>
                  <div className="inline-flex items-center space-x-1 text-[9px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    <QrCode className="w-3 h-3" />
                    <span>Scan QR to Add Contact</span>
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

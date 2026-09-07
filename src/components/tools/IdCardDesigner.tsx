import React, { useState, useRef, useEffect } from 'react';
import { CreditCard, QrCode, Upload, Printer, User } from 'lucide-react';
import QRCode from 'qrcode';
import { useAuth } from '../../context/AuthContext';
import { openPrintWindow, addStyles, el, validateImageFile, errorMessage } from '../../lib/security';
import { PRINT_SIZE_MAP } from '../../lib/printSpecs';

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
  photoUrl?: string;
  themeColor: 'navy' | 'emerald' | 'crimson' | 'dark' | 'gold';
}

// Exact CR80 dimensions from the shared spec table (85.60 × 53.98 mm).
const CR80 = PRINT_SIZE_MAP['cr80'];

export const IdCardDesigner: React.FC = () => {
  const { savePrintJob } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [cardData, setCardData] = useState<IdCardData>({
    cardType: 'employee',
    holderName: '',
    titleOrClass: '',
    idNumber: '',
    department: '',
    issueDate: new Date().toISOString().slice(0, 10),
    expiryDate: '',
    bloodGroup: '',
    emergencyContact: '',
    organizationName: '',
    themeColor: 'navy',
  });

  const [cardSide, setCardSide] = useState<'front' | 'back'>('front');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const themes = {
    navy: { bg: 'bg-slate-900', header: 'bg-blue-600', accent: 'text-blue-400', border: 'border-blue-500', hex: '#2563eb' },
    emerald: { bg: 'bg-emerald-950', header: 'bg-emerald-600', accent: 'text-emerald-300', border: 'border-emerald-500', hex: '#059669' },
    crimson: { bg: 'bg-rose-950', header: 'bg-rose-700', accent: 'text-rose-300', border: 'border-rose-500', hex: '#be123c' },
    dark: { bg: 'bg-black', header: 'bg-gray-800', accent: 'text-gray-300', border: 'border-gray-700', hex: '#1f2937' },
    gold: { bg: 'bg-stone-900', header: 'bg-amber-600', accent: 'text-amber-300', border: 'border-amber-500', hex: '#d97706' },
  };

  // Real QR encoding the credential so it can be scanned/verified.
  const qrPayload = [
    `BEGIN:VCARD`,
    `VERSION:3.0`,
    `FN:${cardData.holderName}`,
    `TITLE:${cardData.titleOrClass}`,
    `ORG:${cardData.organizationName}`,
    `NOTE:ID ${cardData.idNumber}; Type ${cardData.cardType}`,
    `END:VCARD`,
  ].join('\n');

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(qrPayload, { margin: 1, width: 240, errorCorrectionLevel: 'M' })
      .then((url) => { if (!cancelled) setQrDataUrl(url); })
      .catch((err) => { if (!cancelled) setError(errorMessage(err)); });
    return () => { cancelled = true; };
  }, [qrPayload]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const verr = validateImageFile(file, 10);
    if (verr) { setError(verr); return; }
    setError(null);
    const reader = new FileReader();
    reader.onload = (event) => setCardData((prev) => ({ ...prev, photoUrl: event.target?.result as string }));
    reader.onerror = () => setError('Could not read the selected photo.');
    reader.readAsDataURL(file);
  };

  const handlePrint = () => {
    if (!cardData.holderName.trim()) { setError('Enter the card holder name before printing.'); return; }
    setError(null);

    savePrintJob({
      title: `ID Card: ${cardData.holderName} (${cardData.cardType.toUpperCase()})`,
      toolType: 'IDCard',
      status: 'Ready',
      summary: `CR80 PVC ID card (${CR80.widthMm}mm × ${CR80.heightMm}mm) front and back, printed on an A4 sheet.`,
    });

    const currentTheme = themes[cardData.themeColor];
    const photo = cardData.photoUrl;
    const qr = qrDataUrl;

    openPrintWindow(`${cardData.holderName} - CR80 ID Card`, (doc) => {
      addStyles(doc, `
        @page { size: A4 portrait; margin: 15mm; }
        body { font-family: sans-serif; background: #fff; padding: 10mm; color: #0f172a; }
        h2 { text-align: center; font-size: 15px; margin: 0 0 6mm 0; }
        .grid { display: grid; grid-template-columns: repeat(2, ${CR80.widthMm}mm); gap: 8mm; justify-content: center; }
        .cr80-card { width: ${CR80.widthMm}mm; height: ${CR80.heightMm}mm; background: #0f172a; color: #fff; border-radius: 3mm; border: 1px solid #334155; padding: 3.5mm; box-sizing: border-box; position: relative; overflow: hidden; }
        .header-bar { background: ${currentTheme.hex}; margin: -3.5mm -3.5mm 2.5mm -3.5mm; padding: 1.8mm 3.5mm; font-size: 10px; font-weight: bold; text-align: center; text-transform: uppercase; }
        .content { display: flex; gap: 3mm; align-items: center; }
        .photo-box { width: 20mm; height: 25mm; background: #334155; border-radius: 2mm; overflow: hidden; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
        .photo-box img { width: 100%; height: 100%; object-fit: cover; }
        .details { font-size: 8px; line-height: 1.4; color: #cbd5e1; }
        .details .name { font-size: 11px; color: #fff; font-weight: bold; display: block; }
        .details .role { color: #38bdf8; }
        .back { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: 2mm; }
        .back h4 { margin: 0; font-size: 10px; }
        .back p { font-size: 7.5px; color: #94a3b8; margin: 0; }
        .qr { width: 22mm; height: 22mm; }
        .caption { text-align: center; font-size: 8px; color: #64748b; margin-top: 4mm; }
      `);

      doc.body.appendChild(el(doc, 'h2', { text: 'PrintPilot AI — CR80 PVC ID Card Sheet' }));

      const grid = el(doc, 'div', { className: 'grid' });

      // Front
      const front = el(doc, 'div', { className: 'cr80-card' });
      front.appendChild(el(doc, 'div', { className: 'header-bar', text: cardData.organizationName }));
      const content = el(doc, 'div', { className: 'content' });
      const photoBox = el(doc, 'div', { className: 'photo-box' });
      if (photo) {
        photoBox.appendChild(el(doc, 'img', { attrs: { src: photo, alt: '' } }));
      } else {
        photoBox.appendChild(el(doc, 'span', { text: 'PHOTO', style: { color: '#94a3b8', fontSize: '8px' } }));
      }
      content.appendChild(photoBox);
      const details = el(doc, 'div', { className: 'details' });
      details.appendChild(el(doc, 'span', { className: 'name', text: cardData.holderName }));
      details.appendChild(el(doc, 'span', { className: 'role', text: cardData.titleOrClass }));
      details.appendChild(el(doc, 'br'));
      details.appendChild(doc.createTextNode(`ID: ${cardData.idNumber}`));
      details.appendChild(el(doc, 'br'));
      details.appendChild(doc.createTextNode(`Dept: ${cardData.department}`));
      details.appendChild(el(doc, 'br'));
      details.appendChild(doc.createTextNode(`Blood: ${cardData.bloodGroup} | Exp: ${cardData.expiryDate}`));
      content.appendChild(details);
      front.appendChild(content);
      grid.appendChild(front);

      // Back
      const back = el(doc, 'div', { className: 'cr80-card back' });
      back.appendChild(el(doc, 'h4', { text: 'SECURITY VERIFICATION' }));
      back.appendChild(el(doc, 'p', { text: `Property of ${cardData.organizationName}. If found, please return to the security office.` }));
      if (qr) back.appendChild(el(doc, 'img', { className: 'qr', attrs: { src: qr, alt: 'Credential QR' } }));
      grid.appendChild(back);

      doc.body.appendChild(grid);
      doc.body.appendChild(el(doc, 'p', { className: 'caption', text: `Trim each card to ${CR80.widthMm} × ${CR80.heightMm} mm (CR80 / ISO 7810 ID-1).` }));
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-semibold px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 mb-1">
            <CreditCard className="w-3.5 h-3.5 text-blue-400" />
            <span>CR80 PVC Card · {CR80.widthMm}×{CR80.heightMm}mm</span>
          </div>
          <h2 className="text-2xl font-bold text-white">ID Card &amp; Credential Designer</h2>
          <p className="text-xs text-gray-400">Design employee, student, school, college and visitor cards with a real scannable QR credential.</p>
        </div>

        <button
          onClick={handlePrint}
          className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center space-x-2 active:scale-95"
        >
          <Printer className="w-4 h-4" />
          <span>Print CR80 Sheet</span>
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-200">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Editor Form */}
        <div className="lg:col-span-6 space-y-4 bg-white/[0.03] border border-white/10 rounded-3xl p-5 backdrop-blur-md">
          <span className="text-xs font-bold text-gray-300 uppercase tracking-wider block">ID Card Specifications</span>

          <div className="grid grid-cols-3 gap-2">
            {([
              { id: 'employee', label: 'Employee ID' },
              { id: 'student', label: 'Student ID' },
              { id: 'school', label: 'School Badge' },
              { id: 'college', label: 'College Card' },
              { id: 'visitor', label: 'Visitor Pass' },
            ] as const).map((t) => (
              <button
                key={t.id}
                onClick={() => setCardData({ ...cardData, cardType: t.id })}
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
              <input type="text" value={cardData.organizationName} onChange={(e) => setCardData({ ...cardData, organizationName: e.target.value })} placeholder="Acme Corp" className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-[10px] text-gray-400 mb-1">Card Holder Full Name</label>
              <input type="text" value={cardData.holderName} onChange={(e) => setCardData({ ...cardData, holderName: e.target.value })} placeholder="Jane A. Doe" className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-blue-500" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-gray-400 mb-1">Job Title / Class</label>
              <input type="text" value={cardData.titleOrClass} onChange={(e) => setCardData({ ...cardData, titleOrClass: e.target.value })} placeholder="Pre-press Specialist" className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-[10px] text-gray-400 mb-1">ID / Roll Number</label>
              <input type="text" value={cardData.idNumber} onChange={(e) => setCardData({ ...cardData, idNumber: e.target.value })} placeholder="EMP-0001" className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-blue-500" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] text-gray-400 mb-1">Department</label>
              <input type="text" value={cardData.department} onChange={(e) => setCardData({ ...cardData, department: e.target.value })} className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white" />
            </div>
            <div>
              <label className="block text-[10px] text-gray-400 mb-1">Blood Group</label>
              <input type="text" value={cardData.bloodGroup} onChange={(e) => setCardData({ ...cardData, bloodGroup: e.target.value })} className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white" />
            </div>
            <div>
              <label className="block text-[10px] text-gray-400 mb-1">Expiry Date</label>
              <input type="text" value={cardData.expiryDate} onChange={(e) => setCardData({ ...cardData, expiryDate: e.target.value })} placeholder="2028-01-15" className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white" />
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-gray-400 mb-1">Holder Portrait Photo</label>
            <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-gray-300 hover:text-white flex items-center justify-center space-x-2">
              <Upload className="w-4 h-4 text-blue-400" />
              <span>{cardData.photoUrl ? 'Change Portrait Photo' : 'Upload Holder Photo'}</span>
            </button>
          </div>

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
              <button onClick={() => setCardSide('front')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${cardSide === 'front' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>Front</button>
              <button onClick={() => setCardSide('back')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${cardSide === 'back' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>Back</button>
            </div>
            <span className="text-[10px] font-mono text-blue-300">CR80 · ISO 7810 ID-1</span>
          </div>

          <div className="bg-slate-950/80 border border-white/10 rounded-3xl p-8 backdrop-blur-md flex items-center justify-center min-h-[380px]">
            {/* CR80 box at the exact 85.6:53.98 aspect ratio */}
            <div
              className={`w-[342px] rounded-2xl ${themes[cardData.themeColor].bg} border-2 ${themes[cardData.themeColor].border} shadow-2xl relative overflow-hidden flex flex-col justify-between transition-all duration-300`}
              style={{ aspectRatio: `${CR80.widthMm} / ${CR80.heightMm}` }}
            >
              <div className={`${themes[cardData.themeColor].header} px-4 py-2 text-center`}>
                <span className="text-xs font-extrabold text-white uppercase tracking-wider block truncate">
                  {cardData.organizationName || 'Your Organization'}
                </span>
              </div>

              {cardSide === 'front' ? (
                <div className="p-4 flex items-center space-x-3.5 flex-1 min-h-0">
                  <div className="w-20 h-24 rounded-xl bg-slate-800 border border-white/20 overflow-hidden shrink-0 flex items-center justify-center">
                    {cardData.photoUrl ? (
                      <img src={cardData.photoUrl} className="w-full h-full object-cover" alt="Holder" />
                    ) : (
                      <User className="w-8 h-8 text-slate-500" />
                    )}
                  </div>
                  <div className="space-y-1 overflow-hidden text-xs">
                    <h3 className="font-extrabold text-white text-sm truncate">{cardData.holderName || 'Holder Name'}</h3>
                    <p className={`${themes[cardData.themeColor].accent} font-semibold text-[11px] truncate`}>{cardData.titleOrClass || 'Title / Class'}</p>
                    <div className="text-[10px] text-gray-300 font-mono space-y-0.5 pt-1">
                      <div>ID: <span className="font-bold text-white">{cardData.idNumber || '—'}</span></div>
                      <div className="truncate">Dept: {cardData.department || '—'}</div>
                      <div>Blood: <span className="text-rose-400 font-bold">{cardData.bloodGroup || '—'}</span></div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 flex-1 min-h-0 flex flex-col items-center justify-center text-center space-y-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Property Verification</span>
                  <p className="text-[9.5px] text-gray-300 px-2 leading-tight">
                    This card is non-transferable. If found, please return to the security office at {cardData.organizationName || 'the issuer'}.
                  </p>
                  {qrDataUrl ? (
                    <img src={qrDataUrl} alt="Credential QR" className="w-20 h-20 rounded bg-white p-1" />
                  ) : (
                    <QrCode className="w-16 h-16 text-gray-500" />
                  )}
                  <div className="inline-flex items-center space-x-1 text-[9px] text-blue-400 font-mono">
                    <QrCode className="w-3 h-3" />
                    <span>Scan to verify credential</span>
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

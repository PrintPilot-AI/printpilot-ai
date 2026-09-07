import React, { useEffect, useMemo, useState } from 'react';
import {
  CreditCard,
  Printer,
  QrCode,
  Phone,
  Mail,
  Globe,
  MapPin,
  MessageCircle,
  Building,
  Upload,
  AlertCircle,
} from 'lucide-react';
import QRCode from 'qrcode';
import { useAuth } from '../../context/AuthContext';
import { openPrintWindow, addStyles, el, validateImageFile, errorMessage } from '../../lib/security';
import { mmToPx, upsPerSheet } from '../../lib/printSpecs';

interface CardFields {
  fullName: string;
  jobTitle: string;
  company: string;
  tagline: string;
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  address: string;
  socials: { label: string; url: string }[];
}

type ThemeId = 'navy' | 'gold' | 'emerald' | 'obsidian' | 'minimal';
type SizeId = 'us-business-card' | 'cr80';
type QrTarget = 'vcard' | 'whatsapp' | 'phone' | 'website' | 'none';

const THEMES: Record<ThemeId, { name: string; bg: string; panel: string; text: string; muted: string; accent: string }> = {
  navy: { name: 'Deep Navy', bg: '#0f172a', panel: '#1e293b', text: '#f8fafc', muted: '#94a3b8', accent: '#38bdf8' },
  gold: { name: 'Champagne Gold', bg: '#1c1917', panel: '#292524', text: '#fef3c7', muted: '#d6c7a1', accent: '#f59e0b' },
  emerald: { name: 'Emerald Velvet', bg: '#022c22', panel: '#064e3b', text: '#ecfdf5', muted: '#6ee7b7', accent: '#10b981' },
  obsidian: { name: 'Obsidian Black', bg: '#09090b', panel: '#18181b', text: '#fafafa', muted: '#a1a1aa', accent: '#e4e4e7' },
  minimal: { name: 'Minimal White', bg: '#ffffff', panel: '#f1f5f9', text: '#0f172a', muted: '#64748b', accent: '#2563eb' },
};

const SIZES: Record<SizeId, { name: string; widthMm: number; heightMm: number }> = {
  'us-business-card': { name: 'US Business Card (88.9 × 50.8 mm)', widthMm: 88.9, heightMm: 50.8 },
  cr80: { name: 'CR80 ID-1 (85.6 × 53.98 mm)', widthMm: 85.6, heightMm: 53.98 },
};

const BLEED_MM = 3;

function normalizeUrl(u: string): string {
  const t = u.trim();
  if (!t) return '';
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
}

function digitsOnly(p: string): string {
  return p.replace(/[^\d]/g, '');
}

function buildVCard(f: CardFields): string {
  const lines = ['BEGIN:VCARD', 'VERSION:3.0'];
  const nameParts = f.fullName.trim().split(/\s+/);
  const first = nameParts.shift() || '';
  lines.push(`N:${nameParts.join(' ')};${first}`);
  lines.push(`FN:${f.fullName}`);
  if (f.jobTitle) lines.push(`TITLE:${f.jobTitle}`);
  if (f.company) lines.push(`ORG:${f.company}`);
  if (f.phone) lines.push(`TEL;TYPE=VOICE:${f.phone}`);
  if (f.whatsapp) lines.push(`TEL;TYPE=CELL:${f.whatsapp}`);
  if (f.email) lines.push(`EMAIL:${f.email}`);
  if (f.website) lines.push(`URL:${normalizeUrl(f.website)}`);
  if (f.address) lines.push(`ADR;TYPE=WORK:;;;;${f.address}`);
  f.socials.forEach((s) => { if (s.url) lines.push(`URL;TYPE=${s.label || 'SOCIAL'}:${normalizeUrl(s.url)}`); });
  lines.push('END:VCARD');
  return lines.join('\n');
}

export const VisitingCardV2: React.FC = () => {
  const { savePrintJob } = useAuth();
  const [fields, setFields] = useState<CardFields>({
    fullName: '',
    jobTitle: '',
    company: '',
    tagline: '',
    phone: '',
    whatsapp: '',
    email: '',
    website: '',
    address: '',
    socials: [],
  });
  const [theme, setTheme] = useState<ThemeId>('navy');
  const [sizeId, setSizeId] = useState<SizeId>('us-business-card');
  const [qrTarget, setQrTarget] = useState<QrTarget>('vcard');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [socialDraft, setSocialDraft] = useState({ label: '', url: '' });
  const [copies, setCopies] = useState(8);

  const size = SIZES[sizeId];
  const th = THEMES[theme];

  const set = <K extends keyof CardFields>(k: K, v: CardFields[K]) => setFields((f) => ({ ...f, [k]: v }));

  // Real QR generation from the actual field values.
  const qrPayload = useMemo(() => {
    switch (qrTarget) {
      case 'vcard': return buildVCard(fields);
      case 'whatsapp': {
        const d = digitsOnly(fields.whatsapp || fields.phone);
        return d ? `https://wa.me/${d}` : '';
      }
      case 'phone': return fields.phone ? `tel:${digitsOnly(fields.phone)}` : '';
      case 'website': return normalizeUrl(fields.website);
      default: return '';
    }
  }, [qrTarget, fields]);

  useEffect(() => {
    let cancelled = false;
    if (qrTarget === 'none' || !qrPayload) { setQrDataUrl(null); setQrError(null); return; }
    QRCode.toDataURL(qrPayload, { margin: 1, width: 320, errorCorrectionLevel: 'M', color: { dark: '#000000', light: '#ffffff' } })
      .then((url) => { if (!cancelled) { setQrDataUrl(url); setQrError(null); } })
      .catch((err) => { if (!cancelled) { setQrDataUrl(null); setQrError(errorMessage(err)); } });
    return () => { cancelled = true; };
  }, [qrPayload, qrTarget]);

  const onLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const verr = validateImageFile(file, 5);
    if (verr) { setError(verr); return; }
    const reader = new FileReader();
    reader.onload = () => setLogoUrl(reader.result as string);
    reader.onerror = () => setError('Could not read that image.');
    reader.readAsDataURL(file);
  };

  const cardMm = { w: size.widthMm, h: size.heightMm };
  const nesting = upsPerSheet(cardMm.w + BLEED_MM * 2, cardMm.h + BLEED_MM * 2, 210, 297, 4);

  const front = (
    <div
      className="rounded-xl relative overflow-hidden shadow-2xl"
      style={{ width: 380, height: Math.round(380 * (cardMm.h / cardMm.w)), backgroundColor: th.bg, color: th.text }}
    >
      <div className="absolute inset-0 p-5 flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            {logoUrl ? (
              <img src={logoUrl} alt="" className="w-10 h-10 rounded-lg object-contain bg-white/90 p-0.5" />
            ) : (
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: th.accent }}>
                <Building className="w-5 h-5" style={{ color: th.bg }} />
              </div>
            )}
            <div>
              <div className="text-[15px] font-extrabold leading-tight">{fields.company || 'Company Name'}</div>
              {fields.tagline && <div className="text-[9.5px]" style={{ color: th.muted }}>{fields.tagline}</div>}
            </div>
          </div>
        </div>
        <div>
          <div className="text-[17px] font-bold leading-tight">{fields.fullName || 'Your Name'}</div>
          {fields.jobTitle && <div className="text-[11px] font-medium" style={{ color: th.accent }}>{fields.jobTitle}</div>}
        </div>
      </div>
      <div className="absolute inset-[6px] border border-dashed pointer-events-none rounded-lg" style={{ borderColor: `${th.muted}44` }} />
    </div>
  );

  const contactRow = (Icon: React.ElementType, text: string) =>
    text ? (
      <div key={text} className="flex items-center gap-1.5 text-[9.5px]" style={{ color: th.muted }}>
        <Icon className="w-3 h-3 shrink-0" style={{ color: th.accent }} />
        <span className="truncate">{text}</span>
      </div>
    ) : null;

  const back = (
    <div
      className="rounded-xl relative overflow-hidden shadow-2xl"
      style={{ width: 380, height: Math.round(380 * (cardMm.h / cardMm.w)), backgroundColor: th.bg, color: th.text }}
    >
      <div className="absolute inset-0 p-5 flex gap-4">
        <div className="flex-1 flex flex-col justify-center gap-1 min-w-0">
          {contactRow(Phone, fields.phone)}
          {contactRow(MessageCircle, fields.whatsapp ? `WhatsApp ${fields.whatsapp}` : '')}
          {contactRow(Mail, fields.email)}
          {contactRow(Globe, fields.website)}
          {contactRow(MapPin, fields.address)}
          {fields.socials.map((s) => contactRow(Globe, `${s.label || 'Social'} · ${s.url}`))}
        </div>
        {qrTarget !== 'none' && (
          <div className="flex flex-col items-center justify-center gap-1">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="QR code" className="w-[74px] h-[74px] rounded-md bg-white p-1" />
            ) : (
              <div className="w-[74px] h-[74px] rounded-md bg-white/10 flex items-center justify-center"><QrCode className="w-6 h-6" style={{ color: th.muted }} /></div>
            )}
            <span className="text-[7.5px] uppercase tracking-wider" style={{ color: th.muted }}>{qrTarget === 'vcard' ? 'Scan to save' : qrTarget}</span>
          </div>
        )}
      </div>
    </div>
  );

  const handlePrint = () => {
    if (!fields.fullName.trim() && !fields.company.trim()) { setError('Add at least a name or company before exporting.'); return; }
    setError(null);
    savePrintJob({
      title: `Business Card: ${fields.fullName || fields.company}`,
      toolType: 'Card',
      status: 'Ready',
      summary: `${size.name}, ${theme} theme, ${copies}-up A4 sheet with ${BLEED_MM}mm bleed.`,
    });

    const ok = openPrintWindow(`${fields.company || fields.fullName} — Business Cards`, (doc) => {
      addStyles(doc, `
        @page { size: A4 portrait; margin: 10mm; }
        * { box-sizing: border-box; }
        body { font-family: 'Helvetica Neue', Arial, sans-serif; margin: 0; color: #0f172a; }
        h1 { font-size: 15px; text-align: center; margin: 0 0 4mm; }
        .meta { text-align: center; font-size: 10px; color: #64748b; margin-bottom: 6mm; }
        .grid { display: flex; flex-wrap: wrap; gap: 4mm; justify-content: center; }
        .cell { position: relative; }
        .card { position: relative; overflow: hidden; border-radius: 1mm; }
        .bleedbox { padding: ${BLEED_MM}mm; background: #fff; }
        .trim { position: absolute; inset: ${BLEED_MM}mm; border: 0.2mm dashed rgba(0,0,0,0.18); pointer-events: none; }
        .front, .back { width: ${cardMm.w}mm; height: ${cardMm.h}mm; background: ${th.bg}; color: ${th.text}; padding: 5mm; position: relative; }
        .row { display: flex; align-items: center; gap: 1.5mm; font-size: 7.2pt; color: ${th.muted}; margin-top: 1.2mm; }
        .name { font-size: 13pt; font-weight: 800; line-height: 1.1; }
        .role { font-size: 8pt; color: ${th.accent}; margin-top: 0.6mm; }
        .co { font-size: 11pt; font-weight: 800; }
        .tag { font-size: 7pt; color: ${th.muted}; }
        .top { display: flex; align-items: center; gap: 2.5mm; }
        .logobox { width: 11mm; height: 11mm; border-radius: 1.5mm; overflow: hidden; background: rgba(255,255,255,0.9); display: flex; align-items: center; justify-content: center; }
        .logobox img { width: 100%; height: 100%; object-fit: contain; }
        .accentchip { width: 11mm; height: 11mm; border-radius: 1.5mm; background: ${th.accent}; }
        .flexrow { display: flex; gap: 4mm; height: 100%; }
        .contactcol { flex: 1; display: flex; flex-direction: column; justify-content: center; }
        .qrcol { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1mm; }
        .qrcol img { width: 20mm; height: 20mm; background: #fff; padding: 0.6mm; border-radius: 1mm; }
        .qrlbl { font-size: 5.5pt; text-transform: uppercase; letter-spacing: 0.3mm; color: ${th.muted}; }
        .filler { height: ${cardMm.h}mm; }
      `);
      const body = doc.body;
      body.appendChild(el(doc, 'h1', { text: `${fields.company || fields.fullName || 'Business Card'} — print sheet` }));
      body.appendChild(el(doc, 'div', { className: 'meta', text: `${size.name} · ${BLEED_MM}mm bleed · ${copies} up on A4 · ${theme} theme` }));

      const makeContactRow = (text: string) => {
        const r = el(doc, 'div', { className: 'row' });
        r.appendChild(el(doc, 'span', { text: '•' }));
        r.appendChild(el(doc, 'span', { text }));
        return r;
      };

      const buildFront = () => {
        const card = el(doc, 'div', { className: 'front' });
        const top = el(doc, 'div', { className: 'top' });
        const logoBox = el(doc, 'div', { className: 'logobox' });
        if (logoUrl) { const img = doc.createElement('img'); img.src = logoUrl; img.alt = ''; logoBox.appendChild(img); }
        else { const chip = el(doc, 'div', { className: 'accentchip' }); logoBox.appendChild(chip); }
        top.appendChild(logoBox);
        const coWrap = el(doc, 'div');
        coWrap.appendChild(el(doc, 'div', { className: 'co', text: fields.company || 'Company Name' }));
        if (fields.tagline) coWrap.appendChild(el(doc, 'div', { className: 'tag', text: fields.tagline }));
        top.appendChild(coWrap);
        card.appendChild(top);
        const nameWrap = el(doc, 'div', { style: { position: 'absolute', bottom: '5mm', left: '5mm', right: '5mm' } });
        nameWrap.appendChild(el(doc, 'div', { className: 'name', text: fields.fullName || 'Your Name' }));
        if (fields.jobTitle) nameWrap.appendChild(el(doc, 'div', { className: 'role', text: fields.jobTitle }));
        card.appendChild(nameWrap);
        return card;
      };

      const buildBack = () => {
        const card = el(doc, 'div', { className: 'back' });
        const flex = el(doc, 'div', { className: 'flexrow' });
        const col = el(doc, 'div', { className: 'contactcol' });
        const rows = [
          fields.phone, fields.whatsapp ? `WhatsApp ${fields.whatsapp}` : '', fields.email,
          fields.website ? normalizeUrl(fields.website) : '', fields.address,
          ...fields.socials.map((s) => `${s.label || 'Social'}: ${s.url}`).filter(Boolean),
        ].filter(Boolean) as string[];
        rows.forEach((r) => col.appendChild(makeContactRow(r)));
        flex.appendChild(col);
        if (qrTarget !== 'none' && qrDataUrl) {
          const qcol = el(doc, 'div', { className: 'qrcol' });
          const img = doc.createElement('img'); img.src = qrDataUrl; img.alt = 'QR';
          qcol.appendChild(img);
          qcol.appendChild(el(doc, 'div', { className: 'qrlbl', text: qrTarget === 'vcard' ? 'Scan to save contact' : qrTarget }));
          flex.appendChild(qcol);
        }
        card.appendChild(flex);
        return card;
      };

      const wrap = (cardEl: HTMLElement) => {
        const cell = el(doc, 'div', { className: 'cell' });
        const bleed = el(doc, 'div', { className: 'bleedbox' });
        bleed.appendChild(cardEl);
        bleed.appendChild(el(doc, 'div', { className: 'trim' }));
        cell.appendChild(bleed);
        return cell;
      };

      const grid = el(doc, 'div', { className: 'grid' });
      for (let i = 0; i < copies; i++) {
        grid.appendChild(wrap(i % 2 === 0 ? buildFront() : buildBack()));
      }
      body.appendChild(grid);
      body.appendChild(el(doc, 'div', { className: 'meta', style: { marginTop: '5mm' }, text: `Dashed line = trim · artwork extends ${BLEED_MM}mm beyond for bleed · print at 100% scale on A4` }));
    });
    if (!ok) setError('Popup blocked — allow popups to print or save as PDF.');
  };

  const inputCls = 'w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-blue-500';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-semibold px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 mb-1">
            <CreditCard className="w-3.5 h-3.5 text-blue-400" />
            <span>Exact print dimensions · real QR · XSS-safe</span>
          </div>
          <h2 className="text-2xl font-bold text-white">Visiting Card V2</h2>
          <p className="text-xs text-gray-400">Enter your own details, pick a theme and size, generate a real QR, then export a bleed-ready A4 print sheet.</p>
        </div>
        <button onClick={handlePrint} className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center space-x-2 active:scale-95">
          <Printer className="w-4 h-4" />
          <span>Export Print Sheet</span>
        </button>
      </div>

      {(error || qrError) && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error || qrError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 space-y-4 bg-white/[0.03] border border-white/10 rounded-3xl p-5 backdrop-blur-md max-h-[680px] overflow-y-auto pr-2">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Full Name" value={fields.fullName} onChange={(v) => set('fullName', v)} cls={inputCls} />
            <Field label="Job Title" value={fields.jobTitle} onChange={(v) => set('jobTitle', v)} cls={inputCls} />
            <Field label="Company" value={fields.company} onChange={(v) => set('company', v)} cls={inputCls} />
            <Field label="Tagline" value={fields.tagline} onChange={(v) => set('tagline', v)} cls={inputCls} />
            <Field label="Phone" value={fields.phone} onChange={(v) => set('phone', v)} cls={inputCls} />
            <Field label="WhatsApp" value={fields.whatsapp} onChange={(v) => set('whatsapp', v)} cls={inputCls} />
            <Field label="Email" value={fields.email} onChange={(v) => set('email', v)} cls={inputCls} />
            <Field label="Website" value={fields.website} onChange={(v) => set('website', v)} cls={inputCls} />
          </div>
          <Field label="Address" value={fields.address} onChange={(v) => set('address', v)} cls={inputCls} />

          <div>
            <label className="block text-[10px] text-gray-400 mb-1">Logo (optional)</label>
            <div className="flex items-center gap-2">
              <label className="cursor-pointer px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-[11px] font-bold flex items-center gap-1.5 border border-white/10">
                <Upload className="w-3.5 h-3.5" /> Upload logo
                <input type="file" accept="image/*" className="hidden" onChange={onLogo} />
              </label>
              {logoUrl && <button onClick={() => setLogoUrl(null)} className="text-[10px] text-rose-400 hover:underline">remove</button>}
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-white/10">
            <label className="block text-[10px] text-gray-400">Social links</label>
            <div className="flex gap-2">
              <input placeholder="Label (e.g. LinkedIn)" value={socialDraft.label} onChange={(e) => setSocialDraft({ ...socialDraft, label: e.target.value })} className={inputCls} />
              <input placeholder="URL" value={socialDraft.url} onChange={(e) => setSocialDraft({ ...socialDraft, url: e.target.value })} className={inputCls} />
              <button
                onClick={() => { if (socialDraft.url.trim()) { set('socials', [...fields.socials, { label: socialDraft.label.trim(), url: socialDraft.url.trim() }]); setSocialDraft({ label: '', url: '' }); } }}
                className="px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shrink-0"
              >Add</button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {fields.socials.map((s, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-800 border border-white/10 text-[10px] text-slate-200">
                  {s.label || 'Social'}: {s.url}
                  <button onClick={() => set('socials', fields.socials.filter((_, idx) => idx !== i))} className="text-rose-400 hover:text-rose-300">×</button>
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-white/10">
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider">Theme</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(Object.keys(THEMES) as ThemeId[]).map((k) => (
                <button key={k} onClick={() => setTheme(k)} className={`p-2 rounded-xl border text-[11px] font-semibold flex items-center gap-2 ${theme === k ? 'bg-blue-600/30 border-blue-500 text-white' : 'bg-white/[0.02] border-white/10 text-gray-400'}`}>
                  <span className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0" style={{ backgroundColor: THEMES[k].bg }} />
                  <span className="truncate">{THEMES[k].name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10">
            <div>
              <label className="block text-[10px] text-gray-400 mb-1">Card size</label>
              <select value={sizeId} onChange={(e) => setSizeId(e.target.value as SizeId)} className={inputCls}>
                {(Object.keys(SIZES) as SizeId[]).map((k) => <option key={k} value={k}>{SIZES[k].name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-gray-400 mb-1">QR encodes</label>
              <select value={qrTarget} onChange={(e) => setQrTarget(e.target.value as QrTarget)} className={inputCls}>
                <option value="vcard">vCard contact</option>
                <option value="whatsapp">WhatsApp chat</option>
                <option value="phone">Phone (tel:)</option>
                <option value="website">Website</option>
                <option value="none">No QR</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[10px] text-gray-400 mb-1">Cards on A4 sheet (max {nesting.ups})</label>
            <input type="number" min={1} max={nesting.ups} value={copies} onChange={(e) => setCopies(Math.max(1, Math.min(nesting.ups, Number(e.target.value) || 1)))} className={inputCls} />
          </div>
        </div>

        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between text-[10px] text-gray-400">
            <span className="font-mono">{size.name}</span>
            <span className="font-mono">+{BLEED_MM}mm bleed · {nesting.ups}-up on A4</span>
          </div>
          <div className="bg-slate-950/80 border border-white/10 rounded-3xl p-6 backdrop-blur-md flex flex-col items-center gap-6">
            <div className="text-center space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Front</span>
              {front}
            </div>
            <div className="text-center space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Back</span>
              {back}
            </div>
          </div>
          <div className="text-[11px] text-gray-400 bg-white/[0.02] border border-white/10 rounded-xl p-3">
            Print sheet places {copies} card{copies === 1 ? '' : 's'} (alternating front/back) on A4 at exact{' '}
            <span className="text-white font-mono">{mmToPx(cardMm.w, 300)}×{mmToPx(cardMm.h, 300)}px @300 DPI</span> trim with {BLEED_MM}mm bleed and dashed trim guides.
          </div>
        </div>
      </div>
    </div>
  );
};

const Field: React.FC<{ label: string; value: string; onChange: (v: string) => void; cls: string }> = ({ label, value, onChange, cls }) => (
  <div>
    <label className="block text-[10px] text-gray-400 mb-1">{label}</label>
    <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className={cls} />
  </div>
);

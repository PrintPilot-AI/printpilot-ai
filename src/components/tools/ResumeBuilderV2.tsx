import React, { useRef, useState } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  Printer,
  Briefcase,
  GraduationCap,
  Award,
  User,
  Wrench,
  Languages as LangIcon,
  FolderGit2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { openPrintWindow, addStyles, el, validateImageFile, errorMessage } from '../../lib/security';

export interface ResumeData {
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  summary: string;
  cnic: string;
  domicile: string;
  nationality: string;
  visaStatus: string;
  experiences: { id: string; title: string; company: string; dates: string; details: string }[];
  education: { id: string; degree: string; school: string; year: string; score: string }[];
  skills: string[];
  languages: string[];
  projects: { id: string; name: string; link: string; desc: string }[];
  certifications: string[];
  profileImage?: string;
}

type TemplateId = 'ats' | 'professional' | 'creative' | 'regional';

const TEMPLATES: { id: TemplateId; label: string; note: string; accent: string }[] = [
  { id: 'ats', label: 'ATS-Friendly', note: 'Single column, plain', accent: '#2563eb' },
  { id: 'professional', label: 'Executive Pro', note: 'Corporate accent bar', accent: '#0f766e' },
  { id: 'creative', label: 'Modern', note: 'Two-tone header', accent: '#7c3aed' },
  { id: 'regional', label: 'Regional Spec', note: 'CNIC / domicile / visa', accent: '#b45309' },
];

const uid = (p: string) => `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

/** Blank, user-driven starting point — no demo person is pre-filled. */
const emptyResume = (): ResumeData => ({
  fullName: '',
  jobTitle: '',
  email: '',
  phone: '',
  address: '',
  website: '',
  summary: '',
  cnic: '',
  domicile: '',
  nationality: '',
  visaStatus: '',
  experiences: [],
  education: [],
  skills: [],
  languages: [],
  projects: [],
  certifications: [],
});

export const ResumeBuilderV2: React.FC = () => {
  const { savePrintJob } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [template, setTemplate] = useState<TemplateId>('ats');
  const [data, setData] = useState<ResumeData>(emptyResume);
  const [skillDraft, setSkillDraft] = useState('');
  const [langDraft, setLangDraft] = useState('');
  const [certDraft, setCertDraft] = useState('');
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof ResumeData>(key: K, value: ResumeData[K]) => setData((d) => ({ ...d, [key]: value }));
  const accent = TEMPLATES.find((t) => t.id === template)!.accent;

  const onImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const verr = validateImageFile(file, 5);
    if (verr) { setError(verr); return; }
    setError(null);
    const reader = new FileReader();
    reader.onload = () => set('profileImage', reader.result as string);
    reader.onerror = () => setError(errorMessage(new Error('Could not read that image.')));
    reader.readAsDataURL(file);
  };

  const addToList = (key: 'skills' | 'languages' | 'certifications', draft: string, clear: () => void) => {
    const v = draft.trim();
    if (!v) return;
    set(key, [...data[key], v]);
    clear();
  };

  const handlePrint = () => {
    if (!data.fullName.trim()) { setError('Add at least a full name before exporting.'); return; }
    setError(null);
    savePrintJob({
      title: `Resume: ${data.fullName} (${template.toUpperCase()})`,
      toolType: 'Resume',
      status: 'Ready',
      summary: `Print-optimised A4 resume for ${data.jobTitle || 'candidate'}.`,
    });

    const ok = openPrintWindow(`${data.fullName} — Resume`, (doc) => {
      addStyles(doc, `
        @page { size: A4 portrait; margin: 14mm; }
        * { box-sizing: border-box; }
        body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1e293b; line-height: 1.45; margin: 0; }
        .hdr { border-bottom: 3px solid ${accent}; padding-bottom: 10px; margin-bottom: 14px; ${template === 'creative' ? 'display:flex;gap:14px;align-items:center;' : 'text-align:center;'} }
        .hdr img { width: 64px; height: 64px; border-radius: 50%; object-fit: cover; }
        h1 { margin: 0; font-size: 23px; color: #0f172a; letter-spacing: .3px; }
        h2 { margin: 3px 0 0; font-size: 13px; color: ${accent}; font-weight: 600; }
        .contact { font-size: 10px; color: #64748b; margin-top: 6px; }
        .sect { font-size: 12px; font-weight: 700; text-transform: uppercase; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 3px; margin: 14px 0 7px; letter-spacing: .4px; }
        .it { margin-bottom: 9px; }
        .it .t { font-size: 12px; font-weight: 700; color: #0f172a; }
        .it .s { font-size: 11px; color: ${accent}; font-weight: 600; }
        .it .d { font-size: 10px; color: #64748b; float: right; }
        .desc { font-size: 10.5px; color: #334155; margin: 2px 0 0; white-space: pre-wrap; }
        .pills { display: flex; flex-wrap: wrap; gap: 4px; }
        .pill { background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 4px; padding: 2px 7px; font-size: 9.5px; color: #334155; }
        .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; font-size: 10px; background: #f8fafc; padding: 8px; border: 1px solid #e2e8f0; border-radius: 6px; margin-top: 8px; }
      `);
      const body = doc.body;

      const hdr = el(doc, 'div', { className: 'hdr' });
      if (data.profileImage) {
        const img = doc.createElement('img');
        img.src = data.profileImage;
        img.alt = '';
        hdr.appendChild(img);
      }
      const hdrText = el(doc, 'div');
      hdrText.appendChild(el(doc, 'h1', { text: data.fullName }));
      if (data.jobTitle) hdrText.appendChild(el(doc, 'h2', { text: data.jobTitle }));
      const contacts = [data.email, data.phone, data.address, data.website].filter(Boolean).join('  •  ');
      if (contacts) hdrText.appendChild(el(doc, 'div', { className: 'contact', text: contacts }));
      hdr.appendChild(hdrText);
      body.appendChild(hdr);

      if (template === 'regional') {
        const meta = el(doc, 'div', { className: 'meta' });
        const rows: [string, string][] = [['CNIC', data.cnic], ['Domicile', data.domicile], ['Nationality', data.nationality], ['Visa Status', data.visaStatus]];
        rows.filter(([, v]) => v).forEach(([k, v]) => {
          const cell = el(doc, 'div');
          cell.appendChild(el(doc, 'strong', { text: `${k}: ` }));
          cell.appendChild(doc.createTextNode(v));
          meta.appendChild(cell);
        });
        if (meta.children.length) body.appendChild(meta);
      }

      const section = (title: string) => { const s = el(doc, 'div', { className: 'sect', text: title }); body.appendChild(s); return s; };

      if (data.summary.trim()) { section('Professional Summary'); body.appendChild(el(doc, 'p', { className: 'desc', text: data.summary })); }

      if (data.experiences.length) {
        section('Work Experience');
        data.experiences.forEach((x) => {
          const it = el(doc, 'div', { className: 'it' });
          if (x.dates) it.appendChild(el(doc, 'span', { className: 'd', text: x.dates }));
          it.appendChild(el(doc, 'div', { className: 't', text: x.title }));
          if (x.company) it.appendChild(el(doc, 'div', { className: 's', text: x.company }));
          if (x.details) it.appendChild(el(doc, 'p', { className: 'desc', text: x.details }));
          body.appendChild(it);
        });
      }

      if (data.education.length) {
        section('Education');
        data.education.forEach((x) => {
          const it = el(doc, 'div', { className: 'it' });
          if (x.year) it.appendChild(el(doc, 'span', { className: 'd', text: x.year }));
          it.appendChild(el(doc, 'div', { className: 't', text: x.degree }));
          const sub = [x.school, x.score].filter(Boolean).join(' — ');
          if (sub) it.appendChild(el(doc, 'div', { className: 's', text: sub }));
          body.appendChild(it);
        });
      }

      if (data.skills.length) {
        section('Core Skills');
        const pills = el(doc, 'div', { className: 'pills' });
        data.skills.forEach((s) => pills.appendChild(el(doc, 'span', { className: 'pill', text: s })));
        body.appendChild(pills);
      }

      if (data.projects.length) {
        section('Projects');
        data.projects.forEach((p) => {
          const it = el(doc, 'div', { className: 'it' });
          it.appendChild(el(doc, 'div', { className: 't', text: p.name }));
          if (p.link) it.appendChild(el(doc, 'div', { className: 's', text: p.link }));
          if (p.desc) it.appendChild(el(doc, 'p', { className: 'desc', text: p.desc }));
          body.appendChild(it);
        });
      }

      if (data.languages.length) {
        section('Languages');
        const pills = el(doc, 'div', { className: 'pills' });
        data.languages.forEach((s) => pills.appendChild(el(doc, 'span', { className: 'pill', text: s })));
        body.appendChild(pills);
      }

      if (data.certifications.length) {
        section('Certifications');
        const pills = el(doc, 'div', { className: 'pills' });
        data.certifications.forEach((s) => pills.appendChild(el(doc, 'span', { className: 'pill', text: s })));
        body.appendChild(pills);
      }
    });
    if (!ok) setError('Popup blocked — allow popups to print or save as PDF.');
  };

  const inputCls = 'w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-blue-500';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-semibold px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 mb-1">
            <FileText className="w-3.5 h-3.5 text-blue-400" />
            <span>Deterministic layout engine · print-optimised</span>
          </div>
          <h2 className="text-2xl font-bold text-white">Resume Builder V2</h2>
          <p className="text-xs text-gray-400">Fill in your own details — live A4 preview and safe print/PDF export. No demo content, no AI guessing.</p>
        </div>
        <button onClick={handlePrint} className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center space-x-2 active:scale-95">
          <Printer className="w-4 h-4" />
          <span>Print / Save as PDF</span>
        </button>
      </div>

      {error && <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold">{error}</div>}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {TEMPLATES.map((t) => (
          <button key={t.id} onClick={() => setTemplate(t.id)} className={`p-3 rounded-xl border text-left transition-all ${template === t.id ? 'bg-blue-600 border-blue-500 text-white font-bold shadow-md' : 'bg-white/[0.03] border-white/10 text-gray-300 hover:bg-white/[0.06]'}`}>
            <span className="block text-xs font-bold">{t.label}</span>
            <span className="block text-[10px] text-blue-300 font-mono mt-0.5">{t.note}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 space-y-5 bg-white/[0.03] border border-white/10 rounded-3xl p-5 backdrop-blur-md max-h-[640px] overflow-y-auto pr-2">
          {/* Contact */}
          <div className="space-y-3">
            <SectionHead icon={User} label="Contact & Personal" />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Full Name" value={data.fullName} onChange={(v) => set('fullName', v)} cls={inputCls} />
              <Field label="Job Title" value={data.jobTitle} onChange={(v) => set('jobTitle', v)} cls={inputCls} />
              <Field label="Email" value={data.email} onChange={(v) => set('email', v)} cls={inputCls} />
              <Field label="Phone" value={data.phone} onChange={(v) => set('phone', v)} cls={inputCls} />
              <Field label="Address" value={data.address} onChange={(v) => set('address', v)} cls={inputCls} />
              <Field label="Website / LinkedIn" value={data.website} onChange={(v) => set('website', v)} cls={inputCls} />
            </div>
            <div>
              <label className="block text-[10px] text-gray-400 mb-1">Profile Photo (optional)</label>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={onImage} className="text-[11px] text-gray-400" />
              {data.profileImage && <button onClick={() => set('profileImage', undefined)} className="ml-2 text-[10px] text-rose-400 hover:underline">remove</button>}
            </div>
            <div>
              <label className="block text-[10px] text-gray-400 mb-1">Professional Summary</label>
              <textarea rows={3} value={data.summary} onChange={(e) => set('summary', e.target.value)} className={inputCls} />
            </div>
            {template === 'regional' && (
              <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                <Field label="CNIC / ID" value={data.cnic} onChange={(v) => set('cnic', v)} cls={inputCls} />
                <Field label="Domicile" value={data.domicile} onChange={(v) => set('domicile', v)} cls={inputCls} />
                <Field label="Nationality" value={data.nationality} onChange={(v) => set('nationality', v)} cls={inputCls} />
                <Field label="Visa Status" value={data.visaStatus} onChange={(v) => set('visaStatus', v)} cls={inputCls} />
              </div>
            )}
          </div>

          {/* Experience */}
          <ListSection icon={Briefcase} label="Work Experience" onAdd={() => set('experiences', [...data.experiences, { id: uid('exp'), title: '', company: '', dates: '', details: '' }])}>
            {data.experiences.map((exp, idx) => (
              <Card key={exp.id} onRemove={() => set('experiences', data.experiences.filter((e) => e.id !== exp.id))}>
                <div className="grid grid-cols-2 gap-2">
                  <input placeholder="Job title" value={exp.title} onChange={(e) => { const u = [...data.experiences]; u[idx].title = e.target.value; set('experiences', u); }} className={inputCls} />
                  <input placeholder="Company" value={exp.company} onChange={(e) => { const u = [...data.experiences]; u[idx].company = e.target.value; set('experiences', u); }} className={inputCls} />
                </div>
                <input placeholder="Dates (e.g. 2021 – Present)" value={exp.dates} onChange={(e) => { const u = [...data.experiences]; u[idx].dates = e.target.value; set('experiences', u); }} className={inputCls} />
                <textarea rows={2} placeholder="Responsibilities & achievements" value={exp.details} onChange={(e) => { const u = [...data.experiences]; u[idx].details = e.target.value; set('experiences', u); }} className={inputCls} />
              </Card>
            ))}
          </ListSection>

          {/* Education */}
          <ListSection icon={GraduationCap} label="Education" onAdd={() => set('education', [...data.education, { id: uid('edu'), degree: '', school: '', year: '', score: '' }])}>
            {data.education.map((ed, idx) => (
              <Card key={ed.id} onRemove={() => set('education', data.education.filter((e) => e.id !== ed.id))}>
                <input placeholder="Degree / qualification" value={ed.degree} onChange={(e) => { const u = [...data.education]; u[idx].degree = e.target.value; set('education', u); }} className={inputCls} />
                <div className="grid grid-cols-2 gap-2">
                  <input placeholder="School" value={ed.school} onChange={(e) => { const u = [...data.education]; u[idx].school = e.target.value; set('education', u); }} className={inputCls} />
                  <input placeholder="Year" value={ed.year} onChange={(e) => { const u = [...data.education]; u[idx].year = e.target.value; set('education', u); }} className={inputCls} />
                </div>
                <input placeholder="Score / grade (optional)" value={ed.score} onChange={(e) => { const u = [...data.education]; u[idx].score = e.target.value; set('education', u); }} className={inputCls} />
              </Card>
            ))}
          </ListSection>

          {/* Projects */}
          <ListSection icon={FolderGit2} label="Projects" onAdd={() => set('projects', [...data.projects, { id: uid('proj'), name: '', link: '', desc: '' }])}>
            {data.projects.map((p, idx) => (
              <Card key={p.id} onRemove={() => set('projects', data.projects.filter((x) => x.id !== p.id))}>
                <div className="grid grid-cols-2 gap-2">
                  <input placeholder="Project name" value={p.name} onChange={(e) => { const u = [...data.projects]; u[idx].name = e.target.value; set('projects', u); }} className={inputCls} />
                  <input placeholder="Link (optional)" value={p.link} onChange={(e) => { const u = [...data.projects]; u[idx].link = e.target.value; set('projects', u); }} className={inputCls} />
                </div>
                <textarea rows={2} placeholder="Description" value={p.desc} onChange={(e) => { const u = [...data.projects]; u[idx].desc = e.target.value; set('projects', u); }} className={inputCls} />
              </Card>
            ))}
          </ListSection>

          {/* Tag lists */}
          <TagEditor icon={Wrench} label="Skills" items={data.skills} draft={skillDraft} setDraft={setSkillDraft} onAdd={() => addToList('skills', skillDraft, () => setSkillDraft(''))} onRemove={(i) => set('skills', data.skills.filter((_, idx) => idx !== i))} />
          <TagEditor icon={LangIcon} label="Languages" items={data.languages} draft={langDraft} setDraft={setLangDraft} onAdd={() => addToList('languages', langDraft, () => setLangDraft(''))} onRemove={(i) => set('languages', data.languages.filter((_, idx) => idx !== i))} />
          <TagEditor icon={Award} label="Certifications" items={data.certifications} draft={certDraft} setDraft={setCertDraft} onAdd={() => addToList('certifications', certDraft, () => setCertDraft(''))} onRemove={(i) => set('certifications', data.certifications.filter((_, idx) => idx !== i))} />
        </div>

        {/* Live preview */}
        <div className="lg:col-span-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">Live A4 Preview</span>
            <span className="text-[10px] text-blue-300 font-mono">210 × 297 mm</span>
          </div>
          <div className="bg-white rounded-2xl p-7 text-slate-900 shadow-2xl border border-gray-300 min-h-[560px] max-h-[640px] overflow-y-auto font-sans" style={{ aspectRatio: '210 / 297' }}>
            <div className={`pb-3 mb-4 ${template === 'creative' ? 'flex items-center gap-3' : 'text-center'}`} style={{ borderBottom: `3px solid ${accent}` }}>
              {data.profileImage && <img src={data.profileImage} alt="" className="w-14 h-14 rounded-full object-cover" />}
              <div>
                <h1 className="text-xl font-bold text-slate-900 leading-tight">{data.fullName || 'Your Name'}</h1>
                {data.jobTitle && <h2 className="text-xs font-semibold mt-0.5" style={{ color: accent }}>{data.jobTitle}</h2>}
                <p className="text-[10px] text-slate-500 mt-1">{[data.email, data.phone, data.address, data.website].filter(Boolean).join('  •  ') || 'your@email.com • phone • location'}</p>
              </div>
            </div>

            {template === 'regional' && (data.cnic || data.domicile || data.nationality || data.visaStatus) && (
              <div className="grid grid-cols-2 gap-1 bg-slate-50 border border-slate-200 rounded p-2 text-[9.5px] text-slate-700 mb-3">
                {data.cnic && <div><strong>CNIC:</strong> {data.cnic}</div>}
                {data.domicile && <div><strong>Domicile:</strong> {data.domicile}</div>}
                {data.nationality && <div><strong>Nationality:</strong> {data.nationality}</div>}
                {data.visaStatus && <div><strong>Visa:</strong> {data.visaStatus}</div>}
              </div>
            )}

            {data.summary && <PreviewSection title="Professional Summary"><p className="text-[11px] text-slate-700 whitespace-pre-wrap">{data.summary}</p></PreviewSection>}

            {data.experiences.length > 0 && (
              <PreviewSection title="Work Experience">
                {data.experiences.map((x) => (
                  <div key={x.id} className="mb-2 text-[11px]">
                    <div className="flex justify-between"><span className="font-bold text-slate-900">{x.title || 'Role'}</span><span className="text-slate-500 text-[10px]">{x.dates}</span></div>
                    {x.company && <div className="font-medium text-[10.5px]" style={{ color: accent }}>{x.company}</div>}
                    {x.details && <p className="text-slate-600 text-[10.5px] mt-0.5 whitespace-pre-wrap">{x.details}</p>}
                  </div>
                ))}
              </PreviewSection>
            )}

            {data.education.length > 0 && (
              <PreviewSection title="Education">
                {data.education.map((x) => (
                  <div key={x.id} className="mb-1.5 text-[11px]">
                    <div className="flex justify-between"><span className="font-bold text-slate-900">{x.degree || 'Degree'}</span><span className="text-slate-500 text-[10px]">{x.year}</span></div>
                    {(x.school || x.score) && <div className="font-medium text-[10.5px]" style={{ color: accent }}>{[x.school, x.score].filter(Boolean).join(' — ')}</div>}
                  </div>
                ))}
              </PreviewSection>
            )}

            {data.skills.length > 0 && <PreviewSection title="Core Skills"><Pills items={data.skills} /></PreviewSection>}
            {data.projects.length > 0 && (
              <PreviewSection title="Projects">
                {data.projects.map((p) => (
                  <div key={p.id} className="mb-1.5 text-[11px]">
                    <span className="font-bold text-slate-900">{p.name}</span>
                    {p.link && <span className="text-[10px] ml-1" style={{ color: accent }}>{p.link}</span>}
                    {p.desc && <p className="text-slate-600 text-[10.5px]">{p.desc}</p>}
                  </div>
                ))}
              </PreviewSection>
            )}
            {data.languages.length > 0 && <PreviewSection title="Languages"><Pills items={data.languages} /></PreviewSection>}
            {data.certifications.length > 0 && <PreviewSection title="Certifications"><Pills items={data.certifications} /></PreviewSection>}
          </div>
        </div>
      </div>
    </div>
  );
};

const Pills: React.FC<{ items: string[] }> = ({ items }) => (
  <div className="flex flex-wrap gap-1">
    {items.map((s, i) => <span key={i} className="px-2 py-0.5 rounded bg-slate-100 border border-slate-300 text-[9.5px] font-medium text-slate-800">{s}</span>)}
  </div>
);

const PreviewSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-3">
    <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-1.5">{title}</h3>
    {children}
  </div>
);

const SectionHead: React.FC<{ icon: React.ElementType; label: string }> = ({ icon: Icon, label }) => (
  <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center space-x-1.5">
    <Icon className="w-4 h-4" /><span>{label}</span>
  </h3>
);

const Field: React.FC<{ label: string; value: string; onChange: (v: string) => void; cls: string }> = ({ label, value, onChange, cls }) => (
  <div>
    <label className="block text-[10px] text-gray-400 mb-1">{label}</label>
    <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className={cls} />
  </div>
);

const Card: React.FC<{ onRemove: () => void; children: React.ReactNode }> = ({ onRemove, children }) => (
  <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2 relative">
    <button onClick={onRemove} className="absolute top-2 right-2 p-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400"><Trash2 className="w-3.5 h-3.5" /></button>
    {children}
  </div>
);

const ListSection: React.FC<{ icon: React.ElementType; label: string; onAdd: () => void; children: React.ReactNode }> = ({ icon, label, onAdd, children }) => {
  const Icon = icon;
  return (
    <div className="space-y-2 pt-3 border-t border-white/10">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center space-x-1.5"><Icon className="w-4 h-4" /><span>{label}</span></h3>
        <button onClick={onAdd} className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold flex items-center space-x-1"><Plus className="w-3 h-3" /><span>Add</span></button>
      </div>
      {children}
    </div>
  );
};

const TagEditor: React.FC<{ icon: React.ElementType; label: string; items: string[]; draft: string; setDraft: (v: string) => void; onAdd: () => void; onRemove: (i: number) => void }> = ({ icon, label, items, draft, setDraft, onAdd, onRemove }) => {
  const Icon = icon;
  return (
    <div className="space-y-2 pt-3 border-t border-white/10">
      <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center space-x-1.5"><Icon className="w-4 h-4" /><span>{label}</span></h3>
      <div className="flex gap-2">
        <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onAdd(); } }} placeholder={`Add ${label.toLowerCase()}…`} className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-blue-500" />
        <button onClick={onAdd} className="px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white"><Plus className="w-4 h-4" /></button>
      </div>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {items.map((s, i) => (
            <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-800 border border-white/10 text-[10px] text-slate-200">
              {s}<button onClick={() => onRemove(i)} className="text-rose-400 hover:text-rose-300"><Trash2 className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

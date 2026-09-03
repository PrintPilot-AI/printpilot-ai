import React, { useState, useRef } from 'react';
import { 
  FileText, 
  Sparkles, 
  Plus, 
  Trash2, 
  Download, 
  Printer, 
  Eye, 
  Check, 
  Briefcase, 
  GraduationCap, 
  Award, 
  Globe, 
  User, 
  QrCode,
  PenTool,
  Upload
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export interface ResumeData {
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  summary: string;
  // Regional specific fields
  cnic?: string;
  domicile?: string;
  nationality?: string;
  visaStatus?: string;
  passportNo?: string;
  // Sections
  experiences: { id: string; title: string; company: string; dates: string; details: string }[];
  education: { id: string; degree: string; school: string; year: string; score: string }[];
  skills: string[];
  languages: string[];
  projects: { id: string; name: string; link: string; desc: string }[];
  certifications: string[];
  profileImage?: string;
  signatureUrl?: string;
}

export const ResumeBuilderV2: React.FC = () => {
  const { savePrintJob } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [template, setTemplate] = useState<'ats' | 'professional' | 'creative' | 'pakistani' | 'gulf' | 'europass'>('ats');

  const [resumeData, setResumeData] = useState<ResumeData>({
    fullName: 'Muhammad Ali Khan',
    jobTitle: 'Senior Full-Stack Engineer & AI Product Lead',
    email: 'm.ali.khan@example.com',
    phone: '+92 300 1234567',
    address: 'Gulberg III, Lahore, Pakistan',
    website: 'https://linkedin.com/in/malikhan-demo',
    summary: 'Results-driven Senior Software Engineer with 7+ years of experience crafting high-throughput web applications, cloud architectures, and machine learning pre-press engines.',
    cnic: '35202-1234567-1',
    domicile: 'Lahore (Punjab)',
    nationality: 'Pakistani',
    visaStatus: 'Residence / Work Permit Eligible',
    passportNo: 'PK9821034',
    experiences: [
      {
        id: 'exp-1',
        title: 'Lead Software Architect',
        company: 'Apex Digital Printing Systems',
        dates: '2023 - Present',
        details: 'Architected automated pre-flight PDF auditing pipeline serving 10,000+ daily press operators with 99.8% uptime.'
      },
      {
        id: 'exp-2',
        title: 'Senior Frontend Engineer',
        company: 'CloudPress Global',
        dates: '2020 - 2023',
        details: 'Developed real-time 300 DPI canvas engines, SVG color separator tool, and automated RIP job scheduler.'
      }
    ],
    education: [
      {
        id: 'edu-1',
        degree: 'BS Computer Science (First Class Honors)',
        school: 'FAST-NUCES Lahore',
        year: '2016 - 2020',
        score: 'CGPA 3.82/4.0'
      }
    ],
    skills: ['TypeScript', 'React.js', 'Node.js / Express', 'Tailwind CSS', 'Docker & Kubernetes', 'Vector SVG Processing', 'CMYK Pre-press RIP'],
    languages: ['English (Fluent)', 'Urdu (Native)', 'Arabic (Basic)'],
    projects: [
      {
        id: 'proj-1',
        name: 'PrintPilot AI Engine',
        link: 'https://printpilot.ai',
        desc: 'AI-driven commercial pre-press audit and press defect diagnosis platform.'
      }
    ],
    certifications: ['AWS Certified Solutions Architect - Associate', 'Google Cloud Professional Developer']
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setResumeData((prev) => ({ ...prev, profileImage: event.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePrint = () => {
    savePrintJob({
      title: `Resume PDF: ${resumeData.fullName} (${template.toUpperCase()} Template)`,
      toolType: 'Resume',
      status: 'Ready',
      summary: `Generated 300 DPI ATS-optimized printable resume layout for ${resumeData.jobTitle}.`
    });

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${resumeData.fullName} - Resume</title>
          <style>
            @page { size: A4 portrait; margin: 12mm; }
            body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1e293b; line-height: 1.5; margin: 0; padding: 0; }
            .header { text-align: ${template === 'creative' ? 'left' : 'center'}; border-b: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 16px; }
            .header h1 { margin: 0; font-size: 24px; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; }
            .header h2 { margin: 4px 0 0 0; font-size: 14px; color: #2563eb; font-weight: 600; }
            .contact-line { font-size: 10px; color: #64748b; margin-top: 6px; }
            .section-title { font-size: 13px; font-weight: bold; text-transform: uppercase; color: #1e293b; border-bottom: 1px solid #cbd5e1; padding-bottom: 3px; margin-top: 14px; margin-bottom: 8px; letter-spacing: 0.5px; }
            .item-title { font-size: 12px; font-weight: bold; color: #0f172a; }
            .item-sub { font-size: 11px; color: #2563eb; font-weight: 600; }
            .item-dates { font-size: 10px; color: #64748b; float: right; font-weight: normal; }
            .desc { font-size: 10.5px; color: #334155; margin-top: 2px; }
            .pills { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; }
            .pill { background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 4px; padding: 2px 6px; font-size: 9.5px; color: #334155; font-weight: 500; }
            .meta-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; font-size: 10px; background: #f8fafc; padding: 8px; border-radius: 6px; border: 1px solid #e2e8f0; margin-top: 8px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${resumeData.fullName}</h1>
            <h2>${resumeData.jobTitle}</h2>
            <div class="contact-line">
              ${resumeData.email} • ${resumeData.phone} • ${resumeData.address} ${resumeData.website ? `• ${resumeData.website}` : ''}
            </div>
            ${(template === 'pakistani' || template === 'gulf') ? `
              <div class="meta-grid">
                ${resumeData.cnic ? `<div><strong>CNIC:</strong> ${resumeData.cnic}</div>` : ''}
                ${resumeData.domicile ? `<div><strong>Domicile:</strong> ${resumeData.domicile}</div>` : ''}
                ${resumeData.nationality ? `<div><strong>Nationality:</strong> ${resumeData.nationality}</div>` : ''}
                ${resumeData.visaStatus ? `<div><strong>Visa Status:</strong> ${resumeData.visaStatus}</div>` : ''}
              </div>
            ` : ''}
          </div>

          <div class="section-title">Professional Executive Summary</div>
          <p class="desc">${resumeData.summary}</p>

          <div class="section-title">Work Experience</div>
          ${resumeData.experiences.map((exp) => `
            <div style="margin-bottom: 10px;">
              <span class="item-dates">${exp.dates}</span>
              <div class="item-title">${exp.title}</div>
              <div class="item-sub">${exp.company}</div>
              <p class="desc">${exp.details}</p>
            </div>
          `).join('')}

          <div class="section-title">Education & Qualifications</div>
          ${resumeData.education.map((edu) => `
            <div style="margin-bottom: 8px;">
              <span class="item-dates">${edu.year}</span>
              <div class="item-title">${edu.degree}</div>
              <div class="item-sub">${edu.school} (${edu.score})</div>
            </div>
          `).join('')}

          <div class="section-title">Core Skills & Competencies</div>
          <div class="pills">
            ${resumeData.skills.map((s) => `<span class="pill">${s}</span>`).join('')}
          </div>

          ${resumeData.projects.length ? `
            <div class="section-title">Key Projects</div>
            ${resumeData.projects.map((p) => `
              <div style="margin-bottom: 6px;">
                <div class="item-title">${p.name} <span style="font-size: 9px; font-weight: normal; color: #2563eb;">(${p.link})</span></div>
                <p class="desc">${p.desc}</p>
              </div>
            `).join('')}
          ` : ''}

          <script>
            window.onload = function() { window.print(); };
          </script>
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
            <span>AI ATS & Regional Print Template Engine</span>
          </div>
          <h2 className="text-2xl font-bold text-white">AI Resume Builder V2</h2>
          <p className="text-xs text-gray-400">Build ATS-friendly, Pakistani, Gulf & Europass print-ready resumes with 300 DPI vector layout.</p>
        </div>

        <button
          onClick={handlePrint}
          className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center space-x-2 active:scale-95"
        >
          <Printer className="w-4 h-4" />
          <span>Export 300 DPI PDF Resume</span>
        </button>
      </div>

      {/* Template Chooser Bar */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider">Select Resume Design Template</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {[
            { id: 'ats', label: 'ATS-Friendly', note: 'Global 1-Column' },
            { id: 'professional', label: 'Executive Pro', note: 'Corporate Accent' },
            { id: 'creative', label: 'Modern 2-Col', note: 'Sidebar Layout' },
            { id: 'pakistani', label: 'Pakistani Spec', note: 'CNIC & Domicile' },
            { id: 'gulf', label: 'Gulf / UAE Spec', note: 'Visa & Passport' },
            { id: 'europass', label: 'Europass Style', note: 'European Standard' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTemplate(t.id as any)}
              className={`p-3 rounded-xl border text-left transition-all ${
                template === t.id 
                  ? 'bg-blue-600 border-blue-500 text-white font-bold shadow-md' 
                  : 'bg-white/[0.03] border-white/10 text-gray-300 hover:bg-white/[0.06]'
              }`}
            >
              <span className="block text-xs font-bold">{t.label}</span>
              <span className="block text-[10px] text-blue-300 font-mono mt-0.5">{t.note}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Form Inputs vs Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Form Editor */}
        <div className="lg:col-span-6 space-y-5 bg-white/[0.03] border border-white/10 rounded-3xl p-5 backdrop-blur-md max-h-[600px] overflow-y-auto pr-2">
          
          {/* Section: Personal Info */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center space-x-1.5">
              <User className="w-4 h-4" />
              <span>1. Contact & Personal Details</span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-gray-400 mb-1">Full Name</label>
                <input
                  type="text"
                  value={resumeData.fullName}
                  onChange={(e) => setResumeData({ ...resumeData, fullName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 mb-1">Job Title</label>
                <input
                  type="text"
                  value={resumeData.jobTitle}
                  onChange={(e) => setResumeData({ ...resumeData, jobTitle: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-gray-400 mb-1">Email</label>
                <input
                  type="email"
                  value={resumeData.email}
                  onChange={(e) => setResumeData({ ...resumeData, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 mb-1">Phone</label>
                <input
                  type="text"
                  value={resumeData.phone}
                  onChange={(e) => setResumeData({ ...resumeData, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-gray-400 mb-1">Address / Location</label>
              <input
                type="text"
                value={resumeData.address}
                onChange={(e) => setResumeData({ ...resumeData, address: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Regional Fields */}
            {(template === 'pakistani' || template === 'gulf') && (
              <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                <div>
                  <label className="block text-[10px] text-blue-300 font-bold mb-1">CNIC / ID Number</label>
                  <input
                    type="text"
                    value={resumeData.cnic || ''}
                    onChange={(e) => setResumeData({ ...resumeData, cnic: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-blue-300 font-bold mb-1">Domicile / City</label>
                  <input
                    type="text"
                    value={resumeData.domicile || ''}
                    onChange={(e) => setResumeData({ ...resumeData, domicile: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-blue-300 font-bold mb-1">Nationality</label>
                  <input
                    type="text"
                    value={resumeData.nationality || ''}
                    onChange={(e) => setResumeData({ ...resumeData, nationality: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-blue-300 font-bold mb-1">Visa Status</label>
                  <input
                    type="text"
                    value={resumeData.visaStatus || ''}
                    onChange={(e) => setResumeData({ ...resumeData, visaStatus: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-white"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] text-gray-400 mb-1">Executive Summary</label>
              <textarea
                rows={3}
                value={resumeData.summary}
                onChange={(e) => setResumeData({ ...resumeData, summary: e.target.value })}
                className="w-full p-3 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Section: Work Experience */}
          <div className="space-y-3 pt-3 border-t border-white/10">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center space-x-1.5">
                <Briefcase className="w-4 h-4" />
                <span>2. Work Experience</span>
              </h3>
            </div>

            {resumeData.experiences.map((exp, idx) => (
              <div key={exp.id} className="p-3 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={exp.title}
                    placeholder="Job Title"
                    onChange={(e) => {
                      const updated = [...resumeData.experiences];
                      updated[idx].title = e.target.value;
                      setResumeData({ ...resumeData, experiences: updated });
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-white/10 text-xs text-white"
                  />
                  <input
                    type="text"
                    value={exp.company}
                    placeholder="Company Name"
                    onChange={(e) => {
                      const updated = [...resumeData.experiences];
                      updated[idx].company = e.target.value;
                      setResumeData({ ...resumeData, experiences: updated });
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-white/10 text-xs text-white"
                  />
                </div>
                <input
                  type="text"
                  value={exp.dates}
                  placeholder="Dates (e.g. 2021 - Present)"
                  onChange={(e) => {
                    const updated = [...resumeData.experiences];
                    updated[idx].dates = e.target.value;
                    setResumeData({ ...resumeData, experiences: updated });
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-white/10 text-xs text-white"
                />
                <textarea
                  rows={2}
                  value={exp.details}
                  placeholder="Key Responsibilities & Achievements"
                  onChange={(e) => {
                    const updated = [...resumeData.experiences];
                    updated[idx].details = e.target.value;
                    setResumeData({ ...resumeData, experiences: updated });
                  }}
                  className="w-full p-2.5 rounded-lg bg-slate-950 border border-white/10 text-xs text-white"
                />
              </div>
            ))}
          </div>

        </div>

        {/* Right Live Preview Box */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">Live A4 Print Sheet Preview</span>
            <span className="text-[10px] text-blue-300 font-mono">300 DPI Vector Typography</span>
          </div>

          <div className="bg-white rounded-2xl p-6 text-slate-900 shadow-2xl border border-gray-300 min-h-[560px] font-sans space-y-4 max-h-[600px] overflow-y-auto">
            {/* Header */}
            <div className="border-b-2 border-blue-600 pb-3 text-center">
              <h1 className="text-xl font-bold uppercase tracking-wider text-slate-900">{resumeData.fullName}</h1>
              <h2 className="text-xs font-semibold text-blue-600 mt-0.5">{resumeData.jobTitle}</h2>
              <p className="text-[10px] text-slate-500 mt-1">
                {resumeData.email} • {resumeData.phone} • {resumeData.address}
              </p>

              {(template === 'pakistani' || template === 'gulf') && (
                <div className="mt-2 grid grid-cols-2 gap-1 bg-slate-100 p-2 rounded text-[9.5px] text-slate-700 font-mono text-left">
                  {resumeData.cnic && <div><strong>CNIC:</strong> {resumeData.cnic}</div>}
                  {resumeData.domicile && <div><strong>Domicile:</strong> {resumeData.domicile}</div>}
                  {resumeData.nationality && <div><strong>Nationality:</strong> {resumeData.nationality}</div>}
                  {resumeData.visaStatus && <div><strong>Visa:</strong> {resumeData.visaStatus}</div>}
                </div>
              )}
            </div>

            {/* Summary */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b pb-0.5 mb-1">Executive Summary</h3>
              <p className="text-[11px] text-slate-700 leading-normal">{resumeData.summary}</p>
            </div>

            {/* Experience */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b pb-0.5 mb-2">Work Experience</h3>
              <div className="space-y-2">
                {resumeData.experiences.map((exp) => (
                  <div key={exp.id} className="text-[11px]">
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>{exp.title}</span>
                      <span className="text-slate-500 text-[10px] font-normal">{exp.dates}</span>
                    </div>
                    <div className="text-blue-600 font-medium text-[10.5px]">{exp.company}</div>
                    <p className="text-slate-600 text-[10.5px] mt-0.5">{exp.details}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Skills */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b pb-0.5 mb-1.5">Core Competencies</h3>
              <div className="flex flex-wrap gap-1">
                {resumeData.skills.map((skill, i) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-slate-100 border border-slate-300 text-[9.5px] font-medium text-slate-800">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

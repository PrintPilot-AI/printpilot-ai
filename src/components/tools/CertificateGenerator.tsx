import React, { useState } from 'react';
import { 
  Award, 
  Sparkles, 
  Printer, 
  Check, 
  GraduationCap, 
  FileText, 
  ShieldCheck, 
  Star 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export interface CertificateData {
  certType: 'achievement' | 'completion' | 'appreciation' | 'course' | 'workshop' | 'participation';
  recipientName: string;
  courseTitle: string;
  organizationName: string;
  issuerName: string;
  issuerTitle: string;
  issueDate: string;
  certificateId: string;
  styleTheme: 'gold-classic' | 'royal-blue' | 'emerald-luxury' | 'modern-minimal';
}

export const CertificateGenerator: React.FC = () => {
  const { savePrintJob } = useAuth();

  const [certData, setCertData] = useState<CertificateData>({
    certType: 'completion',
    recipientName: 'Muhammad Hamza Khan',
    courseTitle: 'Advanced Commercial Pre-press & Color Management Masterclass',
    organizationName: 'Apex Printing & Media Academy',
    issuerName: 'Dr. Sarah Jenkins',
    issuerTitle: 'Chief Director of Press Operations',
    issueDate: '2026-03-20',
    certificateId: 'CERT-2026-9901X',
    styleTheme: 'gold-classic',
  });

  const handlePrint = () => {
    savePrintJob({
      title: `Certificate: ${certData.recipientName} (${certData.certType.toUpperCase()})`,
      toolType: 'Certificate',
      status: 'Ready',
      summary: `High-resolution 300 DPI vector award certificate formatted for A4 landscape press printing.`
    });

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${certData.recipientName} - Award Certificate</title>
          <style>
            @page { size: A4 landscape; margin: 10mm; }
            body { font-family: 'Georgia', serif; background: #fff; padding: 0; margin: 0; color: #1e293b; }
            .cert-box {
              border: 12px double #b45309;
              padding: 15mm;
              text-align: center;
              box-sizing: border-box;
              height: 190mm;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              background: #fff8f1;
            }
            .org { font-size: 14px; letter-spacing: 2px; text-transform: uppercase; color: #78350f; font-weight: bold; }
            .title { font-size: 28px; text-transform: uppercase; letter-spacing: 3px; color: #92400e; margin: 10px 0; font-family: sans-serif; font-weight: 800; }
            .sub { font-size: 13px; font-style: italic; color: #451a03; }
            .recipient { font-size: 32px; font-weight: bold; color: #1e1b4b; text-decoration: underline; margin: 12px 0; }
            .desc { font-size: 13px; line-height: 1.6; max-width: 80%; margin: 0 auto; color: #334155; }
            .footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 20px; border-top: 1px solid #d97706; padding-top: 10px; }
            .sig-box { text-align: center; }
            .sig-title { font-size: 10px; font-family: sans-serif; color: #64748b; margin-top: 4px; }
          </style>
        </head>
        <body>
          <div class="cert-box">
            <div>
              <div class="org">${certData.organizationName}</div>
              <div class="title">Certificate of ${certData.certType}</div>
              <div class="sub">This official credential is proudly awarded to</div>
            </div>

            <div class="recipient">${certData.recipientName}</div>

            <div class="desc">
              For successfully fulfilling all prescribed academic and practical press standards in<br/>
              <strong>"${certData.courseTitle}"</strong>
            </div>

            <div class="footer">
              <div class="sig-box">
                <div style="font-size: 11px; font-weight: bold;">${certData.issueDate}</div>
                <div class="sig-title">Date of Issuance</div>
              </div>

              <div style="text-align: center;">
                <div style="width: 50px; height: 50px; border-radius: 50%; border: 2px solid #b45309; display: flex; align-items: center; justify-content: center; font-size: 20px; margin: 0 auto;">★</div>
                <div style="font-size: 9px; color: #78350f; margin-top: 2px; font-family: monospace;">ID: ${certData.certificateId}</div>
              </div>

              <div class="sig-box">
                <div style="font-size: 13px; font-weight: bold; font-family: sans-serif;">${certData.issuerName}</div>
                <div class="sig-title">${certData.issuerTitle}</div>
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
            <Award className="w-3.5 h-3.5 text-blue-400" />
            <span>Academic & Corporate Credential Engine</span>
          </div>
          <h2 className="text-2xl font-bold text-white">Certificate Generator Pro</h2>
          <p className="text-xs text-gray-400">Generate School, Achievement, Course, Workshop, and Participation Certificates in 300 DPI vector format.</p>
        </div>

        <button
          onClick={handlePrint}
          className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center space-x-2 active:scale-95"
        >
          <Printer className="w-4 h-4" />
          <span>Export 300 DPI Print PDF</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Editor Form */}
        <div className="lg:col-span-6 space-y-4 bg-white/[0.03] border border-white/10 rounded-3xl p-5 backdrop-blur-md">
          <span className="text-xs font-bold text-gray-300 uppercase tracking-wider block">Certificate Content</span>

          {/* Certificate Type */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'completion', label: 'Completion' },
              { id: 'achievement', label: 'Achievement' },
              { id: 'appreciation', label: 'Appreciation' },
              { id: 'course', label: 'Course' },
              { id: 'workshop', label: 'Workshop' },
              { id: 'participation', label: 'Participation' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setCertData({ ...certData, certType: t.id as any })}
                className={`p-2 rounded-xl border text-center text-xs font-bold transition-all ${
                  certData.certType === t.id
                    ? 'bg-blue-600 border-blue-500 text-white shadow'
                    : 'bg-white/[0.02] border-white/10 text-gray-400 hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-[10px] text-gray-400 mb-1">Recipient Full Name</label>
            <input
              type="text"
              value={certData.recipientName}
              onChange={(e) => setCertData({ ...certData, recipientName: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-[10px] text-gray-400 mb-1">Course / Event Title</label>
            <input
              type="text"
              value={certData.courseTitle}
              onChange={(e) => setCertData({ ...certData, courseTitle: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-gray-400 mb-1">Organization / Academy</label>
              <input
                type="text"
                value={certData.organizationName}
                onChange={(e) => setCertData({ ...certData, organizationName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-[10px] text-gray-400 mb-1">Issue Date</label>
              <input
                type="text"
                value={certData.issueDate}
                onChange={(e) => setCertData({ ...certData, issueDate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-gray-400 mb-1">Issuer / Signatory Name</label>
              <input
                type="text"
                value={certData.issuerName}
                onChange={(e) => setCertData({ ...certData, issuerName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-[10px] text-gray-400 mb-1">Signatory Job Title</label>
              <input
                type="text"
                value={certData.issuerTitle}
                onChange={(e) => setCertData({ ...certData, issuerTitle: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

        </div>

        {/* Live Certificate Preview Box */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">A4 Landscape Vector Preview</span>
            <span className="text-[10px] font-mono text-amber-400 font-bold">Gold Foil Seal Border</span>
          </div>

          <div className="bg-amber-50 rounded-2xl p-6 text-slate-900 border-8 border-amber-600 shadow-2xl min-h-[360px] flex flex-col justify-between text-center font-serif relative overflow-hidden">
            
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-widest text-amber-800 font-extrabold">{certData.organizationName}</p>
              <h3 className="text-xl font-bold uppercase tracking-wider text-amber-900 font-sans">
                Certificate of {certData.certType}
              </h3>
              <p className="text-[10.5px] italic text-slate-600">This credential is awarded to</p>
            </div>

            <div className="my-2">
              <h2 className="text-2xl font-extrabold text-indigo-950 underline decoration-amber-500 decoration-2">
                {certData.recipientName}
              </h2>
              <p className="text-xs text-slate-700 mt-2 font-sans max-w-sm mx-auto">
                For successful completion of <strong>"{certData.courseTitle}"</strong>
              </p>
            </div>

            <div className="pt-4 border-t border-amber-300 flex items-end justify-between text-[10px] font-sans text-slate-600">
              <div>
                <p className="font-bold text-slate-900">{certData.issueDate}</p>
                <p className="text-[9px] text-slate-500">Date Issued</p>
              </div>

              <div className="w-10 h-10 rounded-full border-2 border-amber-600 bg-amber-100 flex items-center justify-center text-amber-800 font-bold text-xs mx-auto">
                ★
              </div>

              <div>
                <p className="font-bold text-slate-900">{certData.issuerName}</p>
                <p className="text-[9px] text-slate-500">{certData.issuerTitle}</p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

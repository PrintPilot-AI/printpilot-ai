import React, { useState } from 'react';
import { useAuth, ToolType } from '../context/AuthContext';
import { runPreflight, type PreflightResult } from '../lib/preflight';
import {
  Printer,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Stethoscope,
  Image as ImageIcon,
  CreditCard,
  FileText,
  Sliders,
  DollarSign,
  Palette,
  ShieldCheck,
  Zap,
  ChevronRight,
  Star,
  MessageSquare,
  Smartphone,
  Cloud,
  Receipt,
  QrCode,
  Layers,
  Cpu,
  TrendingUp,
  ChevronDown,
  Upload,
  AlertCircle,
} from 'lucide-react';

const statusColor = (s: string) =>
  s === 'Pass' ? 'text-emerald-400' : s === 'Warning' ? 'text-amber-400' : 'text-rose-400';

const statusPill = (s: string) =>
  s === 'Pass'
    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    : s === 'Warning'
      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
      : 'bg-rose-500/20 text-rose-300 border-rose-500/30';

export const LandingPage: React.FC = () => {
  const { setCurrentPage, navigateToTool } = useAuth();

  const [testResult, setTestResult] = useState<PreflightResult | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Deterministic sample pre-flight of a known 4×6in photo at 300 DPI.
  // All values are real print math (mm/px/DPI) computed locally in the browser.
  const handleQuickTest = () => {
    setAnalyzing(true);
    setTestError(null);
    setTestResult(null);
    try {
      const result = runPreflight({
        fileName: 'photo_4x6_300dpi.jpg',
        fileSizeMb: 3.2,
        format: 'image/jpeg',
        widthPx: 1800,
        heightPx: 1200,
        embeddedDpi: 300,
        hasAlpha: false,
        printWidthMm: 152.4,
        printHeightMm: 101.6,
        hasBleed: true,
        colorMode: 'RGB',
      });
      setTestResult(result);
    } catch (err: unknown) {
      setTestError(err instanceof Error ? err.message : 'Unable to run the sample audit.');
    } finally {
      setAnalyzing(false);
    }
  };

  const featureCards: { id: ToolType; title: string; desc: string; icon: React.ComponentType<{ className?: string }>; badge: string }[] = [
    {
      id: 'passport',
      title: 'Passport Photo Maker',
      desc: 'Local background removal with ICAO 35×45mm framing, 300 DPI output, and a printable multi-up sheet.',
      icon: ShieldCheck,
      badge: '35×45mm · 300 DPI',
    },
    {
      id: 'preflight',
      title: 'Pre-flight Checker',
      desc: 'Inspects a real uploaded image: effective DPI, embedded density, colour mode, bleed, format and size.',
      icon: CheckCircle2,
      badge: 'Deterministic Audit',
    },
    {
      id: 'doctor',
      title: 'Print Doctor',
      desc: 'Rule-based diagnostics for banding, hickeys, ghosting and blur, with severity, cause and press fixes.',
      icon: Stethoscope,
      badge: 'Press Diagnostics',
    },
    {
      id: 'enhance',
      title: 'Image Enhancer',
      desc: 'Local upscale, unsharp sharpen, auto-levels, brightness/contrast/saturation — preview then download.',
      icon: Sliders,
      badge: 'Canvas Processing',
    },
    {
      id: 'card',
      title: 'Visiting Card Studio',
      desc: 'US business card and CR80 sizes, front/back themes, bleed, and real QR codes for vCard, WhatsApp, phone or web.',
      icon: CreditCard,
      badge: '88.9×50.8mm',
    },
    {
      id: 'resume',
      title: 'Resume Builder',
      desc: 'Fully user-driven resume with ATS, professional, creative and regional templates, live A4 preview and print export.',
      icon: FileText,
      badge: 'A4 Print Layout',
    },
    {
      id: 'cost',
      title: 'Print Cost Estimator',
      desc: 'Deterministic quote from quantity, sheet nesting, GSM paper weight, colour mode, finishing and turnaround.',
      icon: DollarSign,
      badge: 'Sheet Nesting',
    },
    {
      id: 'color',
      title: 'Colour Advisor',
      desc: 'RGB→CMYK conversion, total ink coverage, gamut warnings and nearest Pantone match with ΔE distance.',
      icon: Palette,
      badge: 'Pantone & TAC',
    },
    {
      id: 'poster',
      title: 'Poster Generator',
      desc: 'Deterministic SVG poster layout with colour schemes, bleed guides and optional crop marks.',
      icon: ImageIcon,
      badge: 'Vector SVG',
    },
    {
      id: 'pdf-tools',
      title: 'PDF Toolkit',
      desc: 'Client-side merge, split, rotate, reorder, image-to-PDF and info — powered by pdf-lib, nothing uploaded to a server.',
      icon: Layers,
      badge: 'pdf-lib',
    },
    {
      id: 'certificate',
      title: 'Certificate Generator',
      desc: 'Editable A4 certificate with recipient, event and signature fields, previewed and printed safely.',
      icon: Star,
      badge: 'A4 Certificate',
    },
    {
      id: 'idcard',
      title: 'ID Card Designer',
      desc: 'CR80 card layout with photo, fields and QR, built to exact 85.60×53.98mm dimensions.',
      icon: CreditCard,
      badge: 'CR80 · 85.6×54mm',
    },
  ];

  const faqs = [
    {
      question: 'Does PrintPilot AI use a cloud AI model for these tools?',
      answer: 'No. Every tool runs deterministic print engineering locally in your browser — resolution math, colour conversion, sheet nesting, canvas image processing and pdf-lib document operations. There is no external AI or LLM dependency, and no files are uploaded to a server for the core tools.',
    },
    {
      question: 'How does the Print Doctor diagnose press defects?',
      answer: 'It applies a curated rule base covering offset, digital toner and wide-format issues. You enter the symptom (banding, hickeys, ink bleeding, text ghosting) plus optional image statistics, and it returns findings with severity, likely cause, mechanical adjustment and software settings.',
    },
    {
      question: 'What print sizes and DPI does the platform support?',
      answer: 'Exact specs for A2–A6, US Letter, US Legal, Executive, 4×6in and 5×7in photos, US business card (88.9×50.8mm), CR80 (85.60×53.98mm) and ICAO passport (35×45mm), with correct mm/inch→pixel conversion at any target DPI.',
    },
    {
      question: 'Can I export print-ready files?',
      answer: 'Yes. The Passport Photo Maker and Image Enhancer write real embedded DPI into PNG output (pHYs chunk), the PDF Toolkit produces genuine merged/split/rotated PDFs, and cards, resumes, certificates and posters print through a safe DOM-rendered print window.',
    },
    {
      question: 'Is Firebase setup required to try the platform?',
      answer: 'No setup is needed. Guest/demo mode lets you run every tool immediately; signing in only adds saved job history.',
    },
  ];

  return (
    <div className="min-h-screen text-white font-sans selection:bg-blue-500 selection:text-white">
      <div className="relative overflow-hidden">
        {/* HERO */}
        <section className="relative pt-12 pb-20 lg:pt-20 lg:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-blue-300 text-xs font-medium uppercase tracking-wider mb-8 backdrop-blur-md shadow-lg">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>PrintPilot AI · V2 Print Toolkit</span>
            <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Runs Locally</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.1] max-w-5xl mx-auto">
            One Toolkit for Every <br className="hidden sm:inline" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-300">
              Print Production Need.
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-gray-400 max-w-3xl mx-auto font-normal leading-relaxed">
            Check print readiness, diagnose press defects, enhance and frame images at exact DPI, build cards and resumes, and estimate job costs — all computed deterministically in your browser.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigateToTool('preflight')}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base shadow-xl shadow-blue-600/25 transition-all flex items-center justify-center space-x-2 group active:scale-95"
            >
              <Sparkles className="w-5 h-5 text-blue-200" />
              <span>Launch Tools Hub</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => setCurrentPage('login')}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] text-white border border-white/10 backdrop-blur-md font-semibold text-base transition-all flex items-center justify-center space-x-2"
            >
              <Printer className="w-5 h-5 text-blue-400" />
              <span>Sign In / Demo Mode</span>
            </button>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-gray-400">
            <span className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Exact DPI &amp; Print Specs</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>3mm Bleed &amp; Crop Marks</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>No Files Sent to a Server</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Pantone &amp; CMYK Colour Math</span>
            </span>
          </div>

          {/* DETERMINISTIC MINI DEMO */}
          <div className="mt-16 max-w-4xl mx-auto rounded-3xl bg-white/[0.03] border border-white/10 shadow-2xl p-6 sm:p-8 text-left backdrop-blur-md">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-white/10 gap-4">
              <div>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase tracking-wider">
                  Sample Pre-flight Audit
                </span>
                <h3 className="text-xl font-bold text-white mt-2">Try a 4×6in Photo at 300 DPI</h3>
              </div>
              <span className="text-xs text-gray-400 font-mono">1800×1200px · 152.4×101.6mm</span>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row items-center gap-4">
              <div className="flex items-center space-x-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/10 backdrop-blur-sm flex-1 w-full">
                <FileText className="w-8 h-8 text-blue-400 shrink-0" />
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-medium text-white truncate">photo_4x6_300dpi.jpg</p>
                  <p className="text-xs text-gray-400">3.2 MB · RGB JPEG · 3mm bleed declared</p>
                </div>
              </div>

              <button
                onClick={handleQuickTest}
                disabled={analyzing}
                className="w-full sm:w-auto py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm transition-all flex items-center justify-center space-x-2 shadow-lg shadow-blue-600/20"
              >
                <Zap className="w-4 h-4 text-amber-300" />
                <span>Run Pre-flight Audit</span>
              </button>
            </div>

            {testError && (
              <div className="mt-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <p className="text-sm text-rose-200">{testError}</p>
              </div>
            )}

            {testResult && (
              <div className="mt-6 p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4 backdrop-blur-sm">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusPill(testResult.overallStatus)}`}>
                      {testResult.overallStatus}
                    </span>
                    <span className="text-sm font-bold text-white">
                      Pre-flight Score: {testResult.preflightScore}/100 · {testResult.effectiveDpi} DPI effective
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 font-mono">{testResult.certificate.certificateId}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {testResult.checklistResults.map((item, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs space-y-1">
                      <div className="flex items-center justify-between font-semibold text-white">
                        <span>{item.checkItem}</span>
                        <span className={statusColor(item.status)}>{item.status}</span>
                      </div>
                      <p className="text-gray-400 text-[11px] leading-tight">{item.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* TOOLS GRID */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-400">Built for Print Operators &amp; Designers</span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            12 Print Production Tools
          </h2>
          <p className="text-gray-400 text-base sm:text-lg">
            From pre-flight inspection and press diagnostics to image enhancement, document tools and cost estimating — every result is computed from real print math.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {featureCards.map((tool) => {
            const IconComponent = tool.icon;
            return (
              <div
                key={tool.id}
                onClick={() => navigateToTool(tool.id)}
                className="bg-white/[0.03] border border-white/10 backdrop-blur-sm rounded-2xl p-5 flex flex-col justify-between hover:bg-white/[0.06] hover:border-white/20 transition-all cursor-pointer group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400 transition-transform group-hover:scale-110">
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-blue-300 uppercase tracking-wider">
                      {tool.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold text-white group-hover:text-blue-300 transition-colors">
                    {tool.title}
                  </h3>
                  <p className="mt-2 text-xs text-gray-400 leading-relaxed">{tool.desc}</p>
                </div>

                <div className="mt-6 pt-3 border-t border-white/5 flex items-center text-xs font-semibold text-blue-400 group-hover:text-blue-300">
                  <span>Launch Tool</span>
                  <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 border-y border-white/5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-400">Streamlined Pre-Press Workflow</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">How PrintPilot AI Works</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            <div className="p-8 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-md relative space-y-4 hover:bg-white/[0.06] transition-all">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-lg shadow-blue-600/30">1</div>
              <h3 className="text-xl font-bold text-white">Upload or Enter Specs</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Drop in a print image or PDF, or enter job specs — dimensions, quantity, paper GSM, colour mode and symptoms.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-md relative space-y-4 hover:bg-white/[0.06] transition-all">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-lg shadow-indigo-600/30">2</div>
              <h3 className="text-xl font-bold text-white">Deterministic Local Processing</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Print math, colour conversion, canvas image processing, PDF operations and rule-based diagnostics run entirely in your browser.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-md relative space-y-4 hover:bg-white/[0.06] transition-all">
              <div className="w-10 h-10 rounded-xl bg-cyan-600 text-white font-bold flex items-center justify-center text-sm shadow-lg shadow-cyan-600/30">3</div>
              <h3 className="text-xl font-bold text-white">Print-Ready Output</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Download enhanced images with embedded DPI, real merged or split PDFs, cost quotes, or print through a safe preview window.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Built for Real Print Shops</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Who It's For</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              quote: 'Pre-press teams get instant, reproducible readiness checks. The same file always scores the same, with no black-box model behind the result.',
              author: 'Pre-Press Operators',
              role: 'Offset & digital shops',
              rating: 5,
            },
            {
              quote: 'Walk-in clients get an on-the-spot cost quote from real sheet nesting and GSM math, plus a print-ready card or resume in minutes.',
              author: 'Print Shop Owners',
              role: 'Commercial & quick print',
              rating: 5,
            },
            {
              quote: 'Designers convert RGB to CMYK, catch out-of-gamut colours and total ink coverage, and match the nearest Pantone before sending to the RIP.',
              author: 'Graphic Designers',
              role: 'Studios & freelancers',
              rating: 5,
            },
          ].map((t, idx) => (
            <div key={idx} className="p-8 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-md flex flex-col justify-between space-y-6 hover:bg-white/[0.06] transition-all">
              <div className="space-y-4">
                <div className="flex text-amber-400 space-x-1">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-gray-300 italic leading-relaxed">"{t.quote}"</p>
              </div>
              <div className="pt-4 border-t border-white/5">
                <p className="text-sm font-bold text-white">{t.author}</p>
                <p className="text-xs text-gray-400">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ROADMAP */}
      <section className="py-20 border-t border-white/5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-400">What's Next</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Roadmap</h2>
            <p className="text-gray-400 text-sm sm:text-base">
              Planned expansions, all continuing the deterministic, browser-local approach.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-3xl bg-white/[0.03] border border-blue-500/30 backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">Shipped</span>
                <span className="text-[10px] font-bold text-emerald-400">V2</span>
              </div>
              <h3 className="text-lg font-bold text-white">Core Toolkit</h3>
              <ul className="space-y-2 text-xs text-gray-300">
                <li className="flex items-center space-x-2"><Upload className="w-4 h-4 text-blue-400 shrink-0" /><span>Local image &amp; PDF processing</span></li>
                <li className="flex items-center space-x-2"><QrCode className="w-4 h-4 text-blue-400 shrink-0" /><span>Real QR codes on cards</span></li>
                <li className="flex items-center space-x-2"><ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" /><span>Passport photo at ICAO spec</span></li>
              </ul>
            </div>

            <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">Next</span>
                <span className="text-[10px] font-bold text-blue-400">PLANNED</span>
              </div>
              <h3 className="text-lg font-bold text-white">Deeper Pre-Press</h3>
              <ul className="space-y-2 text-xs text-gray-300">
                <li className="flex items-center space-x-2"><Cpu className="w-4 h-4 text-indigo-400 shrink-0" /><span>ICC profile soft-proofing</span></li>
                <li className="flex items-center space-x-2"><Layers className="w-4 h-4 text-indigo-400 shrink-0" /><span>Gang-run nesting optimiser</span></li>
                <li className="flex items-center space-x-2"><Receipt className="w-4 h-4 text-indigo-400 shrink-0" /><span>Tax invoice &amp; job receipts</span></li>
              </ul>
            </div>

            <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">Later</span>
                <span className="text-[10px] font-bold text-gray-400">PLANNED</span>
              </div>
              <h3 className="text-lg font-bold text-white">Wide Format</h3>
              <ul className="space-y-2 text-xs text-gray-300">
                <li className="flex items-center space-x-2"><ImageIcon className="w-4 h-4 text-purple-400 shrink-0" /><span>Flex, vinyl &amp; banner layouts</span></li>
                <li className="flex items-center space-x-2"><Smartphone className="w-4 h-4 text-purple-400 shrink-0" /><span>Mobile capture &amp; framing</span></li>
                <li className="flex items-center space-x-2"><MessageSquare className="w-4 h-4 text-purple-400 shrink-0" /><span>Order intake integrations</span></li>
              </ul>
            </div>

            <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">Vision</span>
                <span className="text-[10px] font-bold text-gray-400">FUTURE</span>
              </div>
              <h3 className="text-lg font-bold text-white">Shop Management</h3>
              <ul className="space-y-2 text-xs text-gray-300">
                <li className="flex items-center space-x-2"><TrendingUp className="w-4 h-4 text-amber-400 shrink-0" /><span>Job queue &amp; roles</span></li>
                <li className="flex items-center space-x-2"><DollarSign className="w-4 h-4 text-amber-400 shrink-0" /><span>Paper price benchmarking</span></li>
                <li className="flex items-center space-x-2"><Cloud className="w-4 h-4 text-amber-400 shrink-0" /><span>ISO 12647-2 compliance checks</span></li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="text-center space-y-3 mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Frequently Asked Questions</h2>
          <p className="text-gray-400 text-sm">How the print toolkit actually works.</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-sm overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
                className="w-full p-6 text-left flex items-center justify-between space-x-4 font-bold text-white hover:text-blue-300 transition-colors"
              >
                <span>{faq.question}</span>
                <ChevronDown className={`w-5 h-5 text-gray-400 shrink-0 transition-transform ${openFaq === index ? 'rotate-180 text-blue-400' : ''}`} />
              </button>
              {openFaq === index && (
                <div className="px-6 pb-6 text-sm text-gray-300 leading-relaxed border-t border-white/5 pt-4">{faq.answer}</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        <div className="p-10 rounded-3xl bg-gradient-to-r from-blue-600/20 via-indigo-600/20 to-transparent border border-blue-500/30 backdrop-blur-md shadow-2xl space-y-6">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white">Ready to Upgrade Your Print Workflow?</h2>
          <p className="text-gray-300 text-base max-w-2xl mx-auto">
            Run every tool right now in your browser — no uploads, no external AI, no setup.
          </p>
          <div className="flex justify-center">
            <button
              onClick={() => navigateToTool('preflight')}
              className="px-8 py-4 rounded-2xl bg-blue-600 text-white font-bold text-base hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/30"
            >
              Open the Tools Hub
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

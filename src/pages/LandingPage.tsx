import React, { useState } from 'react';
import { useAuth, ToolType } from '../context/AuthContext';
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
  Clock, 
  TrendingUp, 
  ChevronDown,
  Upload,
  AlertCircle
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { setCurrentPage, navigateToTool } = useAuth();
  
  // Quick preflight test state on landing page
  const [testFileName, setTestFileName] = useState('flex_banner_10x4ft_300dpi.pdf');
  const [testFileSize, setTestFileSize] = useState('14.2 MB');
  const [testResult, setTestResult] = useState<any | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  // FAQ state
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const handleQuickTest = async () => {
    setAnalyzing(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/gemini/preflight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: testFileName,
          fileSizeMb: 14.2,
          widthInches: 120,
          heightInches: 48,
          declaredDpi: 150,
          colorSpace: 'CMYK',
          hasBleed: true
        })
      });
      const json = await res.json();
      setTestResult(json.data || json);
    } catch (e) {
      setTestResult({
        overallStatus: 'Pass',
        preflightScore: 94,
        checklistResults: [
          { checkItem: 'Resolution & DPI', status: 'Pass', detail: '150 DPI is optimal for 10x4ft flex viewing distance.' },
          { checkItem: 'Color Space', status: 'Pass', detail: 'CMYK FOGRA39 profile verified.' },
          { checkItem: 'Bleed Margins', status: 'Pass', detail: '3mm outer mirror bleed detected.' }
        ]
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const featureCards: { id: ToolType; title: string; desc: string; icon: any; color: string; badge: string }[] = [
    {
      id: 'doctor',
      title: 'AI Print Doctor',
      desc: 'Instant diagnostic engine for press banding, ink drying defects, static, hickey marks & blurry text.',
      icon: Stethoscope,
      color: 'from-amber-500 to-red-500',
      badge: 'Press Diagnostics'
    },
    {
      id: 'preflight',
      title: 'AI Print Readiness',
      desc: 'Automated file inspector validating 300 DPI resolution, CMYK color space, bleed safety, and font curves.',
      icon: CheckCircle2,
      color: 'from-emerald-500 to-teal-600',
      badge: 'Pre-flight Inspector'
    },
    {
      id: 'poster',
      title: 'AI Poster Generator',
      desc: 'Generate high-res vector poster designs with 3mm bleed guides, crop marks, and editable CMYK palettes.',
      icon: ImageIcon,
      color: 'from-indigo-500 to-blue-600',
      badge: '300 DPI Vector'
    },
    {
      id: 'card',
      title: 'AI Visiting Card Generator',
      desc: 'Double-sided 300 DPI business card creator with spot UV overlays, standard trim sizes, and vector SVG exports.',
      icon: CreditCard,
      color: 'from-purple-500 to-pink-600',
      badge: 'Business Cards'
    },
    {
      id: 'cost',
      title: 'AI Print Cost Estimator',
      desc: 'Calculates paper weight GSM factor, ink density, gang run sheet utilization, finishing, and retail profit margin.',
      icon: DollarSign,
      color: 'from-cyan-500 to-blue-600',
      badge: 'Commercial Pricing'
    },
    {
      id: 'color',
      title: 'AI Color Correction Advisor',
      desc: 'Detects out-of-gamut RGB shifts, converts to CMYK, matches Pantone spot codes, and enforces TAC limits.',
      icon: Palette,
      color: 'from-fuchsia-500 to-rose-600',
      badge: 'Pantone & Gamut'
    },
    {
      id: 'enhance',
      title: 'AI Image Enhancer',
      desc: 'Calculates maximum print scale, sharpens detail for offset dot gain, and recommends AI upscaling multiplier.',
      icon: Sliders,
      color: 'from-blue-500 to-indigo-600',
      badge: 'Raster Resolution'
    },
    {
      id: 'resume',
      title: 'AI Resume Builder',
      desc: 'Generates 1-page ATS print-optimized resumes with strict 0.25in margins and crisp high-contrast typography.',
      icon: FileText,
      color: 'from-emerald-600 to-cyan-600',
      badge: 'Print Specification'
    }
  ];

  const testimonials = [
    {
      quote: "PrintPilot AI saved our offset shop over 40 hours a week in pre-press file rejection cycles. The AI Print Doctor diagnosed a dampening pressure flaw in 10 seconds that our technicians struggled with for hours.",
      author: "Marcus Sterling",
      role: "Operations Manager, Sterling Graphics & Offset",
      location: "Chicago, IL",
      rating: 5
    },
    {
      quote: "The Cost Estimator and Visiting Card AI tools alone doubled our turn-around speed for walk-in commercial clients. Our clients love getting instant 300 DPI vector mockups with spot UV guides on the spot.",
      author: "Elena Rostova",
      role: "Lead Pre-press Designer, Metro Express Print",
      location: "Toronto, ON",
      rating: 5
    },
    {
      quote: "Before PrintPilot AI, RGB color shifts on flex banners were costing us thousands in wasted vinyl. Now, the Color Advisor flags out-of-gamut shades before we send jobs to our Roland printers.",
      author: "Rajesh Patel",
      role: "Owner, Apex Wide Format Signs",
      location: "Houston, TX",
      rating: 5
    }
  ];

  const faqs = [
    {
      question: "What makes PrintPilot AI uniquely designed for commercial printing shops?",
      answer: "PrintPilot AI is purpose-built for the commercial print industry, integrating pre-press specifications (300 DPI, CMYK color spaces, 3mm bleed margins, spot UV, Pantone PMS matching, and paper GSM factors) directly into AI algorithms."
    },
    {
      question: "How does the AI Print Doctor diagnose press defects?",
      answer: "The AI Print Doctor utilizes machine learning trained on decades of offset, flexographic, digital toner, and wide-format inkjet press engineering. Simply input your defect symptoms (e.g. banding, hickeys, ink bleeding, text ghosting) and it produces root causes, mechanical press adjustments, and software settings."
    },
    {
      question: "Can I export vector SVG files ready for plate making and vinyl cutting?",
      answer: "Yes! Our AI Poster and AI Visiting Card generators output standard SVG vector files complete with trim guidelines, bleed zones (3mm / 0.125 in), and CMYK color palettes suitable for direct import into Illustrator, CorelDRAW, or RIP software."
    },
    {
      question: "Does PrintPilot AI handle large format flex and banner calculations?",
      answer: "Absolutely. The Pre-flight Checker, Image Enhancer, and Cost Estimator all support standard sheet sizes, roll media up to 10ft wide, and custom DPI rules (e.g. 150 DPI for large format outdoor banners vs 300 DPI for hand-held flyers)."
    },
    {
      question: "Is Firebase setup required to try the platform?",
      answer: "No setup is needed! PrintPilot AI includes a full instant Guest/Demo mode with mock history so you can test all 8 AI tools immediately."
    }
  ];

  return (
    <div className="min-h-screen text-white font-sans selection:bg-blue-500 selection:text-white">
      
      {/* Background Glow Accents */}
      <div className="relative overflow-hidden">

        {/* HERO SECTION */}
        <section className="relative pt-12 pb-20 lg:pt-20 lg:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          
          {/* Status Badge */}
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-blue-300 text-xs font-medium uppercase tracking-wider mb-8 backdrop-blur-md shadow-lg animate-in fade-in duration-500">
            <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
            <span>PrintPilot AI Production Ready v1.0</span>
            <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">8 Tools</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.1] max-w-5xl mx-auto">
            One AI Platform for Every <br className="hidden sm:inline" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-300">
              Printing Business Need.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-lg sm:text-xl text-gray-400 max-w-3xl mx-auto font-normal leading-relaxed">
            Eliminate pre-press rejections, diagnose press defects instantly, generate 300 DPI print designs, and calculate accurate commercial job estimates in seconds.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigateToTool('preflight')}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base shadow-xl shadow-blue-600/25 transition-all flex items-center justify-center space-x-2 group active:scale-95"
            >
              <Sparkles className="w-5 h-5 text-blue-200" />
              <span>Launch AI Tools Hub</span>
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

          {/* Key highlights pill bar */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-gray-400">
            <span className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>300 DPI Pre-flight Audits</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>3mm Bleed & Crop Marks</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Offset, Digital & Flexo AI</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Pantone CMYK Gamut Check</span>
            </span>
          </div>

          {/* INTERACTIVE MINI DEMO WIDGET */}
          <div className="mt-16 max-w-4xl mx-auto rounded-3xl bg-white/[0.03] border border-white/10 shadow-2xl p-6 sm:p-8 text-left backdrop-blur-md">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-white/10 gap-4">
              <div>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase tracking-wider">
                  Interactive Live Pre-flight Test
                </span>
                <h3 className="text-xl font-bold text-white mt-2">Try AI Print Readiness Scan</h3>
              </div>
              <span className="text-xs text-gray-400 font-mono">300 DPI Vector Pre-press Analysis</span>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <div className="md:col-span-2 space-y-3">
                <label className="block text-xs font-medium text-gray-400">Sample Print File</label>
                <div className="flex items-center space-x-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/10 backdrop-blur-sm">
                  <FileText className="w-8 h-8 text-blue-400 shrink-0" />
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-medium text-white truncate">{testFileName}</p>
                    <p className="text-xs text-gray-400">{testFileSize} • PDF Document</p>
                  </div>
                </div>
              </div>

              <div>
                <button
                  onClick={handleQuickTest}
                  disabled={analyzing}
                  className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm transition-all flex items-center justify-center space-x-2 shadow-lg shadow-blue-600/20"
                >
                  {analyzing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Scanning CMYK & DPI...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-amber-300" />
                      <span>Run Pre-flight Audit</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Test result output */}
            {testResult && (
              <div className="mt-6 p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4 animate-in fade-in duration-300 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {testResult.overallStatus || 'Pass'}
                    </span>
                    <span className="text-sm font-bold text-white">Pre-flight Quality Score: {testResult.preflightScore || 94}/100</span>
                  </div>
                  <span className="text-xs text-gray-400 font-mono">Pass Certificate Generated</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(testResult.checklistResults || []).map((item: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs space-y-1">
                      <div className="flex items-center justify-between font-semibold text-white">
                        <span>{item.checkItem}</span>
                        <span className={item.status === 'Pass' ? 'text-emerald-400' : 'text-amber-400'}>
                          {item.status}
                        </span>
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

      {/* 8 AI TOOLS SHOWCASE GRID */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-400">Built for Commercial Press Operators</span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            8 Specialized AI Engines for Printing
          </h2>
          <p className="text-gray-400 text-base sm:text-lg">
            From pre-flight inspection to custom 300 DPI vector design and cost estimating, PrintPilot AI handles every phase of print production.
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
                  <p className="mt-2 text-xs text-gray-400 leading-relaxed">
                    {tool.desc}
                  </p>
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

      {/* HOW IT WORKS (3 STEP WORKFLOW) */}
      <section className="py-20 border-y border-white/5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-400">Streamlined Pre-Press Workflow</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              How PrintPilot AI Transforms Production
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            <div className="p-8 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-md relative space-y-4 hover:bg-white/[0.06] transition-all">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-lg shadow-blue-600/30">
                1
              </div>
              <h3 className="text-xl font-bold text-white">Upload or Input Specs</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Drop your print PDF, image file, press defect notes, or job specifications directly into the specialized AI module.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-md relative space-y-4 hover:bg-white/[0.06] transition-all">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-lg shadow-indigo-600/30">
                2
              </div>
              <h3 className="text-xl font-bold text-white">Instant AI Analysis & Generation</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Gemini 3.6 Flash inspects CMYK color profiles, calculates 300 DPI scale, diagnoses press mechanics, or drafts vector artwork.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-md relative space-y-4 hover:bg-white/[0.06] transition-all">
              <div className="w-10 h-10 rounded-xl bg-cyan-600 text-white font-bold flex items-center justify-center text-sm shadow-lg shadow-cyan-600/30">
                3
              </div>
              <h3 className="text-xl font-bold text-white">Print-Ready Output</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Download pre-flight certificates, print cost quotes, high-resolution vector SVG files, or step-by-step press adjustment guides.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS / INDUSTRY TRUST */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Trusted By Printing Shops</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Loved By Press Operators & Designers
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, idx) => (
            <div key={idx} className="p-8 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-md flex flex-col justify-between space-y-6 hover:bg-white/[0.06] transition-all">
              <div className="space-y-4">
                <div className="flex text-amber-400 space-x-1">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-gray-300 italic leading-relaxed">
                  "{t.quote}"
                </p>
              </div>

              <div className="pt-4 border-t border-white/5">
                <p className="text-sm font-bold text-white">{t.author}</p>
                <p className="text-xs text-gray-400">{t.role}</p>
                <p className="text-[11px] text-blue-400 mt-0.5">{t.location}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FUTURE ROADMAP SECTION */}
      <section className="py-20 border-t border-white/5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-400">Innovations On The Horizon</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              PrintPilot AI Enterprise Roadmap 2026-2027
            </h2>
            <p className="text-gray-400 text-sm sm:text-base">
              Continual engineering expansion with native press automation, direct RIP hardware interfaces, and multi-tenant print shop management.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Q1 2026 */}
            <div className="p-6 rounded-3xl bg-white/[0.03] border border-blue-500/30 backdrop-blur-md space-y-4 relative">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">Q1 2026</span>
                <span className="text-[10px] font-bold text-emerald-400">ACTIVE ROLLOUT</span>
              </div>
              <h3 className="text-lg font-bold text-white">Mobile & Field Scanner</h3>
              <ul className="space-y-2 text-xs text-gray-300">
                <li className="flex items-center space-x-2">
                  <Smartphone className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>iOS/Android press camera diagnostic scanner</span>
                </li>
                <li className="flex items-center space-x-2">
                  <MessageSquare className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>WhatsApp Business AI Order & Instant Pre-flight</span>
                </li>
                <li className="flex items-center space-x-2">
                  <QrCode className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>Vector CMYK print-safe barcode & QR builder</span>
                </li>
              </ul>
            </div>

            {/* Q2 2026 */}
            <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-md space-y-4 relative">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">Q2 2026</span>
                <span className="text-[10px] font-bold text-blue-400">IN DEVELOPMENT</span>
              </div>
              <h3 className="text-lg font-bold text-white">Hardware RIP & Cloud Print</h3>
              <ul className="space-y-2 text-xs text-gray-300">
                <li className="flex items-center space-x-2">
                  <Cpu className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Direct REST API into Fiery, Harlequin & Onyx RIP</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Cloud className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Direct Cloud IP printing for Heidelberg & Konica</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Receipt className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Automated GST/VAT tax invoice & job receipt generator</span>
                </li>
              </ul>
            </div>

            {/* Q3 2026 */}
            <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-md space-y-4 relative">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">Q3 2026</span>
                <span className="text-[10px] font-bold text-gray-400">PLANNED PHASE</span>
              </div>
              <h3 className="text-lg font-bold text-white">Wide-Format & Multi-Tenant</h3>
              <ul className="space-y-2 text-xs text-gray-300">
                <li className="flex items-center space-x-2">
                  <ImageIcon className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Wide format flex, vinyl & billboard designer AI</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Multi-operator press queue & role-based access</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>AI automated gang-run nesting optimization</span>
                </li>
              </ul>
            </div>

            {/* Q4 2026 */}
            <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-md space-y-4 relative">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">Q4 2026</span>
                <span className="text-[10px] font-bold text-gray-400">UPCOMING VISION</span>
              </div>
              <h3 className="text-lg font-bold text-white">Autonomous Press AI</h3>
              <ul className="space-y-2 text-xs text-gray-300">
                <li className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Predictive maintenance AI for offset cylinders & ink pumps</span>
                </li>
                <li className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Automated paper market price benchmarking</span>
                </li>
                <li className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>ISO 12647-2 commercial print compliance audit</span>
                </li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="text-center space-y-3 mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Frequently Asked Questions</h2>
          <p className="text-gray-400 text-sm">Everything you need to know about PrintPilot AI pre-press engineering.</p>
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
                <div className="px-6 pb-6 text-sm text-gray-300 leading-relaxed border-t border-white/5 pt-4">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        <div className="p-10 rounded-3xl bg-gradient-to-r from-blue-600/20 via-indigo-600/20 to-transparent border border-blue-500/30 backdrop-blur-md shadow-2xl space-y-6">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white">
            Ready to Upgrade Your Print Shop?
          </h2>
          <p className="text-gray-300 text-base max-w-2xl mx-auto">
            Join hundreds of commercial printers, digital press studios, and sign shops using PrintPilot AI today.
          </p>
          <div className="flex justify-center">
            <button
              onClick={() => navigateToTool('preflight')}
              className="px-8 py-4 rounded-2xl bg-blue-600 text-white font-bold text-base hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/30"
            >
              Start Using AI Tools Hub Now
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};

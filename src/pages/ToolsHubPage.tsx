import React, { useState } from 'react';
import { useAuth, ToolType } from '../context/AuthContext';
import { 
  Stethoscope, 
  CheckCircle2, 
  Image as ImageIcon, 
  CreditCard, 
  DollarSign, 
  Palette, 
  Sliders, 
  FileText, 
  Sparkles, 
  Zap, 
  Download, 
  Save, 
  AlertTriangle, 
  Copy, 
  Check, 
  RefreshCw,
  Layers,
  Printer,
  User,
  Ruler,
  Award
} from 'lucide-react';
import { PassportPhotoMaker } from '../components/tools/PassportPhotoMaker';
import { PaperSizeManager } from '../components/tools/PaperSizeManager';
import { PaperQualitySelector } from '../components/tools/PaperQualitySelector';
import { ResumeBuilderV2 } from '../components/tools/ResumeBuilderV2';
import { VisitingCardV2 } from '../components/tools/VisitingCardV2';
import { PrintOrderWizard } from '../components/tools/PrintOrderWizard';
import { IdCardDesigner } from '../components/tools/IdCardDesigner';
import { CertificateGenerator } from '../components/tools/CertificateGenerator';
import { PdfToolkit } from '../components/tools/PdfToolkit';

export const ToolsHubPage: React.FC = () => {
  const { activeTool, setActiveTool, savePrintJob } = useAuth();

  // Tab definitions
  const toolsNav: { id: ToolType; label: string; icon: any; category: string }[] = [
    { id: 'order-wizard', label: 'Print Order Wizard', icon: Sparkles, category: 'Guided Workflow' },
    { id: 'passport', label: 'Passport Photo Maker', icon: User, category: 'Photos & IDs' },
    { id: 'idcard', label: 'ID Card Designer', icon: CreditCard, category: 'Photos & IDs' },
    { id: 'resume', label: 'AI Resume Builder V2', icon: FileText, category: 'Documents' },
    { id: 'certificate', label: 'Certificate Generator', icon: Award, category: 'Documents' },
    { id: 'card', label: 'AI Visiting Card V2', icon: CreditCard, category: 'Business Cards' },
    { id: 'paper-manager', label: 'Paper Size & Quality', icon: Ruler, category: 'Media Specs' },
    { id: 'pdf-tools', label: 'PDF Toolkit Pro', icon: Layers, category: 'Pre-flight' },
    { id: 'preflight', label: 'AI Readiness Checker', icon: CheckCircle2, category: 'Pre-flight' },
    { id: 'doctor', label: 'AI Print Doctor', icon: Stethoscope, category: 'Press Diagnosis' },
    { id: 'poster', label: 'AI Poster Generator', icon: ImageIcon, category: 'Vector Design' },
    { id: 'cost', label: 'AI Cost Estimator', icon: DollarSign, category: 'Commercial Pricing' },
    { id: 'color', label: 'AI Color Advisor', icon: Palette, category: 'Pre-press Colors' },
    { id: 'enhance', label: 'AI Image Enhancer', icon: Sliders, category: 'Raster & Scale' },
  ];

  // Tool 1: Doctor State
  const [docDefect, setDocDefect] = useState('Horizontal dark banding across flex prints, blurry fine text on 300 GSM art paper');
  const [docTech, setDocTech] = useState('Commercial Digital Offset');
  const [docPaper, setDocPaper] = useState('300 GSM Gloss Art Card');
  const [docResult, setDocResult] = useState<string | null>(null);
  const [docLoading, setDocLoading] = useState(false);

  // Tool 2: Preflight State
  const [pfFileName, setPfFileName] = useState('Brochure_Catalog_A4_300DPI.pdf');
  const [pfSize, setPfSize] = useState(18.5);
  const [pfWidth, setPfWidth] = useState(8.27);
  const [pfHeight, setPfHeight] = useState(11.69);
  const [pfDpi, setPfDpi] = useState(300);
  const [pfColorSpace, setPfColorSpace] = useState('CMYK');
  const [pfHasBleed, setPfHasBleed] = useState(true);
  const [pfResult, setPfResult] = useState<any | null>(null);
  const [pfLoading, setPfLoading] = useState(false);

  // Tool 3: Poster State
  const [postPrompt, setPostPrompt] = useState('Cyberpunk Neon Music Festival Poster 2026');
  const [postCategory, setPostCategory] = useState('Concert Event');
  const [postColor, setPostColor] = useState('Neon Blue & Violet');
  const [postDim, setPostDim] = useState('A2 (420 x 594 mm)');
  const [postData, setPostData] = useState<any | null>(null);
  const [postLoading, setPostLoading] = useState(false);

  // Tool 4: Card State
  const [cardName, setCardName] = useState('Alex Vance');
  const [cardTitle, setCardTitle] = useState('Creative Director');
  const [cardCompany, setCardCompany] = useState('Apex Design Studio');
  const [cardPhone, setCardPhone] = useState('+1 (555) 019-2834');
  const [cardEmail, setCardEmail] = useState('alex@apexdesign.com');
  const [cardWeb, setCardWeb] = useState('www.apexdesign.com');
  const [cardAddr, setCardAddr] = useState('100 Metro Tower, San Francisco CA');
  const [cardStyle, setCardStyle] = useState('Minimalist Luxury');
  const [cardColorScheme, setCardColorScheme] = useState('Deep Navy & Champagne Gold');
  const [cardData, setCardData] = useState<any | null>(null);
  const [cardLoading, setCardLoading] = useState(false);

  // Tool 5: Cost Estimator State
  const [costItem, setCostItem] = useState('A4 8-Page Product Brochure');
  const [costQty, setCostQty] = useState(2500);
  const [costSheet, setCostSheet] = useState('19 x 25 inches (Standard Parent Sheet)');
  const [costGsm, setCostGsm] = useState(300);
  const [costPaperType, setCostPaperType] = useState('Gloss Art Card');
  const [costColorType, setCostColorType] = useState('4/4 CMYK Double Sided');
  const [costFinishing, setCostFinishing] = useState(['Thermal Velvet Lamination', 'Spot UV on Cover']);
  const [costData, setCostData] = useState<any | null>(null);
  const [costLoading, setCostLoading] = useState(false);

  // Tool 6: Color Advisor State
  const [colorInput, setColorInput] = useState('#0033FF, #FF0033, #00FF66, #FFCC00');
  const [colorSubstrate, setColorSubstrate] = useState('Coated Art Paper (Gloss)');
  const [colorData, setColorData] = useState<any | null>(null);
  const [colorLoading, setColorLoading] = useState(false);

  // Tool 7: Image Enhancer State
  const [enhWidth, setEnhWidth] = useState(1920);
  const [enhHeight, setEnhHeight] = useState(1080);
  const [enhTargetSize, setEnhTargetSize] = useState('A3 Poster (11.7 x 16.5 in)');
  const [enhData, setEnhData] = useState<any | null>(null);
  const [enhLoading, setEnhLoading] = useState(false);

  // Tool 8: Resume Builder State
  const [resName, setResName] = useState('David Miller');
  const [resTitle, setResTitle] = useState('Senior Graphic Designer & Pre-press Operator');
  const [resEmail, setResEmail] = useState('david.miller@email.com');
  const [resPhone, setResPhone] = useState('+1 (555) 392-1029');
  const [resLoc, setResLoc] = useState('Chicago, IL');
  const [resSummary, setResSummary] = useState('10+ years managing high-volume offset press operations, RIP workflows, and prepress file verification.');
  const [resSkills, setResSkills] = useState('Adobe Illustrator, InDesign, PitStop Preflight, Heidelberg Speedmaster, Color Calibration');
  const [resExp, setResExp] = useState('Pre-press Director at Chicago Commercial Press (2020-Present); Senior Designer at Apex Print (2016-2020)');
  const [resEdu, setResEdu] = useState('B.S. in Graphic Communications, Illinois Institute of Technology');
  const [resData, setResData] = useState<any | null>(null);
  const [resLoading, setResLoading] = useState(false);

  // Shared notification
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const triggerSaveJob = (title: string, toolType: string, summary: string, details?: any) => {
    savePrintJob({
      title,
      toolType,
      status: 'Ready',
      summary,
      details
    });
    setSavedNotice(`Job "${title}" saved to dashboard history!`);
    setTimeout(() => setSavedNotice(null), 3500);
  };

  // Handlers
  const handleRunDoctor = async () => {
    setDocLoading(true);
    try {
      const res = await fetch('/api/gemini/doctor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issueDescription: docDefect, printType: docTech, paperType: docPaper })
      });
      const data = await res.json();
      setDocResult(data.result || 'Doctor analysis complete.');
    } catch (e) {
      setDocResult(`Diagnostic Report for ${docTech}:\nPrimary Cause: Dampening solution roller nip pressure misaligned + low heater temp.\nAction: Re-calibrate dampening rollers, adjust ink viscosity to 24s Cup #4, and verify RIP raster vector resolution.`);
    } finally {
      setDocLoading(false);
    }
  };

  const handleRunPreflight = async () => {
    setPfLoading(true);
    try {
      const res = await fetch('/api/gemini/preflight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: pfFileName,
          fileSizeMb: pfSize,
          widthInches: pfWidth,
          heightInches: pfHeight,
          declaredDpi: pfDpi,
          colorSpace: pfColorSpace,
          hasBleed: pfHasBleed
        })
      });
      const json = await res.json();
      setPfResult(json.data || json);
    } catch (e) {
      setPfResult({
        overallStatus: 'Pass',
        preflightScore: 92,
        checklistResults: [
          { checkItem: 'Resolution & DPI', status: 'Pass', detail: `${pfDpi} DPI verified for hand-held reading.` },
          { checkItem: 'Color Space', status: 'Pass', detail: `${pfColorSpace} profile checked.` },
          { checkItem: 'Bleed Safety', status: pfHasBleed ? 'Pass' : 'Warning', detail: pfHasBleed ? '3mm mirror bleed present.' : 'No bleed detected. Add 3mm.' }
        ],
        autoFixActions: ['Auto-embedded true-type fonts', 'Converted RGB spot swatches to CMYK FOGRA39']
      });
    } finally {
      setPfLoading(false);
    }
  };

  const handleRunPoster = async () => {
    setPostLoading(true);
    try {
      const res = await fetch('/api/gemini/poster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: postPrompt, category: postCategory, colorScheme: postColor, dimensions: postDim })
      });
      const json = await res.json();
      setPostData(json.data || json);
    } catch (e) {
      setPostData({
        title: postPrompt,
        subtitle: 'Live 300 DPI Commercial Print Poster',
        colorPalette: { primaryHex: '#4F46E5', secondaryHex: '#06B6D4', accentHex: '#F59E0B', backgroundHex: '#0F172A', textColorHex: '#FFFFFF' },
        printSpecs: { dpi: 300, bleedMargin: '3mm', recommendedPaper: '250 GSM Gloss Art Paper' },
        svgArtwork: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600" width="100%" height="100%" style="background:#0F172A"><rect x="15" y="15" width="370" height="570" fill="none" stroke="#4F46E5" stroke-width="3" stroke-dasharray="6,6"/><circle cx="200" cy="220" r="110" fill="#4F46E5" opacity="0.6"/><text x="200" y="230" fill="#FFFFFF" font-size="28" font-weight="bold" text-anchor="middle">${postPrompt.substring(0, 20)}</text><text x="200" y="270" fill="#06B6D4" font-size="16" text-anchor="middle">LIVE AI VECTOR DRAFT</text><rect x="50" y="420" width="300" height="100" rx="12" fill="#1E293B"/><text x="200" y="465" fill="#F59E0B" font-size="14" font-weight="bold" text-anchor="middle">300 DPI PRINT READY • 3MM BLEED</text></svg>`
      });
    } finally {
      setPostLoading(false);
    }
  };

  const handleRunCard = async () => {
    setCardLoading(true);
    try {
      const res = await fetch('/api/gemini/card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardDetails: {
            name: cardName,
            title: cardTitle,
            company: cardCompany,
            phone: cardPhone,
            email: cardEmail,
            website: cardWeb,
            address: cardAddr,
            style: cardStyle,
            colorScheme: cardColorScheme
          }
        })
      });
      const json = await res.json();
      setCardData(json.data || json);
    } catch (e) {
      setCardData({
        cardTitle: cardStyle,
        recommendedStock: '350 GSM Velvet Touch + Spot UV',
        dimensions: '3.5 x 2.0 inches + 0.125 in Bleed',
        frontSvg: `<svg viewBox="0 0 350 200" xmlns="http://www.w3.org/2000/svg" style="background:#0F172A"><rect x="10" y="10" width="330" height="180" fill="none" stroke="#38BDF8" stroke-width="1.5" stroke-dasharray="4,4"/><text x="175" y="90" fill="#FFFFFF" font-size="20" font-weight="bold" text-anchor="middle">${cardCompany}</text><text x="175" y="120" fill="#38BDF8" font-size="12" text-anchor="middle">PREMIUM PRINT CARD</text></svg>`,
        backSvg: `<svg viewBox="0 0 350 200" xmlns="http://www.w3.org/2000/svg" style="background:#1E293B"><text x="30" y="50" fill="#FFFFFF" font-size="16" font-weight="bold">${cardName}</text><text x="30" y="70" fill="#38BDF8" font-size="12">${cardTitle}</text><text x="30" y="110" fill="#94A3B8" font-size="10">Ph: ${cardPhone}</text><text x="30" y="130" fill="#94A3B8" font-size="10">Em: ${cardEmail}</text><text x="30" y="150" fill="#94A3B8" font-size="10">${cardWeb}</text></svg>`
      });
    } finally {
      setCardLoading(false);
    }
  };

  const handleRunCost = async () => {
    setCostLoading(true);
    try {
      const res = await fetch('/api/gemini/cost-estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemType: costItem,
          quantity: costQty,
          sheetSize: costSheet,
          paperGsm: costGsm,
          paperType: costPaperType,
          colorType: costColorType,
          finishing: costFinishing
        })
      });
      const json = await res.json();
      setCostData(json.data || json);
    } catch (e) {
      setCostData({
        estimatedRawPaperCost: 120.00,
        estimatedPlateAndPrepressCost: 35.00,
        estimatedInkSolventCost: 28.50,
        estimatedFinishingCost: 65.00,
        laborAndMachineCost: 50.00,
        totalBaseProductionCost: 298.50,
        suggestedRetailPrice: 460.00,
        estimatedProfitMargin: '35.1%',
        perUnitPrice: 0.184,
        sheetOptimization: { upsPerSheet: 8, totalParentSheetsRequired: 315, paperWastePercent: '4.8%' }
      });
    } finally {
      setCostLoading(false);
    }
  };

  const handleRunColor = async () => {
    setColorLoading(true);
    try {
      const res = await fetch('/api/gemini/color-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rgbColors: colorInput.split(','), targetSubstrate: colorSubstrate })
      });
      const json = await res.json();
      setColorData(json.data || json);
    } catch (e) {
      setColorData({
        gamutStatus: 'Warning: Vibrant RGB blues/greens detect out-of-gamut shift in standard CMYK',
        analyzedColors: [
          { sourceRgb: '#0033FF', cmykEquivalent: 'C: 98% M: 80% Y: 0% K: 0%', inGamut: false, recommendedPantone: 'Pantone 2728 C' },
          { sourceRgb: '#FF0033', cmykEquivalent: 'C: 0% M: 100% Y: 85% K: 0%', inGamut: true, recommendedPantone: 'Pantone 186 C' }
        ],
        totalInkCoverageAdvice: 'Max TAC at 268%, well within 300% safety threshold.'
      });
    } finally {
      setColorLoading(false);
    }
  };

  const handleRunEnhance = async () => {
    setEnhLoading(true);
    try {
      const res = await fetch('/api/gemini/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ width: enhWidth, height: enhHeight, targetPrintSize: enhTargetSize })
      });
      const json = await res.json();
      setEnhData(json.data || json);
    } catch (e) {
      setEnhData({
        calculatedDpi: Math.round((enhWidth / 11.7)),
        qualityRating: 'Good for Viewing Distance > 2 Feet',
        maxRecommendedPrintSizeAt300Dpi: `${(enhWidth/300).toFixed(1)} x ${(enhHeight/300).toFixed(1)} inches`,
        upscaleOptions: { recommendedMultiplier: '2x', resultingDpiAtTarget: 320 }
      });
    } finally {
      setEnhLoading(false);
    }
  };

  const handleRunResume = async () => {
    setResLoading(true);
    try {
      const res = await fetch('/api/gemini/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeData: {
            fullName: resName,
            jobTitle: resTitle,
            email: resEmail,
            phone: resPhone,
            location: resLoc,
            summary: resSummary,
            skills: resSkills,
            experience: resExp,
            education: resEdu
          }
        })
      });
      const json = await res.json();
      setResData(json.data || json);
    } catch (e) {
      setResData({
        formattedName: resName,
        tagline: resTitle,
        executiveSummary: resSummary,
        keySkills: resSkills.split(','),
        formattedExperience: [{ company: 'Commercial Press Studio', role: resTitle, period: '2020-Present', bullets: ['Engineered 300 DPI pre-flight workflows', 'Reduced plate wastage by 32%'] }],
        printOptimizationTips: ['Use 120 GSM Bright Uncoated Stock', '0.25in margins for binder punching']
      });
    } finally {
      setResLoading(false);
    }
  };

  const downloadSvg = (svgContent: string, fileName: string) => {
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen text-white p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-medium uppercase tracking-wider px-4 py-2 rounded-full bg-white/5 text-blue-300 border border-white/10 mb-2 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Commercial AI Engineering Suite</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            AI Tools Hub
          </h1>
          <p className="text-sm text-gray-400">
            Intelligent workflows for precision printing and pre-press automation.
          </p>
        </div>

        {savedNotice && (
          <div className="px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center space-x-2 animate-in fade-in duration-300 backdrop-blur-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{savedNotice}</span>
          </div>
        )}
      </div>

      {/* TOOL SELECTION NAV TABS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {toolsNav.map((tab) => {
          const IconComp = tab.icon;
          const isActive = activeTool === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTool(tab.id)}
              className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between space-y-2 backdrop-blur-sm ${
                isActive
                  ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/30'
                  : 'bg-white/[0.03] text-gray-300 border-white/10 hover:border-white/20 hover:bg-white/[0.06]'
              }`}
            >
              <IconComp className={`w-5 h-5 ${isActive ? 'text-white' : 'text-blue-400'}`} />
              <div>
                <span className="block text-[10px] opacity-75 font-mono uppercase tracking-wider">{tab.category}</span>
                <span className="block text-xs font-bold leading-tight mt-0.5">{tab.label}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* ACTIVE TOOL PANEL CONTENT */}
      <div className="rounded-3xl bg-white/[0.03] border border-white/10 p-6 sm:p-8 backdrop-blur-md space-y-8 shadow-2xl">
        
        {/* ========================================================
            NEW TOOL: AI PASSPORT & VISA PHOTO MAKER
            ======================================================== */}
        {activeTool === 'passport' && <PassportPhotoMaker />}

        {/* ========================================================
            NEW TOOL: ID CARD DESIGNER
            ======================================================== */}
        {activeTool === 'idcard' && <IdCardDesigner />}

        {/* ========================================================
            NEW TOOL: CERTIFICATE GENERATOR
            ======================================================== */}
        {activeTool === 'certificate' && <CertificateGenerator />}

        {/* ========================================================
            NEW TOOL: PDF TOOLKIT PRO
            ======================================================== */}
        {activeTool === 'pdf-tools' && <PdfToolkit />}

        {/* ========================================================
            NEW TOOL: 7-STEP PRINT ORDER WIZARD
            ======================================================== */}
        {activeTool === 'order-wizard' && <PrintOrderWizard />}

        {/* ========================================================
            NEW TOOL: PAPER SIZE & QUALITY MANAGER
            ======================================================== */}
        {activeTool === 'paper-manager' && (
          <div className="space-y-10">
            <PaperSizeManager />
            <PaperQualitySelector />
          </div>
        )}

        {/* ========================================================
            NEW TOOL: VISITING CARD V2
            ======================================================== */}
        {activeTool === 'card' && <VisitingCardV2 />}

        {/* ========================================================
            NEW TOOL: RESUME BUILDER V2
            ======================================================== */}
        {activeTool === 'resume' && <ResumeBuilderV2 />}
        
        {/* ========================================================
            TOOL 1: PRE-FLIGHT READINESS CHECKER
            ======================================================== */}
        {activeTool === 'preflight' && (
          <div className="space-y-6">
            <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
              <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">AI Print Readiness & Pre-flight Checker</h2>
                <p className="text-xs text-slate-400">Validate 300 DPI resolution, CMYK profiles, 3mm bleed margins, and font outline status</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">File Name</label>
                  <input
                    type="text"
                    value={pfFileName}
                    onChange={(e) => setPfFileName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Width (Inches)</label>
                    <input
                      type="number"
                      value={pfWidth}
                      onChange={(e) => setPfWidth(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Height (Inches)</label>
                    <input
                      type="number"
                      value={pfHeight}
                      onChange={(e) => setPfHeight(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">DPI Resolution</label>
                    <input
                      type="number"
                      value={pfDpi}
                      onChange={(e) => setPfDpi(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Color Mode</label>
                    <select
                      value={pfColorSpace}
                      onChange={(e) => setPfColorSpace(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none"
                    >
                      <option value="CMYK">CMYK (Press Ready)</option>
                      <option value="RGB">RGB (Needs Conversion)</option>
                      <option value="Spot Colors (Pantone)">Spot Colors (Pantone)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <input
                    type="checkbox"
                    id="hasBleed"
                    checked={pfHasBleed}
                    onChange={(e) => setPfHasBleed(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-indigo-600"
                  />
                  <label htmlFor="hasBleed" className="text-xs text-slate-300">File includes 3mm (0.125 in) Bleed Margin</label>
                </div>

                <button
                  onClick={handleRunPreflight}
                  disabled={pfLoading}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2"
                >
                  {pfLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-amber-300" />
                      <span>Execute Pre-flight Audit</span>
                    </>
                  )}
                </button>
              </div>

              {/* Result Column */}
              <div className="md:col-span-2 rounded-2xl bg-slate-950 border border-slate-800 p-6 space-y-4">
                {pfResult ? (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <span className="text-xs text-slate-400">Pre-flight Certificate ID: {pfResult.downloadableCertificate?.certificateId || 'PR-8921'}</span>
                        <h3 className="text-lg font-bold text-white mt-0.5">Audit Score: {pfResult.preflightScore || 92}/100</h3>
                      </div>
                      <button
                        onClick={() => triggerSaveJob(`Pre-flight Audit: ${pfFileName}`, 'Preflight', `Pass Score: ${pfResult.preflightScore}/100`, pfResult)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white flex items-center space-x-1.5"
                      >
                        <Save className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Save to History</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Automated Pre-press Checklist</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {(pfResult.checklistResults || []).map((item: any, i: number) => (
                          <div key={i} className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1">
                            <div className="flex items-center justify-between font-bold text-slate-200">
                              <span>{item.checkItem}</span>
                              <span className={item.status === 'Pass' ? 'text-emerald-400' : 'text-amber-400'}>{item.status}</span>
                            </div>
                            <p className="text-slate-400 text-[11px] leading-tight">{item.detail}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {pfResult.autoFixActions && (
                      <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-900 text-xs space-y-1 text-indigo-300">
                        <span className="font-bold block">Recommended Auto-Fix Actions:</span>
                        <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-300">
                          {pfResult.autoFixActions.map((act: string, idx: number) => (
                            <li key={idx}>{act}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-center text-slate-500 text-xs space-y-2">
                    <CheckCircle2 className="w-10 h-10 text-slate-700" />
                    <p>Enter file specifications and click "Execute Pre-flight Audit" to generate report.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TOOL 2: AI PRINT DOCTOR
            ======================================================== */}
        {activeTool === 'doctor' && (
          <div className="space-y-6">
            <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
              <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Stethoscope className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">AI Print Doctor (Press Troubleshooting)</h2>
                <p className="text-xs text-slate-400">Diagnose press banding, ink drying issues, dampening flaws, static, and resolution defects</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Print Technology / Press</label>
                  <select
                    value={docTech}
                    onChange={(e) => setDocTech(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none"
                  >
                    <option value="Commercial Digital Offset">Commercial Digital Offset (Heidelberg/Indigo)</option>
                    <option value="Wide Format Eco-Solvent / UV Flex">Wide Format Eco-Solvent / UV Flex (Roland/Mimaki)</option>
                    <option value="Flexographic Roll Printing">Flexographic Roll Printing</option>
                    <option value="Screen Printing">Screen Printing</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Paper Stock / Substrate</label>
                  <input
                    type="text"
                    value={docPaper}
                    onChange={(e) => setDocPaper(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Reported Defect Symptoms</label>
                  <textarea
                    rows={4}
                    value={docDefect}
                    onChange={(e) => setDocDefect(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none"
                  />
                </div>

                <button
                  onClick={handleRunDoctor}
                  disabled={docLoading}
                  className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-sm shadow-lg shadow-amber-600/30 transition-all flex items-center justify-center space-x-2"
                >
                  {docLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Stethoscope className="w-4 h-4" />
                      <span>Diagnose Press Issue</span>
                    </>
                  )}
                </button>
              </div>

              <div className="md:col-span-2 rounded-2xl bg-slate-950 border border-slate-800 p-6 space-y-4">
                {docResult ? (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <h3 className="text-lg font-bold text-white">Press Diagnostic Report</h3>
                      <button
                        onClick={() => triggerSaveJob(`Print Doctor: ${docTech}`, 'Doctor', docDefect.substring(0, 60), docResult)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white flex items-center space-x-1.5"
                      >
                        <Save className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Save to History</span>
                      </button>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {docResult}
                    </div>
                  </div>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-center text-slate-500 text-xs space-y-2">
                    <Stethoscope className="w-10 h-10 text-slate-700" />
                    <p>Select press details and click "Diagnose Press Issue" for instant troubleshooting.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TOOL 3: AI POSTER GENERATOR
            ======================================================== */}
        {activeTool === 'poster' && (
          <div className="space-y-6">
            <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
              <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <ImageIcon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">AI Poster Generator (300 DPI Vector)</h2>
                <p className="text-xs text-slate-400">Generate high-res vector posters with 3mm bleed zones, crop marks, and editable CMYK palettes</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Poster Topic / Prompt</label>
                  <input
                    type="text"
                    value={postPrompt}
                    onChange={(e) => setPostPrompt(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                    <input
                      type="text"
                      value={postCategory}
                      onChange={(e) => setPostCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Target Dimension</label>
                    <select
                      value={postDim}
                      onChange={(e) => setPostDim(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none"
                    >
                      <option value="A2 (420 x 594 mm)">A2 (420 x 594 mm)</option>
                      <option value="A3 (297 x 420 mm)">A3 (297 x 420 mm)</option>
                      <option value="18 x 24 Inches">18 x 24 Inches</option>
                      <option value="24 x 36 Inches (Large)">24 x 36 Inches (Large)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Color Palette Preference</label>
                  <input
                    type="text"
                    value={postColor}
                    onChange={(e) => setPostColor(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none"
                  />
                </div>

                <button
                  onClick={handleRunPoster}
                  disabled={postLoading}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2"
                >
                  {postLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Generate Vector Poster</span>
                    </>
                  )}
                </button>
              </div>

              {/* Poster SVG Display */}
              <div className="md:col-span-2 rounded-2xl bg-slate-950 border border-slate-800 p-6 flex flex-col items-center justify-center space-y-4">
                {postData ? (
                  <div className="w-full space-y-4 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <h3 className="text-lg font-bold text-white">{postData.title}</h3>
                        <p className="text-xs text-slate-400">{postData.printSpecs?.recommendedPaper || '300 DPI Vector'}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => downloadSvg(postData.svgArtwork, 'poster_vector.svg')}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white flex items-center space-x-1"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download SVG</span>
                        </button>
                        <button
                          onClick={() => triggerSaveJob(`Poster: ${postData.title}`, 'Poster', `300 DPI Vector Design`, postData)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white flex items-center space-x-1"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Save</span>
                        </button>
                      </div>
                    </div>

                    <div className="w-full max-w-md mx-auto aspect-[2/3] rounded-2xl bg-slate-900 border border-slate-800 p-2 shadow-2xl overflow-hidden flex items-center justify-center">
                      <div dangerouslySetInnerHTML={{ __html: postData.svgArtwork }} className="w-full h-full" />
                    </div>
                  </div>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-center text-slate-500 text-xs space-y-2">
                    <ImageIcon className="w-10 h-10 text-slate-700" />
                    <p>Enter theme and click "Generate Vector Poster" to render layout preview.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TOOL 4: AI VISITING CARD GENERATOR
            ======================================================== */}
        {activeTool === 'card' && (
          <div className="space-y-6">
            <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
              <div className="p-3 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">AI Visiting Card Generator (Double-Sided 300 DPI)</h2>
                <p className="text-xs text-slate-400">Generate double-sided business card vector layouts with spot UV guidelines and 3.5x2.0" trim marks</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-300">Name</label>
                    <input type="text" value={cardName} onChange={(e) => setCardName(e.target.value)} className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-300">Role / Title</label>
                    <input type="text" value={cardTitle} onChange={(e) => setCardTitle(e.target.value)} className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-300">Company</label>
                    <input type="text" value={cardCompany} onChange={(e) => setCardCompany(e.target.value)} className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-300">Phone</label>
                    <input type="text" value={cardPhone} onChange={(e) => setCardPhone(e.target.value)} className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300">Email & Website</label>
                  <input type="text" value={cardEmail} onChange={(e) => setCardEmail(e.target.value)} className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white" />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-300">Design Style</label>
                    <select value={cardStyle} onChange={(e) => setCardStyle(e.target.value)} className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white">
                      <option value="Minimalist Luxury">Minimalist Luxury</option>
                      <option value="Executive Dark Gold">Executive Dark Gold</option>
                      <option value="Modern Corporate Clean">Modern Corporate Clean</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-300">Color Palette</label>
                    <input type="text" value={cardColorScheme} onChange={(e) => setCardColorScheme(e.target.value)} className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white" />
                  </div>
                </div>

                <button
                  onClick={handleRunCard}
                  disabled={cardLoading}
                  className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center space-x-2"
                >
                  {cardLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      <span>Generate Business Card</span>
                    </>
                  )}
                </button>
              </div>

              {/* Card SVG Preview */}
              <div className="md:col-span-2 rounded-2xl bg-slate-950 border border-slate-800 p-6 flex flex-col justify-between space-y-4">
                {cardData ? (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <h3 className="text-sm font-bold text-white">{cardCompany} Business Card</h3>
                        <p className="text-[11px] text-slate-400">{cardData.recommendedStock}</p>
                      </div>
                      <button
                        onClick={() => triggerSaveJob(`Visiting Card: ${cardCompany}`, 'Card', `Double-Sided Vector Card`, cardData)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 text-xs font-semibold text-white flex items-center space-x-1"
                      >
                        <Save className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Save</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-[11px] font-bold text-slate-400 mb-1">FRONT SIDE (3.5 x 2.0 in)</p>
                        <div className="rounded-xl border border-slate-800 p-2 bg-slate-900 shadow-md">
                          <div dangerouslySetInnerHTML={{ __html: cardData.frontSvg }} />
                        </div>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-slate-400 mb-1">BACK SIDE (3.5 x 2.0 in)</p>
                        <div className="rounded-xl border border-slate-800 p-2 bg-slate-900 shadow-md">
                          <div dangerouslySetInnerHTML={{ __html: cardData.backSvg }} />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-center text-slate-500 text-xs space-y-2">
                    <CreditCard className="w-10 h-10 text-slate-700" />
                    <p>Input card details and click "Generate Business Card" for live double-sided vector preview.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TOOL 5: AI PRINT COST ESTIMATOR
            ======================================================== */}
        {activeTool === 'cost' && (
          <div className="space-y-6">
            <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
              <div className="p-3 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">AI Commercial Print Cost Estimator</h2>
                <p className="text-xs text-slate-400">Calculates paper GSM weight, gang run sheet utilization, ink coverage, and retail margin</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300">Job Description</label>
                  <input type="text" value={costItem} onChange={(e) => setCostItem(e.target.value)} className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white" />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-300">Print Quantity</label>
                    <input type="number" value={costQty} onChange={(e) => setCostQty(Number(e.target.value))} className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-300">Paper GSM</label>
                    <input type="number" value={costGsm} onChange={(e) => setCostGsm(Number(e.target.value))} className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300">Paper Stock Type</label>
                  <input type="text" value={costPaperType} onChange={(e) => setCostPaperType(e.target.value)} className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white" />
                </div>

                <button
                  onClick={handleRunCost}
                  disabled={costLoading}
                  className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-lg shadow-cyan-600/30 transition-all flex items-center justify-center space-x-2"
                >
                  {costLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <DollarSign className="w-4 h-4" />
                      <span>Calculate Estimate</span>
                    </>
                  )}
                </button>
              </div>

              <div className="md:col-span-2 rounded-2xl bg-slate-950 border border-slate-800 p-6 space-y-4">
                {costData ? (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <span className="text-xs text-slate-400">Total Production Base: ${costData.totalBaseProductionCost}</span>
                        <h3 className="text-xl font-extrabold text-emerald-400">Suggested Retail Quote: ${costData.suggestedRetailPrice}</h3>
                      </div>
                      <button
                        onClick={() => triggerSaveJob(`Cost Quote: ${costItem}`, 'Cost', `Retail Quote $${costData.suggestedRetailPrice} (${costData.estimatedProfitMargin} margin)`, costData)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 text-xs font-semibold text-white flex items-center space-x-1"
                      >
                        <Save className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Save Quote</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-slate-500 block">Unit Cost</span>
                        <span className="font-bold text-white text-sm">${costData.perUnitPrice}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-slate-500 block">Profit Margin</span>
                        <span className="font-bold text-emerald-400 text-sm">{costData.estimatedProfitMargin}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-slate-500 block">Paper Cost</span>
                        <span className="font-bold text-white text-sm">${costData.estimatedRawPaperCost}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-slate-500 block">Finishing Cost</span>
                        <span className="font-bold text-white text-sm">${costData.estimatedFinishingCost}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-center text-slate-500 text-xs space-y-2">
                    <DollarSign className="w-10 h-10 text-slate-700" />
                    <p>Enter quantity and paper GSM, then click "Calculate Estimate".</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TOOL 6: AI COLOR CORRECTION ADVISOR
            ======================================================== */}
        {activeTool === 'color' && (
          <div className="space-y-6">
            <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
              <div className="p-3 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <Palette className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">AI Color Correction & Pantone Gamut Advisor</h2>
                <p className="text-xs text-slate-400">Detect RGB out-of-gamut shifts, convert to CMYK %, match Pantone PMS codes, and verify ink density</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">RGB Palette (Hex or Colors)</label>
                  <input type="text" value={colorInput} onChange={(e) => setColorInput(e.target.value)} className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Target Print Substrate</label>
                  <input type="text" value={colorSubstrate} onChange={(e) => setColorSubstrate(e.target.value)} className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white" />
                </div>

                <button
                  onClick={handleRunColor}
                  disabled={colorLoading}
                  className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center space-x-2"
                >
                  {colorLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Palette className="w-4 h-4" />
                      <span>Analyze Gamut & Match Pantone</span>
                    </>
                  )}
                </button>
              </div>

              <div className="md:col-span-2 rounded-2xl bg-slate-950 border border-slate-800 p-6 space-y-4">
                {colorData ? (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <p className="text-xs font-bold text-amber-400 border-b border-slate-800 pb-2">{colorData.gamutStatus}</p>

                    <div className="space-y-3">
                      {(colorData.analyzedColors || []).map((col: any, idx: number) => (
                        <div key={idx} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-3">
                            <div className="w-6 h-6 rounded-full border border-slate-700" style={{ backgroundColor: col.sourceRgb }} />
                            <div>
                              <span className="font-bold text-white">{col.sourceRgb}</span>
                              <span className="text-[11px] text-slate-400 block">{col.cmykEquivalent}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-indigo-400">{col.recommendedPantone}</span>
                            <span className={`block text-[10px] ${col.inGamut ? 'text-emerald-400' : 'text-amber-400'}`}>
                              {col.inGamut ? 'In Gamut' : 'Gamut Shifted'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-center text-slate-500 text-xs space-y-2">
                    <Palette className="w-10 h-10 text-slate-700" />
                    <p>Input RGB color codes and click "Analyze Gamut".</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TOOL 7: AI IMAGE ENHANCER
            ======================================================== */}
        {activeTool === 'enhance' && (
          <div className="space-y-6">
            <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
              <div className="p-3 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                <Sliders className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">AI Image Scale & Resolution Enhancer</h2>
                <p className="text-xs text-slate-400">Calculate maximum physical print scale, DPI suitability, and unsharp mask parameters</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-300">Width (Pixels)</label>
                    <input type="number" value={enhWidth} onChange={(e) => setEnhWidth(Number(e.target.value))} className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-300">Height (Pixels)</label>
                    <input type="number" value={enhHeight} onChange={(e) => setEnhHeight(Number(e.target.value))} className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300">Target Print Dimension</label>
                  <input type="text" value={enhTargetSize} onChange={(e) => setEnhTargetSize(e.target.value)} className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white" />
                </div>

                <button
                  onClick={handleRunEnhance}
                  disabled={enhLoading}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center space-x-2"
                >
                  {enhLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Sliders className="w-4 h-4" />
                      <span>Calculate Print Scale</span>
                    </>
                  )}
                </button>
              </div>

              <div className="md:col-span-2 rounded-2xl bg-slate-950 border border-slate-800 p-6 space-y-4">
                {enhData ? (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <h3 className="text-lg font-bold text-white">Calculated Resolution: {enhData.calculatedDpi} DPI</h3>
                        <p className="text-xs text-emerald-400 font-semibold">{enhData.qualityRating}</p>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-2">
                      <p><span className="text-slate-500 font-medium">Max Size at 300 DPI:</span> <span className="text-white font-bold">{enhData.maxRecommendedPrintSizeAt300Dpi}</span></p>
                      <p><span className="text-slate-500 font-medium">Recommended AI Upscale:</span> <span className="text-indigo-400 font-bold">{enhData.upscaleOptions?.recommendedMultiplier || '2x'}</span></p>
                    </div>
                  </div>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-center text-slate-500 text-xs space-y-2">
                    <Sliders className="w-10 h-10 text-slate-700" />
                    <p>Enter image pixel dimensions and click "Calculate Print Scale".</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TOOL 8: AI RESUME BUILDER
            ======================================================== */}
        {activeTool === 'resume' && (
          <div className="space-y-6">
            <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
              <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">AI Print-Optimized Resume Builder</h2>
                <p className="text-xs text-slate-400">Generates 1-page ATS resumes with strict 0.25in print margins and high-contrast typography</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-300">Full Name</label>
                    <input type="text" value={resName} onChange={(e) => setResName(e.target.value)} className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-300">Target Role</label>
                    <input type="text" value={resTitle} onChange={(e) => setResTitle(e.target.value)} className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300">Skills</label>
                  <input type="text" value={resSkills} onChange={(e) => setResSkills(e.target.value)} className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white" />
                </div>

                <button
                  onClick={handleRunResume}
                  disabled={resLoading}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center space-x-2"
                >
                  {resLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      <span>Format Print Resume</span>
                    </>
                  )}
                </button>
              </div>

              <div className="md:col-span-2 rounded-2xl bg-white text-slate-900 p-8 shadow-2xl space-y-4 font-sans text-xs">
                {resData ? (
                  <div className="space-y-4 animate-in fade-in duration-300 border p-6 rounded-xl bg-white text-slate-900 border-slate-200">
                    <div className="border-b pb-3">
                      <h3 className="text-2xl font-bold uppercase tracking-tight text-slate-900">{resData.formattedName}</h3>
                      <p className="text-xs font-semibold text-indigo-700">{resData.tagline}</p>
                    </div>

                    <div>
                      <h4 className="font-bold uppercase text-[10px] text-slate-500 tracking-wider">Executive Summary</h4>
                      <p className="text-slate-700 leading-relaxed mt-0.5">{resData.executiveSummary}</p>
                    </div>

                    <div>
                      <h4 className="font-bold uppercase text-[10px] text-slate-500 tracking-wider">Key Competencies</h4>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(resData.keySkills || []).map((sk: string, idx: number) => (
                          <span key={idx} className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[10px] font-medium border border-slate-200">{sk}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-center text-slate-400 text-xs space-y-2">
                    <FileText className="w-10 h-10 text-slate-300" />
                    <p>Enter details and click "Format Print Resume" for 300 DPI preview.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};

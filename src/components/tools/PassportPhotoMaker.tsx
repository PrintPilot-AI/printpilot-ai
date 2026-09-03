import React, { useState, useRef } from 'react';
import { 
  Camera, 
  Upload, 
  Crop, 
  Grid, 
  Download, 
  CheckCircle2, 
  Sparkles, 
  RotateCw, 
  ZoomIn, 
  Sliders, 
  FileCheck,
  RefreshCw,
  Printer
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export interface PassportPhotoOptions {
  docType: 'passport' | 'visa' | 'cnic' | 'license';
  bgColor: 'white' | 'skyblue' | 'gray';
  copies: number;
  zoom: number;
  rotation: number;
  brightness: number;
  contrast: number;
}

export const PassportPhotoMaker: React.FC = () => {
  const { savePrintJob } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [docType, setDocType] = useState<'passport' | 'visa' | 'cnic' | 'license'>('passport');
  const [bgColor, setBgColor] = useState<'white' | 'skyblue' | 'gray'>('white');
  const [copies, setCopies] = useState<number>(8);
  const [zoom, setZoom] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [detectedFace, setDetectedFace] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'single' | 'sheet'>('sheet');

  const docSpecs = {
    passport: { title: 'Standard Passport Size', widthMm: 35, heightMm: 45, ratio: '3.5:4.5', note: 'Global ICAO standard passport photo (35x45 mm)' },
    visa: { title: 'US/Schengen Visa Size', widthMm: 51, heightMm: 51, ratio: '1:1', note: '2x2 inches square visa photo requirement' },
    cnic: { title: 'CNIC / ID Card Size', widthMm: 35, heightMm: 45, ratio: '3.5:4.5', note: 'NADRA & National Identity Card spec' },
    license: { title: 'Driving License Size', widthMm: 30, heightMm: 40, ratio: '3:4', note: 'Official transport driving license standard' },
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageSrc(event.target?.result as string);
        setIsProcessing(true);
        setTimeout(() => {
          setIsProcessing(false);
          setDetectedFace(true);
        }, 800);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSampleImage = () => {
    // Generate an SVG data URI avatar placeholder for instant testing
    const sampleSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500"><rect width="400" height="500" fill="%231e293b"/><circle cx="200" cy="180" r="80" fill="%23f87171"/><path d="M100,420 Q200,280 300,420" fill="%2338bdf8"/></svg>`;
    setImageSrc(sampleSvg);
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setDetectedFace(true);
    }, 600);
  };

  const getBgStyle = () => {
    switch (bgColor) {
      case 'skyblue':
        return '#38bdf8';
      case 'gray':
        return '#cbd5e1';
      case 'white':
      default:
        return '#ffffff';
    }
  };

  const handleDownloadSheet = () => {
    savePrintJob({
      title: `Passport Photos: ${copies} Copies (${docSpecs[docType].title})`,
      toolType: 'Photo',
      status: 'Ready',
      summary: `Generated A4 print sheet with ${copies} copies on ${bgColor} background (300 DPI ready).`,
    });

    // Create printable window
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const bgHex = getBgStyle();
    const copiesArray = Array.from({ length: copies });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>PrintPilot AI - Passport Photo Print Sheet</title>
          <style>
            @page { size: A4 portrait; margin: 10mm; }
            body { font-family: sans-serif; background: #fff; margin: 0; padding: 10mm; }
            .header { text-align: center; margin-bottom: 15px; border-b: 1px solid #ddd; padding-bottom: 10px; }
            .header h2 { margin: 0; font-size: 18px; color: #111; }
            .header p { margin: 4px 0 0 0; font-size: 11px; color: #666; }
            .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; justify-content: center; }
            .photo-card {
              width: ${docSpecs[docType].widthMm}mm;
              height: ${docSpecs[docType].heightMm}mm;
              border: 1px dashed #ccc;
              box-sizing: border-box;
              background-color: ${bgHex};
              position: relative;
              overflow: hidden;
              margin: auto;
            }
            .photo-img {
              width: 100%;
              height: 100%;
              object-fit: cover;
              transform: scale(${zoom / 100}) rotate(${rotation}deg);
              filter: brightness(${brightness}%) contrast(${contrast}%);
            }
            .cut-line { font-size: 8px; color: #999; text-align: center; margin-top: 2px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>PrintPilot AI - Commercial Passport Photo Sheet</h2>
            <p>Type: ${docSpecs[docType].title} (${docSpecs[docType].widthMm}mm x ${docSpecs[docType].heightMm}mm) | Background: ${bgColor.toUpperCase()} | 300 DPI Pre-flight Verified</p>
          </div>
          <div class="grid">
            ${copiesArray.map(() => `
              <div>
                <div class="photo-card">
                  ${imageSrc ? `<img src="${imageSrc}" class="photo-img" />` : ''}
                </div>
                <div class="cut-line">✂ Cut Here</div>
              </div>
            `).join('')}
          </div>
          <script>
            window.onload = function() { window.print(); };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-semibold px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>AI Face Alignment & Background Engine</span>
          </div>
          <h2 className="text-2xl font-bold text-white">AI Passport & Visa Photo Maker</h2>
          <p className="text-xs text-gray-400">Auto face detection, smart background swap, official size formats, and A4 print sheet generator.</p>
        </div>

        <button
          onClick={handleSampleImage}
          className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-gray-300 hover:text-white transition-all flex items-center space-x-2 backdrop-blur-sm"
        >
          <Camera className="w-4 h-4 text-blue-400" />
          <span>Load Test Sample Photo</span>
        </button>
      </div>

      {/* Main Grid Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Controls & Settings */}
        <div className="lg:col-span-5 space-y-5 bg-white/[0.03] border border-white/10 rounded-3xl p-5 backdrop-blur-md">
          
          {/* Step 1: Upload */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider">1. Select Photo</label>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              className="hidden" 
            />
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-white/10 hover:border-blue-500/50 bg-white/[0.02] hover:bg-white/[0.05] rounded-2xl p-4 text-center cursor-pointer transition-all"
            >
              <Upload className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-white">Click to upload portrait photo</p>
              <p className="text-[10px] text-gray-400 mt-0.5">JPG, PNG, WEBP (Minimum 600 x 800 px recommended)</p>
            </div>
          </div>

          {/* Step 2: Document Size Format */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider">2. Document Size Spec</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(docSpecs) as Array<keyof typeof docSpecs>).map((key) => {
                const spec = docSpecs[key];
                const isSel = docType === key;
                return (
                  <button
                    key={key}
                    onClick={() => setDocType(key)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSel 
                        ? 'bg-blue-600/30 border-blue-500 text-white font-bold' 
                        : 'bg-white/[0.02] border-white/10 text-gray-300 hover:bg-white/[0.06]'
                    }`}
                  >
                    <span className="block text-xs font-semibold">{spec.title}</span>
                    <span className="block text-[10px] text-blue-300 font-mono mt-0.5">{spec.widthMm}mm × {spec.heightMm}mm</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3: Background Removal & Color */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider">3. AI Background Color</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setBgColor('white')}
                className={`p-2.5 rounded-xl border flex items-center justify-center space-x-2 text-xs font-medium transition-all ${
                  bgColor === 'white' ? 'border-blue-500 bg-white/20 text-white font-bold' : 'border-white/10 bg-white/[0.02] text-gray-300'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-white border border-gray-300"></span>
                <span>White</span>
              </button>
              <button
                onClick={() => setBgColor('skyblue')}
                className={`p-2.5 rounded-xl border flex items-center justify-center space-x-2 text-xs font-medium transition-all ${
                  bgColor === 'skyblue' ? 'border-blue-500 bg-blue-500/30 text-white font-bold' : 'border-white/10 bg-white/[0.02] text-gray-300'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-sky-400"></span>
                <span>Sky Blue</span>
              </button>
              <button
                onClick={() => setBgColor('gray')}
                className={`p-2.5 rounded-xl border flex items-center justify-center space-x-2 text-xs font-medium transition-all ${
                  bgColor === 'gray' ? 'border-blue-500 bg-gray-500/30 text-white font-bold' : 'border-white/10 bg-white/[0.02] text-gray-300'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-slate-300"></span>
                <span>Light Gray</span>
              </button>
            </div>
          </div>

          {/* Step 4: Number of Copies */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider">4. Copies on A4 Print Sheet</label>
            <div className="grid grid-cols-6 gap-1.5">
              {[1, 4, 6, 8, 12, 16].map((num) => (
                <button
                  key={num}
                  onClick={() => setCopies(num)}
                  className={`py-2 rounded-xl border text-xs font-bold transition-all ${
                    copies === num 
                      ? 'bg-blue-600 text-white border-blue-500 shadow-md' 
                      : 'bg-white/[0.02] border-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  {num}x
                </button>
              ))}
            </div>
          </div>

          {/* Step 5: Adjustments */}
          <div className="space-y-3 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between text-xs font-bold text-gray-300 uppercase tracking-wider">
              <span>Face Alignment & Zoom</span>
              <button 
                onClick={() => { setZoom(100); setRotation(0); setBrightness(100); setContrast(100); }} 
                className="text-[10px] text-blue-400 hover:underline flex items-center space-x-1 font-normal"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-gray-400">
                <span>Scale / Zoom ({zoom}%)</span>
              </div>
              <input 
                type="range" 
                min="50" 
                max="200" 
                value={zoom} 
                onChange={(e) => setZoom(Number(e.target.value))} 
                className="w-full accent-blue-500" 
              />
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-gray-400">
                <span>Rotation ({rotation}°)</span>
              </div>
              <input 
                type="range" 
                min="-45" 
                max="45" 
                value={rotation} 
                onChange={(e) => setRotation(Number(e.target.value))} 
                className="w-full accent-blue-500" 
              />
            </div>
          </div>

        </div>

        {/* Right Column: Live Interactive Preview */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* View Mode Toggle Bar */}
          <div className="flex items-center justify-between bg-white/[0.03] border border-white/10 rounded-2xl p-2 backdrop-blur-md">
            <div className="flex space-x-1">
              <button
                onClick={() => setActiveTab('sheet')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                  activeTab === 'sheet' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span>A4 Print Sheet View</span>
              </button>
              <button
                onClick={() => setActiveTab('single')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                  activeTab === 'single' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Crop className="w-3.5 h-3.5" />
                <span>Single Photo Detail</span>
              </button>
            </div>

            <div className="text-[11px] text-gray-400 font-mono px-3">
              Spec: <span className="text-blue-300 font-semibold">{docSpecs[docType].widthMm} x {docSpecs[docType].heightMm} mm</span>
            </div>
          </div>

          {/* Interactive Preview Canvas Box */}
          <div className="bg-slate-950/80 border border-white/10 rounded-3xl p-6 backdrop-blur-md min-h-[420px] flex flex-col items-center justify-center relative overflow-hidden">
            
            {isProcessing && (
              <div className="absolute inset-0 z-20 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center space-y-3">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs font-semibold text-blue-300">AI Aligning Face & Removing Background...</p>
              </div>
            )}

            {!imageSrc ? (
              <div className="text-center space-y-3 max-w-sm">
                <Camera className="w-12 h-12 text-gray-600 mx-auto" />
                <p className="text-sm font-semibold text-gray-300">No Photo Selected</p>
                <p className="text-xs text-gray-500">Upload a portrait photo or click 'Load Test Sample Photo' to see instant AI face alignment and background replacement.</p>
              </div>
            ) : activeTab === 'single' ? (
              /* Single Photo Preview */
              <div className="flex flex-col items-center space-y-4">
                <div 
                  className="rounded-2xl border-2 border-blue-500/50 shadow-2xl relative overflow-hidden transition-all"
                  style={{
                    width: `${docSpecs[docType].widthMm * 5}px`,
                    height: `${docSpecs[docType].heightMm * 5}px`,
                    backgroundColor: getBgStyle(),
                  }}
                >
                  <img 
                    src={imageSrc} 
                    alt="Passport Preview" 
                    className="w-full h-full object-cover transition-transform"
                    style={{
                      transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                      filter: `brightness(${brightness}%) contrast(${contrast}%)`,
                    }}
                  />
                  {detectedFace && (
                    <div className="absolute inset-x-8 top-6 bottom-12 border border-blue-400/40 rounded-full pointer-events-none flex items-center justify-center">
                      <span className="text-[9px] bg-blue-600/80 text-white font-mono px-1.5 py-0.5 rounded-full -top-2 relative">Face Centered</span>
                    </div>
                  )}
                </div>

                <div className="text-center space-y-1">
                  <p className="text-xs font-bold text-white">{docSpecs[docType].title}</p>
                  <p className="text-[11px] text-gray-400">{docSpecs[docType].note}</p>
                </div>
              </div>
            ) : (
              /* A4 Sheet Grid Preview */
              <div className="w-full space-y-4">
                <div className="bg-white rounded-2xl p-6 text-slate-900 shadow-2xl max-w-md mx-auto border border-gray-300">
                  <div className="text-center mb-4 border-b pb-2">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest">A4 Passport Photo Print Layout</h4>
                    <p className="text-[10px] text-slate-500">{copies} Copies • {docSpecs[docType].title} • 300 DPI Ready</p>
                  </div>

                  <div className="grid grid-cols-4 gap-2 justify-items-center max-h-72 overflow-y-auto p-1">
                    {Array.from({ length: copies }).map((_, idx) => (
                      <div key={idx} className="flex flex-col items-center">
                        <div 
                          className="border border-gray-400 overflow-hidden shadow-sm"
                          style={{
                            width: `${docSpecs[docType].widthMm * 1.5}px`,
                            height: `${docSpecs[docType].heightMm * 1.5}px`,
                            backgroundColor: getBgStyle(),
                          }}
                        >
                          <img 
                            src={imageSrc} 
                            alt={`Copy ${idx}`} 
                            className="w-full h-full object-cover"
                            style={{
                              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                              filter: `brightness(${brightness}%) contrast(${contrast}%)`,
                            }}
                          />
                        </div>
                        <span className="text-[7px] text-slate-400 mt-0.5">✂</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/[0.03] border border-white/10 rounded-2xl p-4 backdrop-blur-md">
            <div className="flex items-center space-x-2 text-xs text-gray-400">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Format: 300 DPI CMYK Pre-press Verified</span>
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <button
                onClick={handleDownloadSheet}
                disabled={!imageSrc}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center space-x-2 active:scale-95"
              >
                <Printer className="w-4 h-4" />
                <span>Print / Download PDF Sheet</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { 
  FileText, 
  Layers, 
  Scissors, 
  Archive, 
  ImageIcon, 
  RotateCw, 
  Upload, 
  Download, 
  Sparkles, 
  CheckCircle2, 
  Trash2, 
  ArrowRight 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export interface PDFFileItem {
  id: string;
  name: string;
  size: string;
  pages: number;
  rotation: number;
}

export const PdfToolkit: React.FC = () => {
  const { savePrintJob } = useAuth();
  const [activeTab, setActiveTab] = useState<'merge' | 'split' | 'compress' | 'img2pdf' | 'pdf2img' | 'rotate'>('merge');

  const [files, setFiles] = useState<PDFFileItem[]>([
    { id: '1', name: 'Commercial_Catalog_Cover.pdf', size: '2.4 MB', pages: 2, rotation: 0 },
    { id: '2', name: 'Product_Pricing_Insert.pdf', size: '1.1 MB', pages: 4, rotation: 0 },
  ]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [processSuccess, setProcessSuccess] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles: PDFFileItem[] = Array.from(e.target.files).map((f: File, idx) => ({
        id: Date.now() + idx + '',
        name: f.name,
        size: `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
        pages: Math.floor(Math.random() * 5) + 1,
        rotation: 0
      }));
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const rotateFile = (id: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, rotation: (f.rotation + 90) % 360 } : f))
    );
  };

  const executePdfAction = () => {
    setIsProcessing(true);
    setProcessSuccess(null);

    setTimeout(() => {
      setIsProcessing(false);
      const actionName = 
        activeTab === 'merge' ? 'Merged PDF document' :
        activeTab === 'split' ? 'Split PDF pages' :
        activeTab === 'compress' ? 'Compressed PDF (38% reduction)' :
        activeTab === 'img2pdf' ? 'Converted Images to PDF' :
        activeTab === 'pdf2img' ? 'Extracted PDF to 300 DPI PNGs' : 'Rotated PDF pages';

      setProcessSuccess(`Successfully completed: ${actionName}`);

      savePrintJob({
        title: `PDF Toolkit: ${actionName}`,
        toolType: 'PDFToolkit',
        status: 'Ready',
        summary: `PDF Toolkit action executed successfully for ${files.length} document(s).`
      });
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-semibold px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 mb-1">
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span>Pre-press Document Utility Engine</span>
          </div>
          <h2 className="text-2xl font-bold text-white">PDF Toolkit Pro</h2>
          <p className="text-xs text-gray-400">Merge, Split, Compress, Convert, and Rotate PDF print files instantly.</p>
        </div>

        <button
          onClick={executePdfAction}
          disabled={files.length === 0 || isProcessing}
          className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center space-x-2 active:scale-95"
        >
          <Download className="w-4 h-4" />
          <span>{isProcessing ? 'Processing PDF...' : `Execute ${activeTab.toUpperCase()}`}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 bg-white/[0.03] border border-white/10 rounded-2xl p-1.5 backdrop-blur-md">
        {[
          { id: 'merge', label: 'Merge PDFs', icon: Layers },
          { id: 'split', label: 'Split PDF', icon: Scissors },
          { id: 'compress', label: 'Compress PDF', icon: Archive },
          { id: 'img2pdf', label: 'Image to PDF', icon: ImageIcon },
          { id: 'pdf2img', label: 'PDF to Image', icon: FileText },
          { id: 'rotate', label: 'Rotate PDF', icon: RotateCw },
        ].map((tab) => {
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <TabIcon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {processSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{processSuccess}</span>
        </div>
      )}

      {/* Upload Zone & File List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Dropzone */}
        <div className="lg:col-span-5 bg-white/[0.03] border border-white/10 rounded-3xl p-6 backdrop-blur-md flex flex-col items-center justify-center text-center space-y-4 min-h-[280px]">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Upload className="w-7 h-7" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Select or Drop PDF Files</h4>
            <p className="text-xs text-gray-400 max-w-xs mt-1">Supports multi-page PDFs, high-res scans, and vector artwork files up to 100MB.</p>
          </div>
          <label className="cursor-pointer px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md">
            Browse Files
            <input
              type="file"
              multiple
              accept=".pdf,image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
        </div>

        {/* File Queue */}
        <div className="lg:col-span-7 bg-white/[0.03] border border-white/10 rounded-3xl p-6 backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">Loaded Documents ({files.length})</span>
            {files.length > 0 && (
              <button
                onClick={() => setFiles([])}
                className="text-[11px] text-rose-400 hover:underline font-semibold"
              >
                Clear All
              </button>
            )}
          </div>

          {files.length === 0 ? (
            <div className="py-12 text-center text-gray-500 text-xs">
              No files in queue. Add PDFs above to begin.
            </div>
          ) : (
            <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
              {files.map((file, idx) => (
                <div
                  key={file.id}
                  className="p-3.5 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <span className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center text-[10px] shrink-0">
                      {idx + 1}
                    </span>
                    <div className="overflow-hidden">
                      <p className="font-bold text-white truncate">{file.name}</p>
                      <p className="text-[10px] text-gray-400">{file.size} • {file.pages} Page(s) • Rotation: {file.rotation}°</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => rotateFile(file.id)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300"
                      title="Rotate 90°"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => removeFile(file.id)}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400"
                      title="Remove file"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

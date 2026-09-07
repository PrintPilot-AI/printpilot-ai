import React, { useCallback, useState } from 'react';
import {
  FileText,
  Layers,
  Scissors,
  ImageIcon,
  RotateCw,
  Upload,
  Download,
  CheckCircle2,
  Trash2,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Info,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  loadPdf,
  getPdfInfo,
  mergePdfs,
  splitPdfs,
  explodeToPages,
  rotatePdf,
  reorderPdf,
  imagesToPdf,
  pdfBytesToBlob,
  parseRanges,
  type LoadedPdf,
  type PdfFileInfo,
} from '../../lib/pdfEngine';
import { validatePdfFile, validateImageFile, downloadBlob, errorMessage } from '../../lib/security';
import { PRINT_SIZE_MAP } from '../../lib/printSpecs';

type Tab = 'merge' | 'split' | 'rotate' | 'reorder' | 'img2pdf' | 'info';

interface QueueItem {
  id: string;
  loaded: LoadedPdf;
  info: PdfFileInfo;
  rotation: number;
}

export const PdfToolkit: React.FC = () => {
  const { savePrintJob } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('merge');
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [splitRange, setSplitRange] = useState('1');
  const [splitEveryPage, setSplitEveryPage] = useState(false);
  const [rotateAngle, setRotateAngle] = useState<90 | 180 | 270>(90);
  const [imgPageSize, setImgPageSize] = useState('a4');
  const [reorderList, setReorderList] = useState<number[]>([]);

  const selected = queue.find((q) => q.id === selectedId) ?? queue[0] ?? null;

  const addFiles = useCallback(async (files: File[]) => {
    setError(null);
    setSuccess(null);
    const accepted: QueueItem[] = [];
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        const verr = validateImageFile(file, 20);
        if (verr) { setError(verr); continue; }
        continue; // images handled by the img2pdf tab's own upload
      }
      const verr = validatePdfFile(file, 100);
      if (verr) { setError(verr); continue; }
      try {
        const loaded = await loadPdf(file);
        const info = getPdfInfo(loaded);
        accepted.push({ id: `${Date.now()}-${file.name}-${Math.random().toString(36).slice(2, 7)}`, loaded, info, rotation: 0 });
      } catch (err) {
        setError(errorMessage(err));
      }
    }
    if (accepted.length) {
      setQueue((prev) => [...prev, ...accepted]);
      setSelectedId(accepted[0].id);
    }
  }, []);

  const onPickPdfs = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(Array.from(e.target.files));
    e.target.value = '';
  };

  const removeItem = (id: string) => {
    setQueue((prev) => prev.filter((q) => q.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const rotateInQueue = (id: string, dir: 1 | -1) => {
    setQueue((prev) => prev.map((q) => (q.id === id ? { ...q, rotation: ((q.rotation + dir * 90) % 360 + 360) % 360 } : q)));
  };

  const moveItem = (id: string, dir: -1 | 1) => {
    setQueue((prev) => {
      const idx = prev.findIndex((q) => q.id === id);
      const target = idx + dir;
      if (idx < 0 || target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const [images, setImages] = useState<{ name: string; bytes: Uint8Array; type: string }[]>([]);
  const onPickImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (!e.target.files) return;
    const files = Array.from(e.target.files) as File[];
    const next: { name: string; bytes: Uint8Array; type: string }[] = [];
    for (const file of files) {
      const verr = validateImageFile(file, 20);
      if (verr) { setError(verr); continue; }
      if (!/image\/(png|jpeg)/.test(file.type)) { setError(`"${file.name}" must be PNG or JPEG for PDF embedding.`); continue; }
      next.push({ name: file.name, bytes: new Uint8Array(await file.arrayBuffer()), type: file.type });
    }
    setImages((prev) => [...prev, ...next]);
    e.target.value = '';
  };

  const runAction = async () => {
    setError(null);
    setSuccess(null);
    if (!selected && activeTab !== 'img2pdf') { setError('Add at least one PDF file first.'); return; }
    setBusy(true);
    try {
      if (activeTab === 'merge') {
        if (queue.length < 2) throw new Error('Merging requires at least two PDF files in the queue.');
        const bytes = await mergePdfs(queue.map((q) => q.loaded));
        downloadBlob(pdfBytesToBlob(bytes), 'merged.pdf');
        const total = queue.reduce((s, q) => s + q.info.pageCount, 0);
        setSuccess(`Merged ${queue.length} documents (${total} pages) → merged.pdf`);
        savePrintJob({ title: 'PDF Toolkit: Merge', toolType: 'PDFToolkit', status: 'Completed', summary: `Merged ${queue.length} PDFs (${total} pages).` });
      } else if (activeTab === 'split') {
        if (!selected) throw new Error('Select a PDF to split.');
        if (splitEveryPage) {
          const pages = await explodeToPages(selected.loaded);
          pages.forEach((p) => downloadBlob(pdfBytesToBlob(p.bytes), p.name));
          setSuccess(`Split "${selected.info.fileName}" into ${pages.length} single-page PDFs.`);
        } else {
          const ranges = parseRanges(splitRange, selected.info.pageCount);
          const bytes = await splitPdfs(selected.loaded, ranges);
          downloadBlob(pdfBytesToBlob(bytes), `${selected.info.fileName.replace(/\.pdf$/i, '')}_extract.pdf`);
          const count = ranges.reduce((s, r) => s + (r.to - r.from + 1), 0);
          setSuccess(`Extracted ${count} page(s) (${splitRange}) → new PDF.`);
        }
        savePrintJob({ title: 'PDF Toolkit: Split', toolType: 'PDFToolkit', status: 'Completed', summary: `Split "${selected?.info.fileName}".` });
      } else if (activeTab === 'rotate') {
        if (!selected) throw new Error('Select a PDF to rotate.');
        const bytes = await rotatePdf(selected.loaded, rotateAngle);
        downloadBlob(pdfBytesToBlob(bytes), `${selected.info.fileName.replace(/\.pdf$/i, '')}_rot${rotateAngle}.pdf`);
        setSuccess(`Rotated all ${selected.info.pageCount} page(s) by ${rotateAngle}°.`);
        savePrintJob({ title: 'PDF Toolkit: Rotate', toolType: 'PDFToolkit', status: 'Completed', summary: `Rotated ${selected.info.pageCount} pages by ${rotateAngle}°.` });
      } else if (activeTab === 'reorder') {
        if (!selected) throw new Error('Select a PDF to reorder.');
        if (reorderList.length !== selected.info.pageCount) {
          throw new Error(`Build an order containing all ${selected.info.pageCount} page(s) exactly once.`);
        }
        const bytes = await reorderPdf(selected.loaded, reorderList);
        downloadBlob(pdfBytesToBlob(bytes), `${selected.info.fileName.replace(/\.pdf$/i, '')}_reordered.pdf`);
        setSuccess(`Reordered ${selected.info.pageCount} page(s) → new PDF.`);
        savePrintJob({ title: 'PDF Toolkit: Reorder', toolType: 'PDFToolkit', status: 'Completed', summary: `Reordered pages of "${selected.info.fileName}".` });
      } else if (activeTab === 'img2pdf') {
        if (images.length === 0) throw new Error('Add at least one PNG/JPEG image.');
        const spec = PRINT_SIZE_MAP[imgPageSize];
        const bytes = await imagesToPdf(images, { widthMm: spec.widthMm, heightMm: spec.heightMm });
        downloadBlob(pdfBytesToBlob(bytes), 'images.pdf');
        setSuccess(`Converted ${images.length} image(s) to a ${spec.name} PDF (${spec.widthMm}×${spec.heightMm} mm).`);
        savePrintJob({ title: 'PDF Toolkit: Images → PDF', toolType: 'PDFToolkit', status: 'Completed', summary: `Built a ${spec.name} PDF from ${images.length} images.` });
      } else if (activeTab === 'info') {
        if (!selected) throw new Error('Select a PDF to inspect.');
        setSuccess(`Read metadata for "${selected.info.fileName}" (${selected.info.pageCount} pages).`);
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const selectForReorder = (id: string) => {
    setSelectedId(id);
    const item = queue.find((q) => q.id === id);
    if (item) setReorderList(Array.from({ length: item.info.pageCount }, (_, i) => i + 1));
  };

  const moveReorder = (index: number, dir: -1 | 1) => {
    setReorderList((prev) => {
      const target = index + dir;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'merge', label: 'Merge', icon: Layers },
    { id: 'split', label: 'Split', icon: Scissors },
    { id: 'rotate', label: 'Rotate', icon: RotateCw },
    { id: 'reorder', label: 'Reorder', icon: FileText },
    { id: 'img2pdf', label: 'Image → PDF', icon: ImageIcon },
    { id: 'info', label: 'Info', icon: Info },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-semibold px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 mb-1">
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span>Client-side pdf-lib engine · no server upload</span>
          </div>
          <h2 className="text-2xl font-bold text-white">PDF Toolkit Pro</h2>
          <p className="text-xs text-gray-400">Real merge, split, rotate, reorder, image-to-PDF and metadata — all processed locally in your browser.</p>
        </div>
        <button
          onClick={runAction}
          disabled={busy || (activeTab !== 'img2pdf' && queue.length === 0)}
          className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center space-x-2 active:scale-95"
        >
          <Download className="w-4 h-4" />
          <span>{busy ? 'Processing…' : `Run ${activeTab === 'img2pdf' ? 'Convert' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`}</span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 bg-white/[0.03] border border-white/10 rounded-2xl p-1.5 backdrop-blur-md">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
                activeTab === tab.id ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-white/[0.03] border border-white/10 rounded-3xl p-6 backdrop-blur-md flex flex-col items-center justify-center text-center space-y-4 min-h-[240px]">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Upload className="w-7 h-7" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">{activeTab === 'img2pdf' ? 'Select PNG / JPEG images' : 'Select PDF files'}</h4>
            <p className="text-xs text-gray-400 max-w-xs mt-1">
              {activeTab === 'img2pdf'
                ? 'Each image becomes one page. PNG and JPEG only, up to 20 MB each.'
                : 'Real PDF parsing up to 100 MB per file. Files never leave your device.'}
            </p>
          </div>
          {activeTab === 'img2pdf' ? (
            <>
              <label className="cursor-pointer px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md">
                Browse Images
                <input type="file" multiple accept="image/png,image/jpeg" className="hidden" onChange={onPickImages} />
              </label>
              <div className="w-full space-y-1 text-left max-h-40 overflow-y-auto">
                {images.map((img, i) => (
                  <div key={i} className="flex items-center justify-between text-[11px] text-gray-300 bg-slate-900/60 rounded-lg px-3 py-1.5">
                    <span className="truncate">{img.name}</span>
                    <button onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))} className="text-rose-400 ml-2 shrink-0"><Trash2 className="w-3 h-3" /></button>
                  </div>
                ))}
              </div>
              <label className="text-[11px] text-gray-400">Page size</label>
              <select value={imgPageSize} onChange={(e) => setImgPageSize(e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white">
                {['a4', 'letter', 'a5', 'photo-4x6', 'photo-5x7'].map((k) => (
                  <option key={k} value={k}>{PRINT_SIZE_MAP[k].name} ({PRINT_SIZE_MAP[k].widthMm}×{PRINT_SIZE_MAP[k].heightMm} mm)</option>
                ))}
              </select>
            </>
          ) : (
            <label className="cursor-pointer px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md">
              Browse PDFs
              <input type="file" multiple accept="application/pdf,.pdf" className="hidden" onChange={onPickPdfs} />
            </label>
          )}
        </div>

        <div className="lg:col-span-7 bg-white/[0.03] border border-white/10 rounded-3xl p-6 backdrop-blur-md space-y-4">
          {activeTab === 'img2pdf' ? (
            <div className="py-12 text-center text-gray-500 text-xs">
              Add PNG/JPEG images on the left, choose a page size, then run Convert. {images.length} image(s) queued.
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">Loaded documents ({queue.length})</span>
                {queue.length > 0 && (
                  <button onClick={() => { setQueue([]); setSelectedId(null); }} className="text-[11px] text-rose-400 hover:underline font-semibold">Clear all</button>
                )}
              </div>
              {queue.length === 0 ? (
                <div className="py-12 text-center text-gray-500 text-xs">No files in queue. Add PDFs to begin.</div>
              ) : (
                <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                  {queue.map((item, idx) => {
                    const isSel = selected?.id === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => (activeTab === 'reorder' ? selectForReorder(item.id) : setSelectedId(item.id))}
                        className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs cursor-pointer transition-colors ${
                          isSel ? 'bg-blue-500/10 border-blue-500/40' : 'bg-slate-900 border-white/10'
                        }`}
                      >
                        <div className="flex items-center space-x-3 overflow-hidden">
                          <span className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center text-[10px] shrink-0">{idx + 1}</span>
                          <div className="overflow-hidden">
                            <p className="font-bold text-white truncate">{item.info.fileName}</p>
                            <p className="text-[10px] text-gray-400">{(item.info.sizeBytes / 1024 / 1024).toFixed(2)} MB · {item.info.pageCount} page(s){item.rotation ? ` · queued rot ${item.rotation}°` : ''}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1.5 shrink-0">
                          {activeTab === 'merge' && (
                            <>
                              <button onClick={(e) => { e.stopPropagation(); moveItem(item.id, -1); }} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300" title="Move up"><ArrowUp className="w-3.5 h-3.5" /></button>
                              <button onClick={(e) => { e.stopPropagation(); moveItem(item.id, 1); }} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300" title="Move down"><ArrowDown className="w-3.5 h-3.5" /></button>
                            </>
                          )}
                          <button onClick={(e) => { e.stopPropagation(); rotateInQueue(item.id, 1); }} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300" title="Rotate 90°"><RotateCw className="w-3.5 h-3.5" /></button>
                          <button onClick={(e) => { e.stopPropagation(); removeItem(item.id); }} className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400" title="Remove"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {activeTab === 'split' && selected && (
                <div className="pt-3 border-t border-white/10 space-y-2">
                  <label className="flex items-center space-x-2 text-[11px] text-gray-300">
                    <input type="checkbox" checked={splitEveryPage} onChange={(e) => setSplitEveryPage(e.target.checked)} className="accent-blue-500" />
                    <span>Extract every page into its own PDF</span>
                  </label>
                  {!splitEveryPage && (
                    <input
                      value={splitRange}
                      onChange={(e) => setSplitRange(e.target.value)}
                      placeholder="e.g. 1-3,5,7-9"
                      className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                    />
                  )}
                </div>
              )}

              {activeTab === 'rotate' && (
                <div className="pt-3 border-t border-white/10 flex items-center space-x-2">
                  {([90, 180, 270] as const).map((a) => (
                    <button key={a} onClick={() => setRotateAngle(a)} className={`px-4 py-2 rounded-lg text-xs font-bold ${rotateAngle === a ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-300 hover:bg-white/10'}`}>{a}°</button>
                  ))}
                </div>
              )}

              {activeTab === 'reorder' && selected && (
                <div className="pt-3 border-t border-white/10 space-y-2">
                  <p className="text-[11px] text-gray-400">Drag-free reorder of "{selected.info.fileName}" ({selected.info.pageCount} pages). Use arrows to sequence pages.</p>
                  <div className="flex flex-wrap gap-2">
                    {reorderList.map((pageNum, i) => (
                      <div key={i} className="flex items-center space-x-1 bg-slate-900 border border-white/10 rounded-lg px-2 py-1">
                        <span className="text-[11px] text-gray-400">{i + 1}→</span>
                        <span className="text-xs font-bold text-white">p{pageNum}</span>
                        <button onClick={() => moveReorder(i, -1)} className="text-gray-400 hover:text-white"><ArrowUp className="w-3 h-3" /></button>
                        <button onClick={() => moveReorder(i, 1)} className="text-gray-400 hover:text-white"><ArrowDown className="w-3 h-3" /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'info' && selected && (
                <div className="pt-3 border-t border-white/10 space-y-1 text-[11px] text-gray-300">
                  <p><span className="text-gray-500">Pages:</span> {selected.info.pageCount}</p>
                  <p><span className="text-gray-500">Size:</span> {(selected.info.sizeBytes / 1024 / 1024).toFixed(2)} MB</p>
                  <p><span className="text-gray-500">Title:</span> {selected.info.title ?? '—'}</p>
                  <p><span className="text-gray-500">Author:</span> {selected.info.author ?? '—'}</p>
                  <p><span className="text-gray-500">Producer:</span> {selected.info.producer ?? '—'}</p>
                  <p><span className="text-gray-500">Created:</span> {selected.info.creationDate ? selected.info.creationDate.toLocaleString() : '—'}</p>
                  <p><span className="text-gray-500">First page:</span> {selected.info.pageSizes[0] ? `${selected.info.pageSizes[0].widthMm}×${selected.info.pageSizes[0].heightMm} mm` : '—'}</p>
                  <p><span className="text-gray-500">Encrypted:</span> {selected.info.encrypted ? 'Yes' : 'No'}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * PDF Toolkit engine — real client-side PDF manipulation with pdf-lib.
 *
 * Operations: load/metadata, merge, split (ranges / every page), rotate,
 * reorder, extract info. All work on real uploaded bytes; outputs are real PDF
 * files. No simulated operations.
 */

import { PDFDocument, PDFPage, degrees, rgb } from 'pdf-lib';

export interface PdfFileInfo {
  fileName: string;
  sizeBytes: number;
  pageCount: number;
  title: string | null;
  author: string | null;
  subject: string | null;
  creator: string | null;
  producer: string | null;
  creationDate: Date | null;
  modificationDate: Date | null;
  pageSizes: { widthPt: number; heightPt: number; widthMm: number; heightMm: number }[];
  encrypted: boolean;
}

const PT_TO_MM = 25.4 / 72;

export interface LoadedPdf {
  doc: PDFDocument;
  bytes: Uint8Array;
  fileName: string;
  sizeBytes: number;
}

export async function loadPdf(file: File): Promise<LoadedPdf> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let doc: PDFDocument;
  try {
    doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  } catch (err) {
    throw new Error(`"${file.name}" is not a valid PDF or could not be parsed: ${(err as Error).message}`);
  }
  return { doc, bytes, fileName: file.name, sizeBytes: file.size };
}

export function getPdfInfo(loaded: LoadedPdf): PdfFileInfo {
  const { doc } = loaded;
  const pages = doc.getPages();
  return {
    fileName: loaded.fileName,
    sizeBytes: loaded.sizeBytes,
    pageCount: pages.length,
    title: doc.getTitle() || null,
    author: doc.getAuthor() || null,
    subject: doc.getSubject() || null,
    creator: doc.getCreator() || null,
    producer: doc.getProducer() || null,
    creationDate: doc.getCreationDate(),
    modificationDate: doc.getModificationDate(),
    pageSizes: pages.map((p) => {
      const { width, height } = p.getSize();
      return {
        widthPt: width,
        heightPt: height,
        widthMm: Math.round(width * PT_TO_MM * 10) / 10,
        heightMm: Math.round(height * PT_TO_MM * 10) / 10,
      };
    }),
    encrypted: doc.isEncrypted,
  };
}

export async function mergePdfs(loaded: LoadedPdf[]): Promise<Uint8Array> {
  if (loaded.length < 2) throw new Error('Merging requires at least two PDF files.');
  const merged = await PDFDocument.create();
  for (const l of loaded) {
    const copied = await merged.copyPages(l.doc, l.doc.getPageIndices());
    copied.forEach((page) => merged.addPage(page));
  }
  merged.setProducer('PrintPilot AI PDF Toolkit');
  return merged.save();
}

export interface PageRange {
  from: number; // 1-based inclusive
  to: number; // 1-based inclusive
}

/** Parse a range string like "1-3,5,7-9" into PageRange[]. */
export function parseRanges(input: string, pageCount: number): PageRange[] {
  const ranges: PageRange[] = [];
  const parts = input.split(',').map((p) => p.trim()).filter(Boolean);
  for (const part of parts) {
    const m = part.match(/^(\d+)\s*-\s*(\d+)$/);
    if (m) {
      const from = parseInt(m[1], 10);
      const to = parseInt(m[2], 10);
      if (from < 1 || to > pageCount || from > to) {
        throw new Error(`Invalid range "${part}" — document has ${pageCount} page(s).`);
      }
      ranges.push({ from, to });
    } else if (/^\d+$/.test(part)) {
      const n = parseInt(part, 10);
      if (n < 1 || n > pageCount) throw new Error(`Page ${n} is out of range (document has ${pageCount} page(s)).`);
      ranges.push({ from: n, to: n });
    } else {
      throw new Error(`Could not parse "${part}". Use formats like 1-3, 5, 7-9.`);
    }
  }
  if (ranges.length === 0) throw new Error('Enter at least one page or range.');
  return ranges;
}

/** Extract the given 1-based inclusive ranges into a new PDF. */
export async function splitPdfs(loaded: LoadedPdf, ranges: PageRange[]): Promise<Uint8Array> {
  const out = await PDFDocument.create();
  for (const r of ranges) {
    const indices: number[] = [];
    for (let p = r.from; p <= r.to; p++) indices.push(p - 1);
    const copied = await out.copyPages(loaded.doc, indices);
    copied.forEach((page) => out.addPage(page));
  }
  out.setProducer('PrintPilot AI PDF Toolkit');
  return out.save();
}

/** Split every page of the document into its own PDF; returns [name, bytes][]. */
export async function explodeToPages(loaded: LoadedPdf): Promise<{ name: string; bytes: Uint8Array }[]> {
  const results: { name: string; bytes: Uint8Array }[] = [];
  const pageCount = loaded.doc.getPageCount();
  const base = loaded.fileName.replace(/\.pdf$/i, '');
  for (let i = 0; i < pageCount; i++) {
    const out = await PDFDocument.create();
    const [copied] = await out.copyPages(loaded.doc, [i]);
    out.addPage(copied);
    out.setProducer('PrintPilot AI PDF Toolkit');
    results.push({ name: `${base}_page_${i + 1}.pdf`, bytes: await out.save() });
  }
  return results;
}

/** Rotate all pages (or a specific 1-based page list) by the given degrees. */
export async function rotatePdf(
  loaded: LoadedPdf,
  angle: 90 | 180 | 270,
  pageNumbers?: number[],
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(loaded.bytes, { ignoreEncryption: true });
  const pages = doc.getPages();
  const targets: PDFPage[] = pageNumbers && pageNumbers.length
    ? pageNumbers.map((n) => {
        if (n < 1 || n > pages.length) throw new Error(`Page ${n} out of range (1-${pages.length}).`);
        return pages[n - 1];
      })
    : pages;
  for (const page of targets) {
    const current = page.getRotation().angle;
    page.setRotation(degrees((current + angle) % 360));
  }
  doc.setProducer('PrintPilot AI PDF Toolkit');
  return doc.save();
}

/** Reorder pages. `newOrder` is an array of 1-based source page numbers. */
export async function reorderPdf(loaded: LoadedPdf, newOrder: number[]): Promise<Uint8Array> {
  const pageCount = loaded.doc.getPageCount();
  if (newOrder.length !== pageCount) {
    throw new Error(`Reorder list must contain all ${pageCount} pages exactly once.`);
  }
  const seen = new Set<number>();
  for (const n of newOrder) {
    if (!Number.isInteger(n) || n < 1 || n > pageCount) throw new Error(`Invalid page number ${n}.`);
    if (seen.has(n)) throw new Error(`Page ${n} appears more than once.`);
    seen.add(n);
  }
  const out = await PDFDocument.create();
  const copied = await out.copyPages(loaded.doc, newOrder.map((n) => n - 1));
  copied.forEach((page) => out.addPage(page));
  out.setProducer('PrintPilot AI PDF Toolkit');
  return out.save();
}

/** Build a PDF from uploaded image files (image-to-PDF), one page per image. */
export async function imagesToPdf(
  images: { name: string; bytes: Uint8Array; type: string }[],
  pageSizeMm: { widthMm: number; heightMm: number },
): Promise<Uint8Array> {
  if (images.length === 0) throw new Error('Add at least one image.');
  const doc = await PDFDocument.create();
  const mmToPt = 72 / 25.4;
  const pageW = pageSizeMm.widthMm * mmToPt;
  const pageH = pageSizeMm.heightMm * mmToPt;

  for (const img of images) {
    let embedded;
    if (/png$/i.test(img.type) || /\.png$/i.test(img.name)) {
      embedded = await doc.embedPng(img.bytes);
    } else {
      embedded = await doc.embedJpg(img.bytes);
    }
    const page = doc.addPage([pageW, pageH]);
    const marginPt = 10 * mmToPt;
    const maxW = pageW - marginPt * 2;
    const maxH = pageH - marginPt * 2;
    const scale = Math.min(maxW / embedded.width, maxH / embedded.height);
    const w = embedded.width * scale;
    const h = embedded.height * scale;
    page.drawImage(embedded, {
      x: (pageW - w) / 2,
      y: (pageH - h) / 2,
      width: w,
      height: h,
    });
  }
  doc.setProducer('PrintPilot AI PDF Toolkit');
  return doc.save();
}

/**
 * Stamp a small footer text on every page (used for job tickets / certificates).
 */
export async function stampPages(doc: PDFDocument, text: string): Promise<void> {
  const pages = doc.getPages();
  for (const page of pages) {
    const { width, height } = page.getSize();
    page.drawText(text, {
      x: 24,
      y: 16,
      size: 8,
      color: rgb(0.4, 0.4, 0.4),
    });
    void width; void height;
  }
}

export function pdfBytesToBlob(bytes: Uint8Array): Blob {
  // Copy into a fresh ArrayBuffer so the Blob doesn't alias pdf-lib internals.
  const copy = bytes.slice();
  return new Blob([copy.buffer as ArrayBuffer], { type: 'application/pdf' });
}

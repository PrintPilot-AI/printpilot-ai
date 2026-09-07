import { describe, it, expect } from 'vitest';
import { PDFDocument, degrees } from 'pdf-lib';
import {
  parseRanges,
  reorderPdf,
  mergePdfs,
  splitPdfs,
  explodeToPages,
  rotatePdf,
  getPdfInfo,
  type LoadedPdf,
} from './pdfEngine';

describe('pdfEngine: parseRanges', () => {
  it('parses mixed single pages and ranges', () => {
    expect(parseRanges('1-3,5,7-9', 10)).toEqual([
      { from: 1, to: 3 },
      { from: 5, to: 5 },
      { from: 7, to: 9 },
    ]);
  });

  it('tolerates whitespace', () => {
    expect(parseRanges(' 2 - 4 , 6 ', 10)).toEqual([
      { from: 2, to: 4 },
      { from: 6, to: 6 },
    ]);
  });

  it('throws on out-of-range pages', () => {
    expect(() => parseRanges('1-99', 10)).toThrow(/Invalid range/i);
    expect(() => parseRanges('11', 10)).toThrow(/out of range/i);
    expect(() => parseRanges('0', 10)).toThrow(/out of range/i);
  });

  it('throws on reversed ranges', () => {
    expect(() => parseRanges('5-2', 10)).toThrow(/Invalid range/i);
  });

  it('throws on unparseable tokens and empty input', () => {
    expect(() => parseRanges('abc', 10)).toThrow(/Could not parse/i);
    expect(() => parseRanges('', 10)).toThrow(/at least one page/i);
  });
});

/** Build an in-memory LoadedPdf with n blank A4-ish pages for reorder tests. */
async function makePdf(n: number): Promise<LoadedPdf> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < n; i++) doc.addPage([595, 842]);
  const bytes = await doc.save();
  return { doc, bytes, fileName: 'test.pdf', sizeBytes: bytes.length };
}

describe('pdfEngine: reorderPdf (real pdf-lib, node)', () => {
  it('rejects a list that is missing pages', async () => {
    const pdf = await makePdf(4);
    await expect(reorderPdf(pdf, [1, 2, 3])).rejects.toThrow(/exactly once/i);
  });

  it('rejects duplicate page numbers', async () => {
    const pdf = await makePdf(4);
    await expect(reorderPdf(pdf, [1, 1, 3, 4])).rejects.toThrow(/more than once/i);
  });

  it('rejects out-of-range page numbers', async () => {
    const pdf = await makePdf(4);
    await expect(reorderPdf(pdf, [1, 2, 3, 9])).rejects.toThrow(/Invalid page number/i);
  });

  it('produces a valid reordered PDF with the same page count', async () => {
    const pdf = await makePdf(4);
    const out = await reorderPdf(pdf, [4, 3, 2, 1]);
    const reloaded = await PDFDocument.load(out);
    expect(reloaded.getPageCount()).toBe(4);
    // pdf-lib stamps its own Producer on save; assert the output is a real,
    // parseable PDF byte stream starting with the %PDF magic header.
    expect(out.slice(0, 5)).toEqual(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d])); // "%PDF-"
  });
});

describe('pdfEngine: merge / split / rotate / explode (real pdf-lib)', () => {
  it('getPdfInfo reports page count and mm sizes', async () => {
    const pdf = await makePdf(3);
    const info = getPdfInfo(pdf);
    expect(info.pageCount).toBe(3);
    expect(info.pageSizes[0].widthPt).toBe(595);
    // 595pt ≈ 210mm (A4 width)
    expect(info.pageSizes[0].widthMm).toBeCloseTo(210, 0);
    expect(info.encrypted).toBe(false);
  });

  it('merge requires at least two PDFs and concatenates pages', async () => {
    const a = await makePdf(2);
    const b = await makePdf(3);
    await expect(mergePdfs([a])).rejects.toThrow(/at least two/i);
    const merged = await mergePdfs([a, b]);
    const doc = await PDFDocument.load(merged);
    expect(doc.getPageCount()).toBe(5);
  });

  it('splitPdfs extracts only the requested ranges', async () => {
    const pdf = await makePdf(6);
    const out = await splitPdfs(pdf, parseRanges('2-3,5', 6));
    const doc = await PDFDocument.load(out);
    expect(doc.getPageCount()).toBe(3);
  });

  it('explodeToPages yields one PDF per page', async () => {
    const pdf = await makePdf(4);
    const pages = await explodeToPages(pdf);
    expect(pages).toHaveLength(4);
    expect(pages[0].name).toBe('test_page_1.pdf');
    const first = await PDFDocument.load(pages[0].bytes);
    expect(first.getPageCount()).toBe(1);
  });

  it('rotatePdf rotates all pages by the given angle', async () => {
    const pdf = await makePdf(2);
    const out = await rotatePdf(pdf, 90);
    const doc = await PDFDocument.load(out);
    expect(doc.getPageCount()).toBe(2);
    for (const page of doc.getPages()) {
      expect(page.getRotation().angle).toBe(90);
    }
  });

  it('rotatePdf rotates only the targeted pages', async () => {
    const pdf = await makePdf(3);
    const out = await rotatePdf(pdf, 180, [2]);
    const doc = await PDFDocument.load(out);
    const pages = doc.getPages();
    expect(pages[0].getRotation().angle).toBe(0);
    expect(pages[1].getRotation().angle).toBe(180);
    expect(pages[2].getRotation().angle).toBe(0);
  });

  it('rotatePdf accumulates rotation and rejects out-of-range page targets', async () => {
    const pdf = await makePdf(2);
    const once = await rotatePdf(pdf, 270);
    const twice = await rotatePdf({ ...pdf, bytes: once }, 270);
    const doc = await PDFDocument.load(twice);
    expect(doc.getPages()[0].getRotation().angle).toBe(180); // (270+270)%360
    await expect(rotatePdf(pdf, 90, [9])).rejects.toThrow(/out of range/i);
  });

  it('degrees helper is available for rotation assertions', () => {
    expect(degrees(90).angle).toBe(90);
  });
});

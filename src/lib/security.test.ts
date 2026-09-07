import { describe, it, expect } from 'vitest';
import { escapeHtml, errorMessage, validateImageFile, validatePdfFile } from './security';

describe('security: escapeHtml', () => {
  it('escapes all HTML-significant characters', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;',
    );
    expect(escapeHtml("O'Reilly & Sons")).toBe('O&#39;Reilly &amp; Sons');
    // The payload can no longer open a tag or break out of an attribute: every
    // structural character (<, >, ", ') is entity-encoded.
    const out = escapeHtml('<img src=x onerror=alert(1)>');
    expect(out).not.toContain('<img');
    expect(out).not.toContain('<');
    expect(out).not.toContain('>');
    expect(out).toContain('&lt;img');
  });

  it('is idempotent-safe on plain text and coerces null/undefined', () => {
    expect(escapeHtml('hello world')).toBe('hello world');
    expect(escapeHtml(undefined as unknown as string)).toBe('');
    expect(escapeHtml(null as unknown as string)).toBe('');
  });

  it('neutralises a full XSS payload set', () => {
    const payloads = [
      '"><svg/onload=alert(1)>',
      "javascript:alert('xss')",
      '<iframe src="evil"></iframe>',
      '{{7*7}}',
      '<a href="javascript:alert(1)">click</a>',
    ];
    for (const p of payloads) {
      const out = escapeHtml(p);
      expect(out).not.toMatch(/<(?!\/?(amp|lt|gt|quot|#39))/); // no raw tag opens beyond entities
      expect(out).not.toContain('<script');
      expect(out).not.toContain('<iframe');
      expect(out).not.toContain('<svg');
    }
  });
});

describe('security: errorMessage', () => {
  it('extracts messages from Error, string and unknown throws', () => {
    expect(errorMessage(new Error('boom'))).toBe('boom');
    expect(errorMessage('plain string')).toBe('plain string');
    expect(errorMessage(42)).toBe('Unknown error occurred.');
    expect(errorMessage(null)).toBe('Unknown error occurred.');
    expect(errorMessage({ foo: 'bar' })).toBe('Unknown error occurred.');
  });
});

describe('security: validateImageFile', () => {
  const img = (type: string, size: number, name = 'a.png') => ({ type, size, name }) as unknown as File;

  it('accepts a valid in-limit image', () => {
    expect(validateImageFile(img('image/png', 1024 * 1024))).toBeNull();
  });

  it('rejects unsupported types', () => {
    expect(validateImageFile(img('application/x-msdownload', 100))).toMatch(/Unsupported image type/i);
  });

  it('rejects oversize files', () => {
    expect(validateImageFile(img('image/jpeg', 21 * 1024 * 1024), 20)).toMatch(/exceeds the 20 MB limit/i);
  });

  it('rejects empty files', () => {
    expect(validateImageFile(img('image/png', 0))).toMatch(/empty/i);
  });
});

describe('security: validatePdfFile', () => {
  const pdf = (type: string, size: number, name = 'doc.pdf') => ({ type, size, name }) as unknown as File;

  it('accepts by MIME type or .pdf extension', () => {
    expect(validatePdfFile(pdf('application/pdf', 1024))).toBeNull();
    expect(validatePdfFile(pdf('', 1024, 'scan.PDF'))).toBeNull();
  });

  it('rejects non-PDFs', () => {
    expect(validatePdfFile(pdf('image/png', 1024, 'pic.png'))).toMatch(/not a PDF/i);
  });

  it('rejects oversize and empty PDFs', () => {
    expect(validatePdfFile(pdf('application/pdf', 51 * 1024 * 1024), 50)).toMatch(/exceeds the 50 MB limit/i);
    expect(validatePdfFile(pdf('application/pdf', 0))).toMatch(/empty/i);
  });
});

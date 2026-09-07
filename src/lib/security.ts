/**
 * Security helpers shared across tools.
 *
 * Rules enforced:
 * - User text is never interpolated raw into HTML/SVG strings.
 * - Print windows are populated with DOM APIs (no document.write of raw HTML).
 * - Any HTML string that must be injected is parsed and scrubbed first.
 */

/** Escape text for safe interpolation into HTML/SVG text nodes and attributes. */
export function escapeHtml(value: string): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const ALLOWED_SVG_TAGS = new Set([
  'svg', 'g', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon',
  'path', 'text', 'tspan', 'defs', 'lineargradient', 'radialgradient', 'stop',
  'clippath', 'use', 'image', 'title', 'desc',
]);

const BLOCKED_ATTRS = ['onload', 'onerror', 'onclick', 'onmouseover', 'onfocus', 'onbegin', 'href'];

/**
 * Strip scripts, event handlers and foreign elements from an SVG/HTML fragment.
 * Used only where server/engine output must be rendered; the app itself builds
 * SVG with React elements instead of injecting strings.
 */
export function sanitizeSvg(svg: string): string {
  const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
  if (doc.querySelector('parsererror')) return '';

  const walk = (node: Element) => {
    for (const child of Array.from(node.children)) {
      const tag = child.tagName.toLowerCase();
      if (tag === 'script' || tag === 'foreignobject' || tag === 'iframe' || tag === 'embed' || tag === 'object') {
        child.remove();
        continue;
      }
      if (!ALLOWED_SVG_TAGS.has(tag)) {
        child.remove();
        continue;
      }
      for (const attr of Array.from(child.attributes)) {
        const name = attr.name.toLowerCase();
        const val = attr.value.trim().toLowerCase();
        if (name.startsWith('on') || BLOCKED_ATTRS.includes(name) || val.startsWith('javascript:') || val.startsWith('data:text/html')) {
          child.removeAttribute(attr.name);
        }
      }
      walk(child);
    }
  };

  const root = doc.documentElement;
  for (const attr of Array.from(root.attributes)) {
    if (attr.name.toLowerCase().startsWith('on')) root.removeAttribute(attr.name);
  }
  walk(root);
  return new XMLSerializer().serializeToString(root);
}

/**
 * Safely open a print window and render content via DOM APIs.
 * The caller supplies a `build(document)` function; nothing is string-injected,
 * so user data cannot break out into script context.
 */
export function openPrintWindow(title: string, build: (doc: Document) => void): boolean {
  const win = window.open('', '_blank');
  if (!win) return false;
  const doc = win.document;
  doc.title = title;
  build(doc);
  win.focus();
  const style = doc.createElement('style');
  style.textContent = '@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }';
  doc.head.appendChild(style);
  win.onload = () => win.print();
  return true;
}

export function addStyles(doc: Document, css: string): void {
  const style = doc.createElement('style');
  style.textContent = css;
  doc.head.appendChild(style);
}

/** Create an element with text content set safely (no innerHTML). */
export function el<K extends keyof HTMLElementTagNameMap>(
  doc: Document,
  tag: K,
  opts: { text?: string; className?: string; style?: Partial<CSSStyleDeclaration>; attrs?: Record<string, string> } = {},
): HTMLElementTagNameMap[K] {
  const node = doc.createElement(tag);
  if (opts.text !== undefined) node.textContent = opts.text;
  if (opts.className) node.className = opts.className;
  if (opts.style) Object.assign(node.style, opts.style);
  if (opts.attrs) {
    for (const [k, v] of Object.entries(opts.attrs)) node.setAttribute(k, v);
  }
  return node;
}

/** Validate an uploaded image file (type + size). Returns an error string or null. */
export function validateImageFile(file: File, maxMb = 20): string | null {
  const okTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp'];
  if (!okTypes.includes(file.type)) {
    return `Unsupported image type "${file.type || 'unknown'}". Upload a JPEG, PNG, WEBP, GIF or BMP file.`;
  }
  if (file.size > maxMb * 1024 * 1024) {
    return `File is ${(file.size / 1024 / 1024).toFixed(1)} MB — exceeds the ${maxMb} MB limit.`;
  }
  if (file.size === 0) {
    return 'File is empty.';
  }
  return null;
}

/** Validate an uploaded PDF file (type + size). Returns an error string or null. */
export function validatePdfFile(file: File, maxMb = 50): string | null {
  const isPdfType = file.type === 'application/pdf';
  const isPdfName = /\.pdf$/i.test(file.name);
  if (!isPdfType && !isPdfName) {
    return `"${file.name}" is not a PDF file.`;
  }
  if (file.size > maxMb * 1024 * 1024) {
    return `File is ${(file.size / 1024 / 1024).toFixed(1)} MB — exceeds the ${maxMb} MB limit.`;
  }
  if (file.size === 0) {
    return 'File is empty.';
  }
  return null;
}

/** Turn a File into a data URL for <img> previews. */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error(`Could not read "${file.name}".`));
    reader.readAsDataURL(file);
  });
}

/** Download raw bytes in the browser. */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Extract a human-readable error message from any thrown value / fetch failure. */
export function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return 'Unknown error occurred.';
}

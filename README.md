# PrintPilot AI — V2 Print Production Toolkit

A browser-local toolkit for print shops, pre-press operators and designers.
Every tool runs deterministic print engineering **entirely in the browser** —
no external AI/LLM, no server-side model calls, and no file uploads for the
core tools.

## Tools

| Tool | What it does |
| --- | --- |
| **Passport Photo Maker** | Local background removal, ICAO 35×45mm framing, 300 DPI output with real embedded DPI (PNG pHYs), printable multi-up sheet |
| **Image Enhancer** | Local upscale, unsharp-mask sharpen, auto-levels, brightness/contrast/saturation via Canvas — preview, then download PNG (with DPI) or JPEG |
| **PDF Toolkit** | Real client-side merge / split / rotate / reorder / image-to-PDF / info, powered by `pdf-lib` |
| **Pre-flight Checker** | Inspects a real uploaded image: effective DPI, embedded density, colour mode, bleed, format, size — with a scored checklist |
| **Print Doctor** | Rule-based diagnostics for banding, hickeys, ghosting, blur — severity, likely cause, mechanical and software fixes |
| **Cost Estimator** | Deterministic quote from quantity, sheet nesting, GSM paper weight, colour mode, finishing and turnaround |
| **Colour Advisor** | RGB→CMYK, total ink coverage (TAC), gamut warnings, nearest Pantone match with ΔE |
| **Poster Generator** | Deterministic SVG poster layout with colour schemes, bleed guides and optional crop marks |
| **Visiting Card Studio** | US business card (88.9×50.8mm) and CR80 (85.60×53.98mm), front/back themes, 3mm bleed, real QR codes (vCard / WhatsApp / phone / web) |
| **Resume Builder** | Fully user-driven, ATS / professional / creative / regional templates, live A4 preview, safe print export |
| **ID Card Designer** | CR80 layout with photo, fields and QR at exact dimensions |
| **Certificate Generator** | Editable A4 certificate, previewed and printed safely |

## Print specs

Exact dimensions are used throughout: A2–A6, US Letter, US Legal, Executive,
4×6in and 5×7in photos, US business card, CR80 and ICAO passport, with correct
mm/inch → pixel conversion at any target DPI.

## Security

- No `dangerouslySetInnerHTML`, `innerHTML`, or `document.write`.
- Printing uses a DOM-API print window (`openPrintWindow` + `el`); poster SVG is
  rendered inside an `<img>` data URI, never injected as raw HTML.
- User SVG is sanitized through a DOMParser allowlist; all interpolated text is
  HTML-escaped.
- Uploaded files are validated for type and size.

## Run locally

**Prerequisites:** Node.js 20+

```bash
npm install
npm run dev      # start the Vite dev server
npm run build    # production build
npm run lint     # TypeScript type check (tsc --noEmit)
npm test         # run the vitest engine/security test suite
```

Optional Firebase config (for sign-in and saved job history) can be added via
environment variables — see [.env.example](.env.example). The core print tools
require **no API keys**.

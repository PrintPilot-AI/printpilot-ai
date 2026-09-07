import { describe, it, expect } from 'vitest';
import {
  hashString,
  shiftHex,
  buildPosterLayout,
  posterToSvg,
  COLOR_SCHEMES,
  type PosterInput,
} from './posterEngine';

function input(overrides: Partial<PosterInput> = {}): PosterInput {
  return {
    title: 'Summer Music Fest',
    subtitle: 'Live under the stars',
    category: 'Event',
    colorSchemeId: 'neon',
    sizeId: 'photo-18x24',
    eventDate: '2026-07-15',
    location: 'Central Park',
    includeCropMarks: true,
    ...overrides,
  };
}

describe('posterEngine: deterministic helpers', () => {
  it('hashString is stable and non-negative', () => {
    expect(hashString('abc')).toBe(hashString('abc'));
    expect(hashString('abc')).not.toBe(hashString('abd'));
    expect(hashString('')).toBeGreaterThanOrEqual(0);
  });

  it('shiftHex nudges lightness and clamps to 0..255', () => {
    expect(shiftHex('#000000', 10)).toBe('#0A0A0A');
    expect(shiftHex('#FFFFFF', -10)).toBe('#F5F5F5');
    expect(shiftHex('#FFFFFF', 1000)).toBe('#FFFFFF'); // clamped
    expect(shiftHex('#000000', -1000)).toBe('#000000'); // clamped
  });
});

describe('posterEngine: layout', () => {
  it('falls back to defaults for unknown scheme/size ids', () => {
    const l = buildPosterLayout(input({ colorSchemeId: 'does-not-exist', sizeId: 'nope' }));
    expect(l.palette.background).toBe(COLOR_SCHEMES.neon.palette.background);
    expect(l.widthMm).toBeGreaterThan(0);
  });

  it('computes 300 DPI pixel size and 3mm bleed', () => {
    const l = buildPosterLayout(input({ sizeId: 'a4' }));
    expect(l.dpi).toBe(300);
    expect(l.bleedMm).toBe(3);
    expect(l.widthMm).toBe(210);
    expect(l.heightMm).toBe(297);
    // 210mm at 300dpi ≈ 2480px
    expect(l.widthPx).toBeCloseTo(2480, -1);
    expect(l.bleedWidthPx).toBeGreaterThan(l.widthPx);
  });

  it('is deterministic — same input yields identical palette', () => {
    const a = buildPosterLayout(input());
    const b = buildPosterLayout(input());
    expect(a.palette).toEqual(b.palette);
  });
});

describe('posterEngine: SVG serialisation & XSS safety', () => {
  it('produces a well-formed standalone SVG', () => {
    const svg = posterToSvg(buildPosterLayout(input()));
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg.trim().endsWith('</svg>')).toBe(true);
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
  });

  it('escapes script/event-handler injection in user text', () => {
    const payload = input({
      title: '<script>alert("xss")</script>',
      subtitle: '"><img src=x onerror=alert(1)>',
      location: "O'Reilly & Sons",
      eventDate: '<svg/onload=alert(2)>',
    });
    const svg = posterToSvg(buildPosterLayout(payload));
    // No user-supplied raw tag can open: every structural char is entity-encoded,
    // so an injected element/event-handler can never become live SVG.
    expect(svg).not.toContain('<script');
    expect(svg).not.toContain('<img');
    expect(svg).not.toContain('<svg/onload');
    // The payloads survive only as escaped text content.
    expect(svg).toContain('&lt;script&gt;');
    expect(svg).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(svg).toContain('&lt;svg/onload=alert(2)&gt;');
    expect(svg).toContain('&quot;');
    expect(svg).toContain('&#39;');
    expect(svg).toContain('&amp;');
  });

  it('emits exactly one root svg and no user-injected elements', () => {
    const payload = input({ title: '</svg><svg onload=alert(1)>', subtitle: '</text><rect onclick=alert(2)/>' });
    const svg = posterToSvg(buildPosterLayout(payload));
    // Exactly one real opening <svg tag — the injected "</svg><svg ...>" is escaped text.
    expect((svg.match(/<svg /g) || []).length).toBe(1);
    // No live element or event-handler attribute can be formed from user input:
    // the injected markup survives only entity-encoded, so "onload" appears as
    // inert text inside &lt;...&gt;, never as an attribute on a real tag.
    expect(svg).not.toMatch(/<svg onload/);
    expect(svg).not.toMatch(/<rect onclick/);
    expect(svg).not.toContain('</svg><svg');
    expect(svg).toContain('&lt;svg onload=alert(1)&gt;');
    expect(svg).toContain('&lt;rect onclick=alert(2)/&gt;');
  });
});

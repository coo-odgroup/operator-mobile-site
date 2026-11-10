import { DOCUMENT } from '@angular/common';
import { Injectable, computed, inject, signal } from '@angular/core';

/**
 * ONE config object drives everything that changes from operator to operator:
 * name, logo, colours, hero banner and the stats strip.
 *
 * The backend only has to return this JSON (see docs/operator-config.md). Everything is optional except
 * `colors.primary`; anything missing falls back to the ODBUS default, and missing shades are derived from `primary`.
 */
export interface OperatorConfig {
  brand: {
    name: string;
    /** Legal entity shown in the footer, e.g. "OD Tours and Travels". */
    legalName?: string;
    tagline?: string;
    /** Optional logo image. Without it, the bus icon on a brand-coloured tile is shown. */
    logoUrl?: string;
  };
  colors: {
    /** Required. Main brand colour (buttons, links, icons, highlights). Hex, e.g. "#2296e8". */
    primary: string;
    /** Optional overrides. Leave out and they are derived from `primary`. */
    secondary?: string; // 2nd gradient colour
    dark?: string; // darker brand shade
    soft?: string; // very light tint for chips and backgrounds
    deep?: string; // very dark shade (footer)
    heroA?: string; // hero overlay, darkest
    heroB?: string; // hero overlay, mid
    /**
     * Optional: a different palette for desktop (>= 1024px). ODBUS uses its website blue there.
     * Leave it out and desktop uses the same colours as mobile.
     */
    desktop?: { primary: string; secondary?: string; dark?: string; soft?: string; gradient?: string };
  };
  hero: {
    /** Wide photo (desktop 2400x600). Keep the bottom 15% free of detail: the search box overlaps it. */
    image: string;
    badge: string;
    title: string;
    /** Coloured second part of the headline. */
    highlight: string;
    points: string[];
  };
  stats: { icon: string; value: string; label: string }[];
}

type Colors = OperatorConfig['colors'];
type Shades = Omit<Colors, 'desktop'>;
type Partials<T> = { [K in keyof T]?: T[K] extends object ? Partials<T[K]> : T[K] };

/** The ODBUS look. Explicit values, so the default design is pixel-identical to what was designed. */
export const DEFAULT_CONFIG: OperatorConfig = {
  brand: {
    name: 'ODBUS',
    legalName: 'OD Tours and Travels',
    tagline: "Odisha's No. 1 online bus ticket booking platform.",
  },
  colors: {
    primary: '#2296e8',
    secondary: '#2a55e1',
    dark: '#2a519e',
    soft: '#e7f6ff',
    deep: '#0b2a55',
    heroA: '#0a2676',
    heroB: '#0d3c96',
    desktop: { primary: '#1976d2', secondary: '#42a5f5', dark: '#0d47a1', soft: '#e3f0fc', gradient: 'linear-gradient(135deg,#1565c0,#1976d2 55%,#42a5f5)' },
  },
  hero: {
    image: '/photos/konarak_temple.png',
    badge: "Odisha's No. 1 Bus Booking Platform",
    title: 'Book bus tickets across Odisha',
    highlight: '& beyond',
    points: ['Best fares', 'Trusted operators', 'Instant booking'],
  },
  stats: [
    // Placeholder figures: replace with real numbers.
    { icon: 'pin', value: '2500+', label: 'Routes' },
    { icon: 'bus', value: '2200+', label: 'Buses' },
    { icon: 'users', value: '10 Lakh+', label: 'Happy customers' },
    { icon: 'help', value: '24/7', label: 'Customer support' },
    { icon: 'star', value: '4.5', label: 'Google rating' },
  ],
};

declare global {
  interface Window { __OPERATOR_CONFIG__?: Partials<OperatorConfig>; }
}

/** Where the config is fetched from when the page did not inline it. The backend can serve this URL per domain. */
export const OPERATOR_CONFIG_URL = '/operator-config.json';

// ---------- colour helpers ----------
const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const clamp = (n: number, lo = 0, hi = 100) => Math.min(hi, Math.max(lo, n));

function toRgb(hex: string): [number, number, number] {
  let h = hex.slice(1);
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function toHex([r, g, b]: number[]): string {
  return '#' + [r, g, b].map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('');
}
function rgbToHsl([r, g, b]: number[]): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (d) {
    s = d / (1 - Math.abs(2 * l - 1));
    h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h *= 60; if (h < 0) h += 360;
  }
  return [h, s * 100, l * 100];
}
function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360; s = clamp(s) / 100; l = clamp(l) / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return toHex([f(0) * 255, f(8) * 255, f(4) * 255]);
}
function luminance(hex: string): number {
  const [r, g, b] = toRgb(hex).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
/** Contrast ratio of white text on this colour (WCAG). */
const contrastOnWhite = (hex: string) => 1.05 / (luminance(hex) + 0.05);

/** Fill every shade the operator did not provide, derived from the primary colour. */
export function deriveColors(input: Shades): Required<Shades> {
  let primary = HEX.test(input.primary ?? '') ? input.primary : DEFAULT_CONFIG.colors.primary;
  // White text sits on the primary colour (buttons, header). If it is too light, darken it until it is readable.
  if (contrastOnWhite(primary) < 3) {
    const [h, s, l] = rgbToHsl(toRgb(primary));
    let nl = l;
    while (nl > 10 && contrastOnWhite(hslToHex(h, s, nl)) < 3) nl -= 1;
    console.warn(`[operator-config] primary ${primary} is too light for white text; using ${hslToHex(h, s, nl)}`);
    primary = hslToHex(h, s, nl);
  }
  const [h, s, l] = rgbToHsl(toRgb(primary));
  const ok = (v?: string) => (v && HEX.test(v) ? v : undefined);
  return {
    primary,
    secondary: ok(input.secondary) ?? hslToHex(h + 20, s * 0.93, l),
    dark: ok(input.dark) ?? hslToHex(h + 14, s * 0.72, l * 0.75),
    soft: ok(input.soft) ?? hslToHex(h, Math.max(s, 50), 95),
    deep: ok(input.deep) ?? hslToHex(h + 8, s * 0.95, 19),
    heroA: ok(input.heroA) ?? hslToHex(h + 17, s, 25),
    heroB: ok(input.heroB) ?? hslToHex(h + 13, s, 32),
  };
}

function merge<T>(base: T, over: unknown): T {
  if (Array.isArray(base)) return (Array.isArray(over) && over.length ? over : base) as T;
  if (base && typeof base === 'object') {
    const o = (over && typeof over === 'object' ? over : {}) as Record<string, unknown>;
    const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
    for (const k of new Set([...Object.keys(base as object), ...Object.keys(o)])) {
      const bv = (base as Record<string, unknown>)[k];
      out[k] = bv === undefined ? o[k] : merge(bv, o[k]);
    }
    return out as T;
  }
  return (over === undefined || over === null || over === '' ? base : over) as T;
}

@Injectable({ providedIn: 'root' })
export class OperatorConfigService {
  private readonly doc = inject(DOCUMENT);
  readonly config = signal<OperatorConfig>(DEFAULT_CONFIG);
  readonly brand = computed(() => this.config().brand);
  readonly hero = computed(() => this.config().hero);
  readonly stats = computed(() => this.config().stats);

  /** Runs once at startup (app.config.ts). Never throws: any failure keeps the ODBUS default. */
  async load(): Promise<void> {
    if (typeof window === 'undefined') return; // server render: default theme, client applies the real one
    try {
      let raw: unknown = window.__OPERATOR_CONFIG__; // 1) backend inlined it in index.html: no flash of the wrong colours
      if (!raw) raw = await this.fetchJson(OPERATOR_CONFIG_URL); // 2) backend (or a static file) serves it
      if (raw && typeof raw === 'object') this.apply(raw as Partials<OperatorConfig>);
    } catch (e) {
      console.warn('[operator-config] using default theme:', e);
    }
  }

  private async fetchJson(url: string): Promise<unknown> {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 2500);
    try {
      const res = await fetch(url, { signal: ctl.signal, headers: { Accept: 'application/json' } });
      return res.ok ? await res.json() : null;
    } finally {
      clearTimeout(t);
    }
  }

  apply(raw: Partials<OperatorConfig>) {
    const merged = merge(DEFAULT_CONFIG, raw);
    const given = (raw.colors ?? {}) as Partial<Colors>;
    const isDefaultBrand = !given.primary || given.primary.toLowerCase() === DEFAULT_CONFIG.colors.primary;
    // If a different primary was given, the other shades must be derived from it, never inherited from ODBUS blue.
    const { desktop: givenDesktop, ...givenShades } = given;
    const base = isDefaultBrand ? (({ desktop: _d, ...rest }) => rest)(DEFAULT_CONFIG.colors) : { primary: givenShades.primary! };
    const colors = deriveColors({ ...base, ...givenShades } as Shades);
    // Desktop palette: ODBUS keeps its website blue; any other operator uses its own colours on desktop too
    // (unless the backend sends a separate `desktop` palette).
    const desktop = isDefaultBrand ? merge(DEFAULT_CONFIG.colors.desktop!, givenDesktop) : givenDesktop;
    merged.colors = { ...colors, desktop };
    this.config.set(merged);
    this.writeTheme(colors, desktop, isDefaultBrand, merged);
  }

  private writeTheme(c: Required<Shades>, desk: Colors['desktop'], isDefault: boolean, cfg: OperatorConfig) {
    const d = this.doc;
    let el = d.getElementById('operator-theme') as HTMLStyleElement | null;
    if (!el) {
      el = d.createElement('style');
      el.id = 'operator-theme';
      d.head.appendChild(el);
    }
    // ":root:root:root" out-ranks the base tokens in styles.scss (including its desktop media block).
    let css = `:root:root:root{--brand:${c.primary};--brand-2:${c.secondary};--brand-dark:${c.dark};--brand-soft:${c.soft};--brand-deep:${c.deep};--hero-a:${c.heroA};--hero-b:${c.heroB}}`;
    if (desk && HEX.test(desk.primary ?? '')) {
      const dk = deriveColors({ ...desk, deep: c.deep, heroA: c.heroA, heroB: c.heroB } as Shades);
      css += `@media (min-width:1024px){:root:root:root:not([data-theme='dark']){--brand:${dk.primary};--brand-2:${dk.secondary};--brand-dark:${dk.dark};--brand-soft:${dk.soft};--gradient:${desk.gradient && /^linear-gradient\([^;{}]*\)$/.test(desk.gradient) ? desk.gradient : `linear-gradient(135deg,${dk.dark},${dk.primary} 55%,${dk.secondary})`}}}`;
    } else {
      // same colours on desktop: restate the 3-stop desktop gradient with this operator's shades
      css += `@media (min-width:1024px){:root:root:root:not([data-theme='dark']){--brand:${c.primary};--brand-2:${c.secondary};--brand-dark:${c.dark};--brand-soft:${c.soft};--gradient:linear-gradient(135deg,${c.dark},${c.primary} 55%,${c.secondary})}}`;
    }
    if (!isDefault) {
      const [h, s] = rgbToHsl(toRgb(c.primary));
      // dark mode keeps its own dark tint, tinted with this operator's hue
      css += `:root:root[data-theme='dark']{--brand-soft:${hslToHex(h, Math.min(s, 45), 20)}}`;
    }
    el.textContent = css;
    d.title = d.title && d.title !== 'BusGo' ? d.title : cfg.brand.name;
    d.querySelector('meta[name="theme-color"]')?.setAttribute('content', c.primary);
  }
}

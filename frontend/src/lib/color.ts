/**
 * Tiny colour utilities for the runtime palette engine.
 *
 * The whole design system is driven by CSS custom properties of the form
 * `--brand: 16 92 70;` (an RGB triplet, alpha applied at the call-site via
 * `rgb(var(--brand) / .35)`). The admin only enters a hex colour, so we
 * convert hex → RGB triplet, and we also derive natural “-2” (deeper) and
 * “-soft” (lighter) shades using HSL so gradients keep their pleasing depth.
 */

export function isHexColor(value: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(value);
}

export function normalizeHex(value: string): string {
  if (!value) return "#000000";
  let hex = value.trim();
  if (!hex.startsWith("#")) hex = `#${hex}`;
  // Expand `#abc` shorthand.
  if (/^#[0-9A-Fa-f]{3}$/.test(hex)) {
    hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  }
  return hex.toUpperCase();
}

interface RGB { r: number; g: number; b: number }
interface HSL { h: number; s: number; l: number }

function hexToRgb(hex: string): RGB {
  const safe = isHexColor(hex) ? hex : "#000000";
  const r = parseInt(safe.slice(1, 3), 16);
  const g = parseInt(safe.slice(3, 5), 16);
  const b = parseInt(safe.slice(5, 7), 16);
  return { r, g, b };
}

function rgbToHex({ r, g, b }: RGB): string {
  const to = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`.toUpperCase();
}

function rgbToHsl({ r, g, b }: RGB): HSL {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0; let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn: h = (gn - bn) / d + (gn < bn ? 6 : 0); break;
      case gn: h = (bn - rn) / d + 2; break;
      default: h = (rn - gn) / d + 4;
    }
    h *= 60;
  }
  return { h, s, l };
}

function hslToRgb({ h, s, l }: HSL): RGB {
  if (s === 0) {
    const v = Math.round(l * 255);
    return { r: v, g: v, b: v };
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const k = (n: number) => {
    let t = (h / 360 + n / 3) % 1;
    if (t < 0) t += 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return { r: Math.round(k(2) * 255), g: Math.round(k(0) * 255), b: Math.round(k(-2) * 255) };
}

/** Returns "R G B" (space-separated triplet) suitable for a CSS variable. */
export function hexToRgbTriplet(hex: string): string {
  const { r, g, b } = hexToRgb(normalizeHex(hex));
  return `${r} ${g} ${b}`;
}

function adjustLightness(hex: string, deltaPercentPoints: number): string {
  const safe = normalizeHex(hex);
  const hsl = rgbToHsl(hexToRgb(safe));
  const newL = Math.max(0, Math.min(1, hsl.l + deltaPercentPoints / 100));
  return rgbToHex(hslToRgb({ ...hsl, l: newL }));
}

/** Darken a hex colour by N percentage points of HSL lightness. */
export function darken(hex: string, points = 8): string {
  return adjustLightness(hex, -Math.abs(points));
}

/** Lighten a hex colour by N percentage points of HSL lightness. */
export function lighten(hex: string, points = 12): string {
  return adjustLightness(hex, Math.abs(points));
}

/**
 * Derive the full CSS-variable palette (deep / regular / soft / -2 deep) for a
 * given base brand colour. Used for both the brand and accent ramps.
 */
export function deriveRamp(base: string) {
  const norm = normalizeHex(base);
  return {
    base: norm,
    deep: darken(norm, 10),
    soft: lighten(norm, 14),
  };
}

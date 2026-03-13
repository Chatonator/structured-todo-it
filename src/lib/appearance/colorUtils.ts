import type { CategoryColors, TextSize } from '@/types/preferences';

export interface AppearanceDataset {
  theme: 'light' | 'dark';
  textSize: TextSize;
  contrast: 'default' | 'high';
  motion: 'normal' | 'reduced';
}

interface HslColor {
  h: number;
  s: number;
  l: number;
}

export function getAppearanceDataset(
  actualTheme: 'light' | 'dark',
  options: {
    textSize: TextSize;
    highContrast: boolean;
    reducedAnimations: boolean;
  }
): AppearanceDataset {
  return {
    theme: actualTheme,
    textSize: options.textSize,
    contrast: options.highContrast ? 'high' : 'default',
    motion: options.reducedAnimations ? 'reduced' : 'normal',
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function formatHslTriplet(color: HslColor): string {
  return `${Math.round(color.h)} ${Math.round(color.s)}% ${Math.round(color.l)}%`;
}

function parseTriplet(value: string): HslColor | null {
  const match = value.trim().match(/^([\d.]+)\s+([\d.]+)%\s+([\d.]+)%$/);
  if (!match) return null;

  return {
    h: Number(match[1]),
    s: Number(match[2]),
    l: Number(match[3]),
  };
}

function rgbToHsl(r: number, g: number, b: number): HslColor {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;

  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  const l = (max + min) / 2;

  let h = 0;
  let s = 0;

  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));

    switch (max) {
      case rn:
        h = 60 * (((gn - bn) / delta) % 6);
        break;
      case gn:
        h = 60 * ((bn - rn) / delta + 2);
        break;
      default:
        h = 60 * ((rn - gn) / delta + 4);
        break;
    }
  }

  return {
    h: h < 0 ? h + 360 : h,
    s: s * 100,
    l: l * 100,
  };
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const normalized = hex.replace('#', '').trim();
  if (![3, 6].includes(normalized.length)) return null;

  const full = normalized.length === 3
    ? normalized.split('').map((char) => `${char}${char}`).join('')
    : normalized;

  const value = Number.parseInt(full, 16);
  if (Number.isNaN(value)) return null;

  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function parseRgb(color: string): HslColor | null {
  const match = color.trim().match(/^rgba?\(([^)]+)\)$/i);
  if (!match) return null;

  const parts = match[1]
    .split(',')
    .map((part) => Number.parseFloat(part.trim()))
    .filter((part) => !Number.isNaN(part));

  if (parts.length < 3) return null;
  return rgbToHsl(parts[0], parts[1], parts[2]);
}

function parseHsl(color: string): HslColor | null {
  const match = color.trim().match(/^hsla?\(([^)]+)\)$/i);
  if (!match) return null;

  const normalized = match[1].replace(/,/g, ' ').replace(/\//g, ' ');
  const parts = normalized.split(/\s+/).filter(Boolean);
  if (parts.length < 3) return null;

  return {
    h: Number.parseFloat(parts[0]),
    s: Number.parseFloat(parts[1].replace('%', '')),
    l: Number.parseFloat(parts[2].replace('%', '')),
  };
}

export function toHslTriplet(
  color: string,
  resolveCssVar?: (variableName: string) => string | null
): string | null {
  const trimmed = color.trim();
  if (!trimmed) return null;

  const cssVarMatch = trimmed.match(/^hsl\(var\(--([^)]+)\)\)$/i);
  if (cssVarMatch) {
    return resolveCssVar?.(cssVarMatch[1]) ?? null;
  }

  const triplet = parseTriplet(trimmed);
  if (triplet) return formatHslTriplet(triplet);

  const hex = hexToRgb(trimmed);
  if (hex) return formatHslTriplet(rgbToHsl(hex.r, hex.g, hex.b));

  const rgb = parseRgb(trimmed);
  if (rgb) return formatHslTriplet(rgb);

  const hsl = parseHsl(trimmed);
  if (hsl) return formatHslTriplet(hsl);

  return null;
}

function deriveCategorySurface(triplet: string, isDark: boolean): string {
  const parsed = parseTriplet(triplet);
  if (!parsed) return triplet;

  const surface: HslColor = isDark
    ? {
        h: parsed.h,
        s: clamp(parsed.s * 0.4, 18, 46),
        l: clamp(parsed.l * 0.33, 18, 28),
      }
    : {
        h: parsed.h,
        s: clamp(parsed.s * 0.55, 38, 82),
        l: clamp(parsed.l + 42, 92, 97),
      };

  return formatHslTriplet(surface);
}

export function getCategoryCssVariables(
  categoryColors: CategoryColors,
  isDark: boolean,
  resolveCssVar?: (variableName: string) => string | null
): Record<string, string> {
  const mapping: Record<keyof CategoryColors, string> = {
    critical: 'critical',
    urgent: 'urgent',
    important: 'important',
    low_priority: 'low-priority',
  };

  const entries = Object.entries(mapping).flatMap(([label, suffix]) => {
    const color = categoryColors[label as keyof CategoryColors];
    const triplet = toHslTriplet(color, resolveCssVar);
    if (!triplet) return [];

    return [
      [`--category-${suffix}`, triplet],
      [`--category-${suffix}-light`, deriveCategorySurface(triplet, isDark)],
    ];
  });

  return Object.fromEntries(entries);
}

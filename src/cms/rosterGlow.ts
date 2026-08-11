/** Roster card hover glow — color only; mask, opacity, and motion stay in CSS. */

export type RosterGlowPreset =
  | 'yellow'
  | 'white'
  | 'purple'
  | 'rose'
  | 'red'
  | 'custom'

export type RosterGlowPair = {
  primary: RosterGlowPreset
  secondary: RosterGlowPreset
  customPrimary?: string
  customSecondary?: string
}

export const ROSTER_GLOW_PRESETS: {
  id: RosterGlowPreset
  label: string
  /** Swatch color for the CMS picker */
  swatch: string
}[] = [
  { id: 'yellow', label: 'Geel', swatch: '#d8ff3e' },
  { id: 'white', label: 'Wit', swatch: '#f5f5f5' },
  { id: 'purple', label: 'Paars', swatch: '#a855f7' },
  { id: 'rose', label: 'Rose', swatch: '#a8487a' },
  { id: 'red', label: 'Rood', swatch: '#ef4444' },
  { id: 'custom', label: 'Custom', swatch: '#d8ff3e' },
]

/** Single-hue stop families — dual glow blends primary + secondary. */
const PRESET_STOPS: Record<Exclude<RosterGlowPreset, 'custom'>, string[]> = {
  yellow: ['#eaff8a', '#d8ff3e', '#c2e638', '#f0bc06', '#b8e62a'],
  white: ['#ffffff', '#f3f3f3', '#dcdcdc', '#fafafa', '#e8e8e8'],
  purple: ['#e9d5ff', '#dcb8fe', '#a855f7', '#7c3aed', '#c084fc'],
  rose: ['#d4a0c8', '#c47a9e', '#a8487a', '#86355f', '#b86a92'],
  red: ['#fecaca', '#f87171', '#ef4444', '#dc2626', '#fb7185'],
}

export const DEFAULT_ROSTER_GLOW_PRESET: RosterGlowPreset = 'yellow'
export const DEFAULT_ROSTER_GLOW_SECONDARY: RosterGlowPreset = 'rose'
export const DEFAULT_ROSTER_GLOW_CUSTOM = '#d8ff3e'

/** Shipped dual-glow fallback (yellow + rose). */
export const DEFAULT_ROSTER_GLOW_STOPS = blendStopsFromBases(
  '#d8ff3e',
  '#a8487a',
)

export function isRosterGlowPreset(value: unknown): value is RosterGlowPreset {
  return (
    value === 'yellow' ||
    value === 'white' ||
    value === 'purple' ||
    value === 'rose' ||
    value === 'red' ||
    value === 'custom'
  )
}

/** Normalize stored CMS values (maps legacy `blue` → `rose`). */
export function normalizeRosterGlowPreset(
  value: unknown,
  fallback: RosterGlowPreset = DEFAULT_ROSTER_GLOW_PRESET,
): RosterGlowPreset {
  if (value === 'blue') return 'rose'
  if (isRosterGlowPreset(value)) return value
  return fallback
}

function clampByte(n: number) {
  return Math.min(255, Math.max(0, Math.round(n)))
}

function parseHexColor(input: string): { r: number; g: number; b: number } | null {
  const raw = input.trim().replace(/^#/, '')
  if (/^[0-9a-f]{3}$/i.test(raw)) {
    return {
      r: parseInt(raw[0] + raw[0], 16),
      g: parseInt(raw[1] + raw[1], 16),
      b: parseInt(raw[2] + raw[2], 16),
    }
  }
  if (/^[0-9a-f]{6}$/i.test(raw)) {
    return {
      r: parseInt(raw.slice(0, 2), 16),
      g: parseInt(raw.slice(2, 4), 16),
      b: parseInt(raw.slice(4, 6), 16),
    }
  }
  return null
}

function toHex({ r, g, b }: { r: number; g: number; b: number }) {
  return `#${[r, g, b]
    .map((c) => clampByte(c).toString(16).padStart(2, '0'))
    .join('')}`
}

function mix(
  a: { r: number; g: number; b: number },
  b: { r: number; g: number; b: number },
  t: number,
) {
  return {
    r: a.r + (b.r - a.r) * t,
    g: a.g + (b.g - a.g) * t,
    b: a.b + (b.b - a.b) * t,
  }
}

function blendStopsFromBases(primaryHex: string, secondaryHex: string): string[] {
  const primary =
    parseHexColor(primaryHex) ?? parseHexColor(DEFAULT_ROSTER_GLOW_CUSTOM)!
  const secondary =
    parseHexColor(secondaryHex) ?? parseHexColor(DEFAULT_ROSTER_GLOW_CUSTOM)!
  const white = { r: 255, g: 255, b: 255 }
  const black = { r: 20, g: 16, b: 28 }

  return [
    toHex(mix(primary, white, 0.28)),
    toHex(primary),
    toHex(mix(primary, secondary, 0.5)),
    toHex(secondary),
    toHex(mix(secondary, black, 0.12)),
  ]
}

/** Build flowing stops from one custom hex (same intensity character as presets). */
export function customGlowStops(hex: string): string[] {
  const base = parseHexColor(hex) ?? parseHexColor(DEFAULT_ROSTER_GLOW_CUSTOM)!
  const white = { r: 255, g: 255, b: 255 }
  const black = { r: 20, g: 16, b: 28 }
  return [
    toHex(mix(base, white, 0.35)),
    toHex(base),
    toHex(mix(base, black, 0.22)),
    toHex(mix(base, white, 0.18)),
    toHex(mix(base, black, 0.08)),
  ]
}

export function glowPresetBaseHex(
  preset: RosterGlowPreset,
  customHex?: string,
): string {
  if (preset === 'custom') {
    const hex = customHex?.trim()
    return hex && parseHexColor(hex) ? hex : DEFAULT_ROSTER_GLOW_CUSTOM
  }
  return (
    ROSTER_GLOW_PRESETS.find((p) => p.id === preset)?.swatch ??
    DEFAULT_ROSTER_GLOW_CUSTOM
  )
}

export function resolveRosterGlowStops(
  primary: RosterGlowPreset | undefined,
  customPrimary?: string,
  secondary?: RosterGlowPreset,
  customSecondary?: string,
): string[] {
  const a = normalizeRosterGlowPreset(primary, DEFAULT_ROSTER_GLOW_PRESET)
  const b = normalizeRosterGlowPreset(
    secondary,
    DEFAULT_ROSTER_GLOW_SECONDARY,
  )

  // Same hue twice → single-family glow (keeps intensity character).
  if (a === b) {
    if (a === 'custom') {
      return customGlowStops(customPrimary?.trim() || DEFAULT_ROSTER_GLOW_CUSTOM)
    }
    return [...PRESET_STOPS[a]]
  }

  return blendStopsFromBases(
    glowPresetBaseHex(a, customPrimary),
    glowPresetBaseHex(b, customSecondary),
  )
}

export function rosterGlowGradient(
  primary: RosterGlowPreset | undefined,
  customPrimary?: string,
  secondary?: RosterGlowPreset,
  customSecondary?: string,
): string {
  const stops = resolveRosterGlowStops(
    primary,
    customPrimary,
    secondary,
    customSecondary,
  )
  return `linear-gradient(45deg, ${stops.join(', ')})`
}

export function rosterGlowGradientFromPair(pair: RosterGlowPair): string {
  return rosterGlowGradient(
    pair.primary,
    pair.customPrimary,
    pair.secondary,
    pair.customSecondary,
  )
}

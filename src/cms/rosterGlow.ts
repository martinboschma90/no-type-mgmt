/** Roster card hover glow — color only; mask, opacity, and motion stay in CSS. */

export type RosterGlowPreset =
  | 'yellow'
  | 'white'
  | 'purple'
  | 'rose'
  | 'red'
  | 'custom'

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

/** Shipped glow stops — default "Geel" (yellow + deep purple-rose). */
export const DEFAULT_ROSTER_GLOW_STOPS = [
  '#d8ff3e',
  '#d4a0c8',
  '#a8487a',
  '#c47a9e',
  '#f0bc06',
] as const

const PRESET_STOPS: Record<Exclude<RosterGlowPreset, 'custom'>, string[]> = {
  yellow: [...DEFAULT_ROSTER_GLOW_STOPS],
  white: ['#ffffff', '#f3f3f3', '#dcdcdc', '#fafafa', '#e8e8e8'],
  purple: ['#e9d5ff', '#dcb8fe', '#a855f7', '#7c3aed', '#c084fc'],
  rose: ['#d4a0c8', '#c47a9e', '#a8487a', '#86355f', '#b86a92'],
  red: ['#fecaca', '#f87171', '#ef4444', '#dc2626', '#fb7185'],
}

export const DEFAULT_ROSTER_GLOW_PRESET: RosterGlowPreset = 'yellow'
export const DEFAULT_ROSTER_GLOW_CUSTOM = '#d8ff3e'

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

export function resolveRosterGlowStops(
  preset: RosterGlowPreset | undefined,
  customHex?: string,
): string[] {
  const resolved = normalizeRosterGlowPreset(preset)
  if (resolved === 'custom') {
    return customGlowStops(customHex?.trim() || DEFAULT_ROSTER_GLOW_CUSTOM)
  }
  if (PRESET_STOPS[resolved]) {
    return PRESET_STOPS[resolved]
  }
  return [...DEFAULT_ROSTER_GLOW_STOPS]
}

export function rosterGlowGradient(
  preset: RosterGlowPreset | undefined,
  customHex?: string,
): string {
  const stops = resolveRosterGlowStops(preset, customHex)
  return `linear-gradient(45deg, ${stops.join(', ')})`
}

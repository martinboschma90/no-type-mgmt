import {
  ARTIST_ART_DIRECTION,
  ART_DIRECTION_VERSION,
  DEFAULT_ART_DIRECTION,
  getArtDirectionForSlug,
  type ArtDirection,
} from '@/cms/artDirection'
import type { Artist } from '@/types/artist'

export type { ArtDirection }
export {
  DEFAULT_ART_DIRECTION,
  ARTIST_ART_DIRECTION,
  ART_DIRECTION_VERSION,
  getArtDirectionForSlug,
}

export const IMAGE_FOCUS_MIN = 0
export const IMAGE_FOCUS_MAX = 100
export const IMAGE_SCALE_MIN = 1
export const IMAGE_SCALE_MAX = 3
export const IMAGE_SCALE_DEFAULT = 1

const PRESET_FOCUS: Record<string, { x: number; y: number }> = {
  center: { x: 50, y: 42 },
  top: { x: 50, y: 12 },
  upper: { x: 50, y: 28 },
  lower: { x: 50, y: 62 },
  bottom: { x: 50, y: 88 },
  left: { x: 28, y: 36 },
  right: { x: 72, y: 36 },
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

export function formatFocus(x: number, y: number) {
  return `${Math.round(x)}% ${Math.round(y)}%`
}

/** Parse `"50% 32%"`, `"50 32"`, or preset id → XY. */
export function parseFocusToXY(
  focus?: string | null,
): { x: number; y: number } | null {
  if (!focus) return null
  const preset = PRESET_FOCUS[focus]
  if (preset) return preset

  const m = focus.trim().match(/^(\d+(?:\.\d+)?)\s*%?\s+(\d+(?:\.\d+)?)\s*%?$/)
  if (!m) return null
  return {
    x: clamp(Number(m[1]), IMAGE_FOCUS_MIN, IMAGE_FOCUS_MAX),
    y: clamp(Number(m[2]), IMAGE_FOCUS_MIN, IMAGE_FOCUS_MAX),
  }
}

export function resolveImageScale(scale?: number | null): number {
  if (scale == null || Number.isNaN(scale)) return IMAGE_SCALE_DEFAULT
  return clamp(scale, IMAGE_SCALE_MIN, IMAGE_SCALE_MAX)
}

function needsSeedRefresh(artist: Pick<Artist, 'slug' | 'artDirectionVersion'>) {
  return (
    Boolean(ARTIST_ART_DIRECTION[artist.slug]) &&
    artist.artDirectionVersion !== ART_DIRECTION_VERSION
  )
}

/**
 * Resolve per-artist art direction.
 * Prefer explicit X/Y when current; else migrate / apply campaign seed.
 */
export function resolveArtDirection(
  artist: Pick<
    Artist,
    | 'slug'
    | 'imageFocus'
    | 'imageFocusX'
    | 'imageFocusY'
    | 'imageScale'
    | 'artDirectionVersion'
  >,
): ArtDirection {
  const seed = getArtDirectionForSlug(artist.slug)

  if (needsSeedRefresh(artist)) {
    return { ...seed }
  }

  const hasX = typeof artist.imageFocusX === 'number'
  const hasY = typeof artist.imageFocusY === 'number'

  if (hasX && hasY) {
    return {
      x: clamp(artist.imageFocusX!, IMAGE_FOCUS_MIN, IMAGE_FOCUS_MAX),
      y: clamp(artist.imageFocusY!, IMAGE_FOCUS_MIN, IMAGE_FOCUS_MAX),
      scale: resolveImageScale(artist.imageScale ?? seed.scale),
    }
  }

  const parsed = parseFocusToXY(artist.imageFocus)
  const known = ARTIST_ART_DIRECTION[artist.slug]
  const legacyIsPreset = Boolean(
    artist.imageFocus && artist.imageFocus in PRESET_FOCUS,
  )

  if (known && (!parsed || legacyIsPreset)) {
    return { ...known }
  }

  return {
    x: parsed?.x ?? seed.x,
    y: parsed?.y ?? seed.y,
    scale: resolveImageScale(artist.imageScale ?? seed.scale),
  }
}

/** Persist resolved X/Y/scale onto the artist model (migration / save). */
export function withArtDirection(artist: Artist): Artist {
  const dir = resolveArtDirection(artist)
  return {
    ...artist,
    imageFocusX: dir.x,
    imageFocusY: dir.y,
    imageScale: dir.scale,
    imageFocus: formatFocus(dir.x, dir.y),
    artDirectionVersion: ART_DIRECTION_VERSION,
  }
}

/**
 * Inline styles for portrait img inside an overflow-hidden 3:4 frame.
 * Zoom uses width/height so hover scale on a parent wrapper stays intact.
 */
export function portraitImageStyle(
  focusOrArtist?:
    | string
    | null
    | Pick<
        Artist,
        | 'slug'
        | 'imageFocus'
        | 'imageFocusX'
        | 'imageFocusY'
        | 'imageScale'
        | 'artDirectionVersion'
      >,
  scale?: number | null,
) {
  let dir: ArtDirection

  if (focusOrArtist && typeof focusOrArtist === 'object') {
    dir = resolveArtDirection(focusOrArtist)
  } else {
    const parsed = parseFocusToXY(focusOrArtist)
    dir = {
      x: parsed?.x ?? DEFAULT_ART_DIRECTION.x,
      y: parsed?.y ?? DEFAULT_ART_DIRECTION.y,
      scale: resolveImageScale(scale),
    }
  }

  const pct = `${dir.scale * 100}%`
  return {
    objectFit: 'cover' as const,
    objectPosition: formatFocus(dir.x, dir.y),
    width: pct,
    height: pct,
    maxWidth: 'none',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
  }
}

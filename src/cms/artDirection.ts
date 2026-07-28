/**
 * Per-artist editorial art direction for the 3:4 roster campaign crop.
 * Values are intentional — not a shared center crop.
 *
 * X/Y = CSS object-position percentages (0–100)
 * scale = zoom inside the cover frame (1 = default cover)
 *
 * Bump ART_DIRECTION_VERSION when campaign seeds change so stored
 * CMS values for known slugs re-hydrate from ARTIST_ART_DIRECTION.
 * Manual CMS slider edits set the current version and are kept until the next bump.
 */
export const ART_DIRECTION_VERSION = 6

export type ArtDirection = {
  x: number
  y: number
  scale: number
}

/** Soft editorial default when an artist has no custom framing yet. */
export const DEFAULT_ART_DIRECTION: ArtDirection = {
  x: 50,
  y: 28,
  scale: 1,
}

/**
 * Hand-tuned campaign framing per slug.
 * Target: shared eye-line + similar subject weight (NEVS MC as reference).
 */
export const ARTIST_ART_DIRECTION: Record<string, ArtDirection> = {
  // Aurelio — reduce empty headroom, keep jacket
  'alber-k': { x: 50, y: 34, scale: 1.18 },
  // SHANN — crop feathered lower half; protect hairline + hands
  apollonia: { x: 50, y: 18, scale: 1.34 },
  // NARRO — small in source; face/torso match roster weight
  audiowave: { x: 50, y: 36, scale: 2.5 },
  // NEVS MC — reference frame
  'bavo-mortier': { x: 50, y: 24, scale: 1.05 },
  // ESSOVILLA — keep full cap
  'c-man': { x: 50, y: 12, scale: 1.02 },
  // CHARLIZEH
  'c-track': { x: 48, y: 22, scale: 1.06 },
  // GUERERRO — right-facing profile; bias to face
  'cassa-cassa': { x: 72, y: 24, scale: 1.16 },
  // MELV!EE
  'de-jaren-nul': { x: 50, y: 28, scale: 1.22 },
}

export function getArtDirectionForSlug(slug: string): ArtDirection {
  return ARTIST_ART_DIRECTION[slug] ?? DEFAULT_ART_DIRECTION
}

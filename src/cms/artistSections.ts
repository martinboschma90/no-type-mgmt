import type { ArtistSectionConfig, ArtistSectionId } from '@/types/artist'

export type { ArtistSectionConfig, ArtistSectionId }

export const ARTIST_SECTION_META: Record<
  ArtistSectionId,
  { label: string; description: string }
> = {
  hero: {
    label: 'Hero',
    description: 'Portrait, naam, bio, booking & socials',
  },
  video: {
    label: 'Video slide',
    description: 'Gecentreerde video in het midden',
  },
  tracks: {
    label: 'Tracks',
    description: 'Music player / top tracks',
  },
}

export const DEFAULT_ARTIST_SECTIONS: ArtistSectionConfig[] = [
  { id: 'hero', visible: true },
  { id: 'video', visible: true },
  { id: 'tracks', visible: true },
]

export function normalizeArtistSections(
  sections?: ArtistSectionConfig[] | null,
): ArtistSectionConfig[] {
  const byId = new Map((sections ?? []).map((s) => [s.id, s]))
  const ordered: ArtistSectionConfig[] = []

  // Keep saved order first
  for (const s of sections ?? []) {
    if (ARTIST_SECTION_META[s.id] && !ordered.some((o) => o.id === s.id)) {
      ordered.push({ id: s.id, visible: s.visible !== false })
    }
  }

  // Append any missing defaults
  for (const def of DEFAULT_ARTIST_SECTIONS) {
    if (!ordered.some((o) => o.id === def.id)) {
      const existing = byId.get(def.id)
      ordered.push({
        id: def.id,
        visible: existing ? existing.visible !== false : def.visible,
      })
    }
  }

  return ordered
}

export function reorderSections(
  sections: ArtistSectionConfig[],
  fromIndex: number,
  toIndex: number,
): ArtistSectionConfig[] {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= sections.length ||
    toIndex >= sections.length
  ) {
    return sections
  }
  const next = [...sections]
  const [item] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, item)
  return next
}

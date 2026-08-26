import type {
  Artist,
  ArtistSectionConfig,
  ArtistSectionId,
} from '@/types/artist'

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
    label: 'Content',
    description: 'Visuals / vertical 9:16 cinematic carousel',
  },
  instagram: {
    label: 'Instagram',
    description: 'Carousel van tot 6 posts, gekoppeld via Instagram-links',
  },
  tracks: {
    label: 'Music',
    description: 'Platform embed (SoundCloud / Spotify / custom) of tracklijst',
  },
}

export const DEFAULT_ARTIST_SECTIONS: ArtistSectionConfig[] = [
  { id: 'hero', visible: true },
  { id: 'video', visible: true },
  { id: 'instagram', visible: true },
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

export function isArtistSectionVisible(
  artist: Pick<Artist, 'sections'> | null | undefined,
  id: ArtistSectionId,
): boolean {
  const section = normalizeArtistSections(artist?.sections).find((s) => s.id === id)
  return section?.visible !== false
}

export function setArtistSectionVisible(
  sections: ArtistSectionConfig[] | null | undefined,
  id: ArtistSectionId,
  visible: boolean,
): ArtistSectionConfig[] {
  return normalizeArtistSections(sections).map((section) =>
    section.id === id ? { ...section, visible } : section,
  )
}

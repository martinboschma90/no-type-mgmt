export const ARTIST_EDITOR_TABS = [
  { id: 'hero', label: 'Profiel', description: 'Foto, naam, bio en socials' },
  {
    id: 'content',
    label: 'Content',
    description: "Muziek, playlists en video's",
  },
  { id: 'instagram', label: 'Instagram', description: 'Profiel en posts' },
  {
    id: 'settings',
    label: 'Instellingen',
    description: 'Publicatie en pagina-indeling',
  },
] as const

export type ArtistEditorTabId = (typeof ARTIST_EDITOR_TABS)[number]['id']

const LEGACY_TABS: Record<string, ArtistEditorTabId> = {
  visuals: 'content',
}

export function artistEditorTabFromSearch(
  value: string | null,
): ArtistEditorTabId {
  if (!value) return 'hero'
  if (value in LEGACY_TABS) return LEGACY_TABS[value]
  const match = ARTIST_EDITOR_TABS.find((tab) => tab.id === value)
  return match?.id ?? 'hero'
}

export function artistEditorPath(slug: string, tab: ArtistEditorTabId) {
  return `/cms/artists/${slug}?tab=${tab}`
}

export function isArtistEditorTabActive(
  tabId: ArtistEditorTabId,
  searchTab: string | null,
) {
  const current = artistEditorTabFromSearch(searchTab)
  return current === tabId
}

import type { Artist } from '@/types/artist'

/** Missing / undefined means visible (legacy content). */
export function isArtistVisible(artist: Artist) {
  return artist.visible !== false
}

/** Alphabetical A–Z by name (case / accent insensitive). */
export function sortArtistsByName(artists: Artist[]) {
  return [...artists].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
  )
}

/** Public roster — visible only, A–Z. */
export function visibleArtists(artists: Artist[]) {
  return sortArtistsByName(artists.filter(isArtistVisible))
}

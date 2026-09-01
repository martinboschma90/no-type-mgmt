import type { Artist, ArtistStatus } from '@/types/artist'

export function getArtistStatus(artist: Artist): ArtistStatus {
  if (artist.status === 'draft' || artist.status === 'published') {
    return artist.status
  }
  // Legacy rows: visible !== false meant published
  return artist.visible === false ? 'draft' : 'published'
}

/** Public roster + artist pages — published only. */
export function isArtistVisible(artist: Artist) {
  return getArtistStatus(artist) === 'published'
}

/** Alphabetical A–Z by name (case / accent insensitive). */
export function sortArtistsByName(artists: Artist[]) {
  return [...artists].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
  )
}

/** Public roster — published only, A–Z. */
export function visibleArtists(artists: Artist[]) {
  return sortArtistsByName(artists.filter(isArtistVisible))
}

/** Apply draft/published + keep legacy `visible` aligned for RLS. */
export function applyArtistStatus(
  artist: Artist,
  status: ArtistStatus,
  options?: { touchPublishedAt?: boolean },
): Artist {
  const now = new Date().toISOString()
  const publishedAt =
    status === 'published'
      ? options?.touchPublishedAt || !artist.publishedAt
        ? now
        : artist.publishedAt
      : artist.publishedAt

  return {
    ...artist,
    status,
    visible: status === 'published',
    publishedAt,
  }
}

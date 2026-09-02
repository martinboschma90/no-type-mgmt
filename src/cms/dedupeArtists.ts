import type { Artist } from '@/types/artist'

function identity(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('nl')
    .replace(/[^a-z0-9]/g, '')
}

function distance(a: string, b: string) {
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index)
  for (let row = 1; row <= a.length; row++) {
    const current = [row]
    for (let column = 1; column <= b.length; column++) {
      current[column] = Math.min(
        current[column - 1] + 1,
        previous[column] + 1,
        previous[column - 1] + (a[row - 1] === b[column - 1] ? 0 : 1),
      )
    }
    previous.splice(0, previous.length, ...current)
  }
  return previous[b.length]
}

function canonicalScore(artist: Artist) {
  return distance(identity(artist.name), identity(artist.slug))
}

/** Keep one canonical Supabase record per artist name. */
export function dedupeArtists(artists: Artist[]): Artist[] {
  const byName = new Map<string, Artist>()
  for (const artist of artists) {
    const key = identity(artist.name) || identity(artist.slug)
    const current = byName.get(key)
    if (!current || canonicalScore(artist) < canonicalScore(current)) {
      byName.set(key, artist)
    }
  }
  return [...byName.values()]
}

/** Remote catalog wins, except for local drafts that have unsaved edits. */
export function mergeRemoteArtists(
  local: Artist[],
  remote: Artist[],
  dirtyIds: Set<string>,
): Artist[] {
  const localById = new Map(local.map((artist) => [artist.id, artist]))
  const localBySlug = new Map(local.map((artist) => [artist.slug, artist]))
  const merged: Artist[] = remote.map((artist) => {
    const draft =
      localById.get(artist.id) ?? localBySlug.get(artist.slug)
    if (draft && dirtyIds.has(draft.id)) return draft
    return artist
  })
  for (const artist of local) {
    if (!dirtyIds.has(artist.id)) continue
    const exists = merged.some(
      (item) => item.id === artist.id || item.slug === artist.slug,
    )
    if (!exists) merged.push(artist)
  }
  return dedupeArtists(merged)
}

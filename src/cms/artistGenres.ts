import type { Artist } from '@/types/artist'

export const MAX_ARTIST_GENRES = 8

export const GENRE_PRESETS = [
  'House',
  'Techno',
  'Electronic',
  'Dance',
  'Hip-Hop',
  'Rap',
  'Pop',
  'Afro',
  'DJ',
  'Party',
  'Radio',
  'Talk',
  'Comedy',
  'Entertainment',
] as const

export function parseGenreList(value: string | null | undefined): string[] {
  if (!value?.trim()) return []
  const raw = value.trim()
  if (raw.startsWith('[')) {
    try {
      const parsed = JSON.parse(raw) as unknown
      if (Array.isArray(parsed)) {
        return uniqueGenres(
          parsed.filter((item): item is string => typeof item === 'string'),
        )
      }
    } catch {
      /* fall through */
    }
  }
  return uniqueGenres(raw.split(/[,|/]+/))
}

export function uniqueGenres(values: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const value of values) {
    const trimmed = value.trim().replace(/\s+/g, ' ')
    if (!trimmed) continue
    const key = trimmed.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(trimmed)
    if (out.length >= MAX_ARTIST_GENRES) break
  }
  return out
}

export function artistGenres(artist: Pick<Artist, 'genre' | 'genres'>): string[] {
  if (artist.genres && artist.genres.length > 0) {
    return uniqueGenres(artist.genres)
  }
  return parseGenreList(artist.genre)
}

export function serializeGenres(artist: Pick<Artist, 'genre' | 'genres'>): string | null {
  const list = artistGenres(artist)
  return list.length ? list.join(', ') : null
}

export function withGenres(genres: string[]): Pick<Artist, 'genre' | 'genres'> {
  const list = uniqueGenres(genres)
  return {
    genres: list,
    genre: list[0] ?? '',
  }
}

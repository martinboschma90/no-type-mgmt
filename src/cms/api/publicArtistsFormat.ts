import {
  PUBLIC_ARTISTS_STORAGE_KEY,
  PUBLIC_ARTISTS_STORAGE_KEY_V2,
} from '@/cms/storageKeys'
import { visibleArtists } from '@/cms/artistVisibility'
import { storageGet, storageRemove, storageSet } from '@/lib/safeStorage'
import type { Artist } from '@/types/artist'

function isArtistLike(value: unknown): value is Artist {
  if (!value || typeof value !== 'object') return false
  const artist = value as Artist
  return typeof artist.slug === 'string' && artist.slug.length > 0
}

function parseJson(raw: string | null): unknown {
  if (!raw) return null
  try {
    return JSON.parse(raw) as unknown
  } catch {
    return null
  }
}

function isNumericKeyedRecord(value: Record<string, unknown>) {
  const keys = Object.keys(value)
  return keys.length > 0 && keys.every((key) => /^\d+$/.test(key))
}

/** Normalize array, numeric-keyed objects, or slug-keyed maps to a sorted roster. */
export function parsePublicArtistsPayload(data: unknown): Artist[] | null {
  if (!data) return null

  if (Array.isArray(data)) {
    const artists = data.filter(isArtistLike)
    return artists.length ? visibleArtists(artists) : null
  }

  if (typeof data !== 'object') return null

  const record = data as Record<string, unknown>
  const keys = Object.keys(record)
  if (keys.length === 0) return null

  const artists: Artist[] = []

  if (isNumericKeyedRecord(record)) {
    keys
      .map(Number)
      .sort((a, b) => a - b)
      .forEach((index) => {
        const item = record[String(index)]
        if (isArtistLike(item)) artists.push(item)
      })
  } else {
    for (const [slug, value] of Object.entries(record)) {
      if (!isArtistLike(value)) continue
      artists.push({ ...value, slug: value.slug || slug })
    }
  }

  return artists.length ? visibleArtists(artists) : null
}

export function publicArtistsToSlugMap(
  artists: Artist[],
): Record<string, Artist> {
  const map: Record<string, Artist> = {}
  for (const artist of visibleArtists(artists)) {
    map[artist.slug] = artist
  }
  return map
}

function isSlugKeyedMap(data: unknown): boolean {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false
  const record = data as Record<string, unknown>
  const keys = Object.keys(record)
  if (keys.length === 0 || isNumericKeyedRecord(record)) return false
  return keys.every((key) => {
    const value = record[key]
    return isArtistLike(value) && (value.slug === key || !value.slug)
  })
}

/**
 * One-time localStorage migration: numeric-keyed (or array) public roster →
 * slug-keyed `notype-public-artists-v3`.
 */
export function migrateArtistsV1toV2(): void {
  const v3Raw = storageGet(PUBLIC_ARTISTS_STORAGE_KEY)
  const v3Data = parseJson(v3Raw)
  const v2Raw = storageGet(PUBLIC_ARTISTS_STORAGE_KEY_V2)
  const v2Data = parseJson(v2Raw)

  const fromV3 = parsePublicArtistsPayload(v3Data)
  const fromV2 = parsePublicArtistsPayload(v2Data)
  const artists = fromV3 ?? fromV2

  if (artists) {
    if (!isSlugKeyedMap(v3Data)) {
      storageSet(
        PUBLIC_ARTISTS_STORAGE_KEY,
        JSON.stringify(publicArtistsToSlugMap(artists)),
      )
    }
  }

  if (v2Raw) storageRemove(PUBLIC_ARTISTS_STORAGE_KEY_V2)
}

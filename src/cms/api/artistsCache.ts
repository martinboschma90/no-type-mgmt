import {
  fetchArtistsFromSupabase,
  fetchPublicArtistsFromSupabase,
  type ArtistsReadResult,
} from '@/cms/api/artists'
import { visibleArtists } from '@/cms/artistVisibility'
import { isSupabaseConfigured } from '@/lib/supabase'
import type { Artist } from '@/types/artist'

const TTL_MS = 30_000

/** Last good Supabase public roster — never seed/local CMS data. */
export const PUBLIC_ARTISTS_STORAGE_KEY = 'notype-public-artists-v2'

export function readStoredPublicArtists(): Artist[] | null {
  try {
    const raw = localStorage.getItem(PUBLIC_ARTISTS_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed) || parsed.length === 0) return null
    return visibleArtists(parsed as Artist[])
  } catch {
    return null
  }
}

export function writeStoredPublicArtists(artists: Artist[]) {
  try {
    localStorage.setItem(PUBLIC_ARTISTS_STORAGE_KEY, JSON.stringify(artists))
  } catch {
    // Ignore quota / private mode
  }
}

export function clearStoredPublicArtists() {
  try {
    localStorage.removeItem(PUBLIC_ARTISTS_STORAGE_KEY)
  } catch {
    // ignore
  }
}

let fullInflight: Promise<ArtistsReadResult> | null = null
let fullCached: ArtistsReadResult | null = null
let fullCachedAt = 0

let publicInflight: Promise<ArtistsReadResult> | null = null
let publicCached: ArtistsReadResult | null = null
let publicCachedAt = 0

/**
 * Deduplicate concurrent / back-to-back full artist list fetches (CMS hydrate).
 */
export function fetchArtistsFromSupabaseCached(
  options?: { force?: boolean },
): Promise<ArtistsReadResult> {
  const now = Date.now()
  if (!options?.force && fullCached && now - fullCachedAt < TTL_MS) {
    return Promise.resolve(fullCached)
  }

  if (!options?.force && fullInflight) return fullInflight

  fullInflight = fetchArtistsFromSupabase()
    .then((result) => {
      fullCached = result
      fullCachedAt = Date.now()
      return result
    })
    .finally(() => {
      fullInflight = null
    })

  return fullInflight
}

/**
 * Slim public roster fetch — smaller payload, published-only.
 */
export function fetchPublicArtistsFromSupabaseCached(
  options?: { force?: boolean },
): Promise<ArtistsReadResult> {
  const now = Date.now()
  if (!options?.force && publicCached && now - publicCachedAt < TTL_MS) {
    return Promise.resolve(publicCached)
  }

  if (!options?.force && publicInflight) return publicInflight

  publicInflight = fetchPublicArtistsFromSupabase()
    .then((result) => {
      publicCached = result
      publicCachedAt = Date.now()
      return result
    })
    .finally(() => {
      publicInflight = null
    })

  return publicInflight
}

/** Clear after CMS writes so the next public/CMS read is fresh. */
export function invalidateArtistsCache() {
  fullCached = null
  fullCachedAt = 0
  fullInflight = null
  publicCached = null
  publicCachedAt = 0
  publicInflight = null
  clearStoredPublicArtists()
}

/** Start the public roster request as early as possible (module load). */
export function prefetchPublicArtists() {
  if (!isSupabaseConfigured) return
  void fetchPublicArtistsFromSupabaseCached()
}

if (typeof window !== 'undefined' && isSupabaseConfigured) {
  prefetchPublicArtists()
}

import { fetchPublicRoster, type ArtistsReadResult } from '@/cms/api/publicRead'
import { visibleArtists } from '@/cms/artistVisibility'
import { isSupabaseConfigured } from '@/lib/supabaseEnv'
import { storageGet, storageRemove, storageSet } from '@/lib/safeStorage'
import type { Artist } from '@/types/artist'

const TTL_MS = 30_000

export const PUBLIC_ARTISTS_STORAGE_KEY = 'notype-public-artists-v2'

export function readStoredPublicArtists(): Artist[] | null {
  const raw = storageGet(PUBLIC_ARTISTS_STORAGE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed) || parsed.length === 0) return null
    return visibleArtists(parsed as Artist[])
  } catch {
    return null
  }
}

export function writeStoredPublicArtists(artists: Artist[]) {
  storageSet(PUBLIC_ARTISTS_STORAGE_KEY, JSON.stringify(artists))
}

export function clearStoredPublicArtists() {
  storageRemove(PUBLIC_ARTISTS_STORAGE_KEY)
}

let publicInflight: Promise<ArtistsReadResult> | null = null
let publicCached: ArtistsReadResult | null = null
let publicCachedAt = 0

export function fetchPublicArtistsFromSupabaseCached(
  options?: { force?: boolean },
): Promise<ArtistsReadResult> {
  const now = Date.now()
  if (!options?.force && publicCached && now - publicCachedAt < TTL_MS) {
    return Promise.resolve(publicCached)
  }

  if (!options?.force && publicInflight) return publicInflight

  publicInflight = Promise.race([
    fetchPublicRoster()
      .then((result) => {
        publicCached = result
        publicCachedAt = Date.now()
        return result
      })
      .catch((error) => {
        console.warn('Public artists fetch failed', error)
        return {
          artists: publicCached?.artists ?? [],
          fromSupabase: false,
        } satisfies ArtistsReadResult
      }),
    new Promise<ArtistsReadResult>((resolve) => {
      window.setTimeout(() => {
        resolve({
          artists: publicCached?.artists ?? [],
          fromSupabase: false,
        })
      }, 2500)
    }),
  ]).finally(() => {
    publicInflight = null
  })

  return publicInflight
}

export function invalidatePublicArtistsCache() {
  publicCached = null
  publicCachedAt = 0
  publicInflight = null
  clearStoredPublicArtists()
}

export function prefetchPublicArtists() {
  if (!isSupabaseConfigured) return
  void fetchPublicArtistsFromSupabaseCached()
}

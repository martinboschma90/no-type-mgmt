import {
  PUBLIC_ARTISTS_STORAGE_KEY,
  PUBLIC_ARTISTS_STORAGE_KEY_V2,
} from '@/cms/storageKeys'
import { fetchPublicCmsArtistsRow } from '@/cms/api/publicCmsRead'
import {
  parsePublicArtistsPayload,
  publicArtistsToSlugMap,
} from '@/cms/api/publicArtistsFormat'
import { fetchPublicRoster, type ArtistsReadResult } from '@/cms/api/publicRead'
import { isSupabaseConfigured } from '@/lib/supabaseEnv'
import { storageGet, storageRemove, storageSet } from '@/lib/safeStorage'
import type { Artist } from '@/types/artist'

const TTL_MS = 30_000

export { PUBLIC_ARTISTS_STORAGE_KEY }
export { migrateArtistsV1toV2 } from '@/cms/api/publicArtistsFormat'

export function readStoredPublicArtists(): Artist[] | null {
  const raw = storageGet(PUBLIC_ARTISTS_STORAGE_KEY)
  if (!raw) return null
  try {
    return parsePublicArtistsPayload(JSON.parse(raw) as unknown)
  } catch {
    return null
  }
}

export function writeStoredPublicArtists(artists: Artist[]) {
  storageSet(
    PUBLIC_ARTISTS_STORAGE_KEY,
    JSON.stringify(publicArtistsToSlugMap(artists)),
  )
}

export function clearStoredPublicArtists() {
  storageRemove(PUBLIC_ARTISTS_STORAGE_KEY)
  storageRemove(PUBLIC_ARTISTS_STORAGE_KEY_V2)
}

let publicInflight: Promise<ArtistsReadResult> | null = null
let publicCached: ArtistsReadResult | null = null
let publicCachedAt = 0
let bootConsumed = false

function resultFromPayload(data: unknown): ArtistsReadResult | null {
  const artists = parsePublicArtistsPayload(data)
  if (!artists?.length) return null
  return { artists, fromSupabase: true }
}

function adoptBootPayload() {
  if (typeof window === 'undefined') return
  const boot = window.__NOTYPE_BOOT__
  if (!boot) return
  const fromCache = resultFromPayload(boot.cached)
  if (fromCache) {
    publicCached = fromCache
    publicCachedAt = Date.now()
  }
}

adoptBootPayload()

export function getCachedPublicArtists(): Artist[] {
  return publicCached?.artists ?? readStoredPublicArtists() ?? []
}

export function fetchPublicArtistsFromSupabaseCached(
  options?: { force?: boolean },
): Promise<ArtistsReadResult> {
  if (!options?.force && publicInflight) return publicInflight

  const bootPromise =
    !options?.force && !bootConsumed ? window.__NOTYPE_BOOT__?.promise : undefined
  if (bootPromise) {
    bootConsumed = true
    publicInflight = bootPromise
      .then((data) => {
        const result =
          resultFromPayload(data) ??
          publicCached ?? { artists: [], fromSupabase: false }
        publicCached = result
        publicCachedAt = Date.now()
        return result
      })
      .catch(() => publicCached ?? { artists: [], fromSupabase: false })
      .finally(() => {
        publicInflight = null
      })
    return publicInflight
  }

  const now = Date.now()
  if (!options?.force && publicCached && now - publicCachedAt < TTL_MS) {
    return Promise.resolve(publicCached)
  }

  publicInflight = Promise.race([
    fetchPublicCmsArtistsRow()
      .then(async (cached) => {
        if (cached && cached.length > 0) {
          return { artists: cached, fromSupabase: true } satisfies ArtistsReadResult
        }
        return fetchPublicRoster()
      })
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

export function getCachedPublicArtist(slug: string): Artist | null {
  if (!slug) return null
  const fromMemory = publicCached?.artists.find((artist) => artist.slug === slug)
  if (fromMemory) return fromMemory
  return readStoredPublicArtists()?.find((artist) => artist.slug === slug) ?? null
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

import { fetchArtistsFromSupabase, type ArtistsReadResult } from '@/cms/api/artists'
import { invalidatePublicArtistsCache } from '@/cms/api/publicArtistsCache'

const TTL_MS = 30_000

let fullInflight: Promise<ArtistsReadResult> | null = null
let fullCached: ArtistsReadResult | null = null
let fullCachedAt = 0

export {
  fetchPublicArtistsFromSupabaseCached,
  prefetchPublicArtists,
  readStoredPublicArtists,
  writeStoredPublicArtists,
  clearStoredPublicArtists,
  PUBLIC_ARTISTS_STORAGE_KEY,
} from '@/cms/api/publicArtistsCache'

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

export function invalidateArtistsCache() {
  fullCached = null
  fullCachedAt = 0
  fullInflight = null
  invalidatePublicArtistsCache()
}

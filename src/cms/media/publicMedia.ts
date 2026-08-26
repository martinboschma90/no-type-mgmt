import { getRosterImageUrl } from '@/data/artists'
import { parseMediaRef } from '@/cms/media/refs'
import { fetchPublicMediaUrl } from '@/cms/api/publicRead'

/** Seed / catalog http(s) portrait for a slug — used when `media://` cannot resolve. */
export function getSeedImageUrl(slug: string): string | undefined {
  return getRosterImageUrl(slug)
}

export function isHttpUrl(value: string | undefined | null): boolean {
  return Boolean(value && /^https?:\/\//i.test(value.trim()))
}

/** True when value is a CMS media library ref (needs IndexedDB or Storage). */
export function isMediaLibraryRef(value: string | undefined | null): boolean {
  return Boolean(parseMediaRef(value))
}

const resolvedUrlCache = new Map<string, string | null>()
const resolvedUrlInflight = new Map<string, Promise<string | null>>()

/**
 * Resolve a media:// id via REST public URL. No supabase-js.
 */
export async function resolveMediaFromSupabase(
  mediaId: string,
): Promise<string | null> {
  if (resolvedUrlCache.has(mediaId)) {
    return resolvedUrlCache.get(mediaId) ?? null
  }
  const pending = resolvedUrlInflight.get(mediaId)
  if (pending) return pending
  const task = fetchPublicMediaUrl(mediaId)
    .then((url) => {
      if (url) resolvedUrlCache.set(mediaId, url)
      return url
    })
    .finally(() => {
      resolvedUrlInflight.delete(mediaId)
    })
  resolvedUrlInflight.set(mediaId, task)
  return task
}

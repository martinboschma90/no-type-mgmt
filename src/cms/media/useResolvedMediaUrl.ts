import { useEffect, useState } from 'react'
import { useMedia } from '@/cms/media/MediaProvider'
import { parseMediaRef } from '@/cms/media/refs'
import { resolveMediaFromSupabase } from '@/cms/media/publicMedia'

/**
 * Resolve `media://id` refs to a playable URL.
 * Order: IndexedDB library → Supabase Storage public URL → optional fallback (seed http).
 * Plain http(s)/blob/path values pass through unchanged.
 */
export function useResolvedMediaUrl(
  value: string | undefined | null,
  fallback?: string | null,
): string {
  const { getAssetUrl, ready } = useMedia()
  const id = value ? parseMediaRef(value) : null
  const localUrl = id ? getAssetUrl(id) : undefined
  const [remoteUrl, setRemoteUrl] = useState<string>('')

  useEffect(() => {
    if (!id || localUrl) {
      setRemoteUrl('')
      return
    }

    let cancelled = false
    void resolveMediaFromSupabase(id).then((url) => {
      if (!cancelled) setRemoteUrl(url ?? '')
    })

    return () => {
      cancelled = true
    }
  }, [id, localUrl])

  const fallbackUrl = fallback?.trim() || ''

  if (!value) return fallbackUrl
  if (!id) return value

  if (localUrl) return localUrl
  if (remoteUrl) return remoteUrl

  // Keep seed/http fallback while IDB hydrates or when media:// is orphaned
  if (!ready || !localUrl) {
    return fallbackUrl
  }

  return fallbackUrl
}

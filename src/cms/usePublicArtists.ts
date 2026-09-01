import { useEffect, useState } from 'react'
import { fetchPublicArtistBySlug } from '@/cms/api/publicRead'
import {
  fetchPublicArtistsFromSupabaseCached,
  getCachedPublicArtist,
  getCachedPublicArtists,
  prefetchPublicArtists,
  writeStoredPublicArtists,
} from '@/cms/api/publicArtistsCache'
import { isArtistVisible, visibleArtists } from '@/cms/artistVisibility'
import { isSupabaseConfigured } from '@/lib/supabaseEnv'
import type { Artist } from '@/types/artist'
import { dedupeArtists } from '@/cms/dedupeArtists'

export function usePublicArtists() {
  const [remoteArtists, setRemoteArtists] = useState<Artist[]>(
    () =>
      isSupabaseConfigured
        ? dedupeArtists(getCachedPublicArtists())
        : [],
  )

  useEffect(() => {
    if (!isSupabaseConfigured) return

    prefetchPublicArtists()
    let cancelled = false

    void fetchPublicArtistsFromSupabaseCached()
      .then(({ artists, fromSupabase }) => {
        if (cancelled || !fromSupabase) return
        const visible = dedupeArtists(visibleArtists(artists))
        setRemoteArtists(visible)
        writeStoredPublicArtists(visible)
      })
      .catch(() => undefined)

    return () => {
      cancelled = true
    }
  }, [])

  return {
    artists: remoteArtists,
    ready: true,
    source:
      remoteArtists.length > 0 ? ('supabase' as const) : ('local' as const),
  }
}

export function usePublicArtist(slug: string) {
  const [remoteArtist, setRemoteArtist] = useState<Artist | null | undefined>(
    () => {
      if (!slug || !isSupabaseConfigured) return undefined
      const cached = getCachedPublicArtist(slug)
      return cached && isArtistVisible(cached) ? cached : undefined
    },
  )

  useEffect(() => {
    let cancelled = false
    const cached = getCachedPublicArtist(slug)
    const visibleCached =
      cached && isArtistVisible(cached) ? cached : null
    setRemoteArtist(visibleCached ?? undefined)

    if (!isSupabaseConfigured) {
      setRemoteArtist(visibleCached)
      return
    }

    void fetchPublicArtistBySlug(slug)
      .then((artist) => {
        if (cancelled) return
        if (artist && isArtistVisible(artist)) {
          setRemoteArtist(artist)
        } else if (!visibleCached) {
          setRemoteArtist(null)
        }
      })
      .catch(() => {
        if (!cancelled && !visibleCached) setRemoteArtist(null)
      })

    return () => {
      cancelled = true
    }
  }, [slug])

  const checkingRemote = isSupabaseConfigured && remoteArtist === undefined

  return {
    artist: checkingRemote ? undefined : remoteArtist ?? undefined,
    source:
      remoteArtist && remoteArtist.slug === slug
        ? ('supabase' as const)
        : ('local' as const),
    checkingRemote,
  }
}

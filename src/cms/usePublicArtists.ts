import { useEffect, useState } from 'react'
import { fetchPublicArtistBySlug } from '@/cms/api/publicRead'
import {
  fetchPublicArtistsFromSupabaseCached,
  prefetchPublicArtists,
  readStoredPublicArtists,
  writeStoredPublicArtists,
} from '@/cms/api/publicArtistsCache'
import { isArtistVisible, visibleArtists } from '@/cms/artistVisibility'
import { isSupabaseConfigured } from '@/lib/supabaseEnv'
import type { Artist } from '@/types/artist'

export function usePublicArtists() {
  const [remoteArtists, setRemoteArtists] = useState<Artist[]>(
    () => (isSupabaseConfigured ? readStoredPublicArtists() : null) ?? [],
  )

  useEffect(() => {
    if (!isSupabaseConfigured) return

    prefetchPublicArtists()
    let cancelled = false

    void fetchPublicArtistsFromSupabaseCached()
      .then(({ artists, fromSupabase }) => {
        if (cancelled || !fromSupabase) return
        const visible = visibleArtists(artists)
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
    undefined,
  )

  useEffect(() => {
    let cancelled = false
    setRemoteArtist(undefined)

    if (!isSupabaseConfigured) {
      setRemoteArtist(null)
      return
    }

    void fetchPublicArtistBySlug(slug)
      .then((artist) => {
        if (cancelled) return
        if (artist && isArtistVisible(artist)) {
          setRemoteArtist(artist)
        } else {
          setRemoteArtist(null)
        }
      })
      .catch(() => {
        if (!cancelled) setRemoteArtist(null)
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

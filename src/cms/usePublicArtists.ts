import { useEffect, useMemo, useState } from 'react'
import {
  fetchArtistBySlugFromSupabase,
  fetchArtistsFromSupabase,
} from '@/cms/api/artists'
import { useCms } from '@/cms/CmsProvider'
import { isArtistVisible, visibleArtists } from '@/cms/artistVisibility'
import type { Artist } from '@/types/artist'

/**
 * Public roster: Supabase when it has artists, otherwise local CMS/seed.
 * Does not write to Supabase. CMS providers stay on localStorage.
 */
export function usePublicArtists() {
  const { content } = useCms()
  const localArtists = useMemo(
    () => visibleArtists(content.artists),
    [content.artists],
  )

  const [remoteArtists, setRemoteArtists] = useState<Artist[] | null>(null)

  useEffect(() => {
    let cancelled = false

    void fetchArtistsFromSupabase().then(({ artists, fromSupabase }) => {
      if (cancelled) return
      if (fromSupabase) {
        setRemoteArtists(visibleArtists(artists))
      } else {
        setRemoteArtists(null)
      }
    })

    return () => {
      cancelled = true
    }
  }, [])

  return {
    artists: remoteArtists ?? localArtists,
    source: remoteArtists ? ('supabase' as const) : ('local' as const),
  }
}

/**
 * Public artist detail: prefer Supabase row when present & visible,
 * else local CMS artist.
 */
export function usePublicArtist(slug: string) {
  const { getArtistBySlug } = useCms()
  const localArtist = getArtistBySlug(slug)
  const localPublic =
    localArtist && isArtistVisible(localArtist) ? localArtist : undefined

  const [remoteArtist, setRemoteArtist] = useState<Artist | null | undefined>(
    undefined,
  )

  useEffect(() => {
    let cancelled = false
    setRemoteArtist(undefined)

    void fetchArtistBySlugFromSupabase(slug).then((artist) => {
      if (cancelled) return
      if (artist && isArtistVisible(artist)) {
        setRemoteArtist(artist)
      } else {
        setRemoteArtist(null)
      }
    })

    return () => {
      cancelled = true
    }
  }, [slug])

  // undefined = still probing supabase; null = no remote; Artist = use remote
  const artist =
    remoteArtist === undefined
      ? localPublic
      : remoteArtist ?? localPublic

  return {
    artist,
    source:
      remoteArtist && remoteArtist.slug === slug
        ? ('supabase' as const)
        : ('local' as const),
    /** True while first Supabase request for this slug is in flight. */
    checkingRemote: remoteArtist === undefined,
  }
}

import { useEffect, useMemo, useState } from 'react'
import { fetchArtistBySlugFromSupabase } from '@/cms/api/artists'
import {
  fetchPublicArtistsFromSupabaseCached,
  prefetchPublicArtists,
  readStoredPublicArtists,
  writeStoredPublicArtists,
} from '@/cms/api/artistsCache'
import { useCms } from '@/cms/CmsProvider'
import { isArtistVisible, visibleArtists } from '@/cms/artistVisibility'
import { isSupabaseConfigured } from '@/lib/supabase'
import type { Artist } from '@/types/artist'

/**
 * Public roster: use last Supabase snapshot instantly when present, then refresh.
 * Never flash seed/localStorage CMS artists while waiting on the network.
 */
export function usePublicArtists() {
  const { content } = useCms()
  const localArtists = useMemo(
    () => visibleArtists(content.artists),
    [content.artists],
  )

  const [remoteArtists, setRemoteArtists] = useState<Artist[] | null>(() =>
    isSupabaseConfigured ? readStoredPublicArtists() : null,
  )
  const [ready, setReady] = useState(
    () => !isSupabaseConfigured || readStoredPublicArtists() !== null,
  )

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setReady(true)
      return
    }

    prefetchPublicArtists()
    let cancelled = false

    void fetchPublicArtistsFromSupabaseCached().then(
      ({ artists, fromSupabase }) => {
        if (cancelled) return
        if (fromSupabase) {
          const visible = visibleArtists(artists)
          setRemoteArtists(visible)
          writeStoredPublicArtists(visible)
        } else if (remoteArtists === null) {
          setRemoteArtists(null)
        }
        setReady(true)
      },
    )

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only refresh
  }, [])

  const waitingForRemote =
    isSupabaseConfigured && !ready && remoteArtists === null

  return {
    artists: waitingForRemote
      ? []
      : remoteArtists !== null
        ? remoteArtists
        : localArtists,
    ready: !waitingForRemote,
    source:
      remoteArtists !== null ? ('supabase' as const) : ('local' as const),
  }
}

/**
 * Public artist detail: prefer Supabase when configured.
 * Does not flash a local/seed artist while the remote check is in flight.
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

    if (!isSupabaseConfigured) {
      setRemoteArtist(null)
      return
    }

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

  const checkingRemote = isSupabaseConfigured && remoteArtist === undefined

  const artist = checkingRemote ? undefined : remoteArtist ?? localPublic

  return {
    artist,
    source:
      remoteArtist && remoteArtist.slug === slug
        ? ('supabase' as const)
        : ('local' as const),
    checkingRemote,
  }
}

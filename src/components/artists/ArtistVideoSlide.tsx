import { useEffect, useMemo, useState } from 'react'
import type { Artist } from '@/types/artist'
import {
  artistHasVideos,
  normalizeArtistVideos,
} from '@/cms/artistVideos'
import { ArtistReelsCarousel } from '@/components/artists/ArtistReelsCarousel'
import { isLiveVideoSizeAllowed } from '@/cms/media/videoLimits'

type ArtistVideoSlideProps = {
  artist: Artist
  /** Show CMS empty-state when no video is linked yet */
  showEmptyState?: boolean
  /** CMS live preview — muted autoplay on the active reel */
  previewMode?: boolean
}

async function readClipBytes(url: string) {
  if (!/^https?:\/\//i.test(url)) return null
  try {
    const response = await fetch(url, { method: 'HEAD' })
    const size = Number(response.headers.get('content-length') || 0)
    return response.ok && size > 0 ? size : null
  } catch {
    return null
  }
}

/**
 * Artist page Visuals section — cinematic filmstrip for short vertical clips.
 * Falls back to legacy `videoUrl` via normalizeArtistVideos.
 */
export function ArtistVideoSlide({
  artist,
  showEmptyState = false,
  previewMode = false,
}: ArtistVideoSlideProps) {
  const sourceVideos = normalizeArtistVideos(artist)
  const clipKey = sourceVideos
    .map((video) => `${video.id}:${video.clipUrl ?? ''}:${video.clipBytes ?? ''}:${video.focusX ?? 50}:${video.focusY ?? 50}`)
    .join('|')
  const previewVideos = useMemo(
    () => sourceVideos,
    // clipKey captures the live-relevant fields
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [clipKey],
  )
  const [liveVideos, setLiveVideos] = useState(() =>
    previewMode
      ? previewVideos
      : previewVideos.filter((video) => Boolean(video.clipUrl)),
  )

  useEffect(() => {
    if (previewMode) {
      setLiveVideos(previewVideos)
      return
    }

    const withClip = previewVideos.filter((video) => Boolean(video.clipUrl))
    let cancelled = false
    setLiveVideos(withClip)

    void Promise.all(
      withClip.map(async (video) => {
        if (isLiveVideoSizeAllowed(video.clipBytes ?? 0)) return video
        if ((video.clipBytes ?? 0) > 0) return null
        const size = await readClipBytes(video.clipUrl ?? '')
        if (size == null) return video
        return isLiveVideoSizeAllowed(size) ? video : null
      }),
    ).then((rows) => {
      if (cancelled) return
      setLiveVideos(rows.filter((row) => row != null))
    })

    return () => {
      cancelled = true
    }
  }, [previewMode, previewVideos])

  if (!artistHasVideos(artist) && !showEmptyState) return null

  return (
    <ArtistReelsCarousel
      artist={artist}
      videos={previewMode ? previewVideos : liveVideos}
      showEmptyState={showEmptyState}
      previewMode={previewMode}
    />
  )
}

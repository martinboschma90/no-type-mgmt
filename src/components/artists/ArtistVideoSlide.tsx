import type { Artist } from '@/types/artist'
import {
  artistHasVideos,
  normalizeArtistVideos,
} from '@/cms/artistVideos'
import { ArtistReelsCarousel } from '@/components/artists/ArtistReelsCarousel'

type ArtistVideoSlideProps = {
  artist: Artist
  /** Show CMS empty-state when no video is linked yet */
  showEmptyState?: boolean
  /** CMS live preview — muted autoplay on the active reel */
  previewMode?: boolean
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
  const videos = normalizeArtistVideos(artist)

  if (!artistHasVideos(artist) && !showEmptyState) return null

  return (
    <ArtistReelsCarousel
      artist={artist}
      videos={videos}
      showEmptyState={showEmptyState}
      previewMode={previewMode}
    />
  )
}

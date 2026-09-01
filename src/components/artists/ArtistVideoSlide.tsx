import type { Artist, ArtistVideo } from '@/types/artist'
import type { ArtistPreviewFocus } from '@/cms/artistEditorTabs'
import {
  artistHasVideos,
  normalizeArtistVideos,
} from '@/cms/artistVideos'
import { ArtistReelsCarousel } from '@/components/artists/ArtistReelsCarousel'

const MOCK_ARTIST_VIDEOS: ArtistVideo[] = [
  {
    id: 'preview-video-1',
    title: 'Live',
    videoUrl:
      'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  },
  {
    id: 'preview-video-2',
    title: 'Backstage',
    videoUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
  },
  {
    id: 'preview-video-3',
    title: 'Studio',
    videoUrl: 'https://media.w3.org/2010/05/bunny/trailer.mp4',
  },
  {
    id: 'preview-video-4',
    title: 'Visual',
    videoUrl: 'https://media.w3.org/2010/05/video/movie_300.mp4',
  },
]

type ArtistVideoSlideProps = {
  artist: Artist
  /** Show CMS empty-state when no video is linked yet */
  showEmptyState?: boolean
  /** CMS live preview — muted autoplay on the active reel */
  previewMode?: boolean
  previewFocus?: ArtistPreviewFocus
}

/**
 * Artist page Visuals section — cinematic filmstrip for short vertical clips.
 * Falls back to legacy `videoUrl` via normalizeArtistVideos.
 */
export function ArtistVideoSlide({
  artist,
  showEmptyState = false,
  previewMode = false,
  previewFocus,
}: ArtistVideoSlideProps) {
  const artistVideos = normalizeArtistVideos(artist)
  const videos =
    previewMode && artistVideos.length === 0 ? MOCK_ARTIST_VIDEOS : artistVideos

  if (!artistHasVideos(artist) && !showEmptyState) return null

  return (
    <ArtistReelsCarousel
      artist={artist}
      videos={videos}
      showEmptyState={showEmptyState}
      previewMode={previewMode}
      previewFocus={previewFocus}
    />
  )
}

import { lazy, Suspense, type ReactNode } from 'react'
import { ArtistHero } from '@/components/artists/ArtistHero'
import { isInstagramFeedActive } from '@/cms/artistInstagram'
import { artistHasVideos } from '@/cms/artistVideos'
import { normalizeArtistSections } from '@/cms/artistSections'
import { NearMount } from '@/lib/NearMount'
import type { ArtistPreviewFocus } from '@/cms/artistEditorTabs'
import type { Artist } from '@/types/artist'

const ArtistVideoSlide = lazy(() =>
  import('@/components/artists/ArtistVideoSlide').then((m) => ({
    default: m.ArtistVideoSlide,
  })),
)
const RelatedArtists = lazy(() =>
  import('@/components/artists/RelatedArtists').then((m) => ({
    default: m.RelatedArtists,
  })),
)
const ArtistInstagramCarousel = lazy(() =>
  import('@/components/artists/ArtistInstagramCarousel').then((m) => ({
    default: m.ArtistInstagramCarousel,
  })),
)

type ArtistPageSectionsProps = {
  artist: Artist
  artists?: Artist[]
  previewMode?: boolean
  previewFocus?: ArtistPreviewFocus
}

function LazySection({ children }: { children: ReactNode }) {
  return <Suspense fallback={null}>{children}</Suspense>
}

/** Renders artist page blocks in CMS-defined order. */
export function ArtistPageSections({
  artist,
  artists = [],
  previewMode = false,
  previewFocus = 'hero',
}: ArtistPageSectionsProps) {
  const sections = normalizeArtistSections(artist.sections)

  return (
    <>
      {sections.map((section) => {
        const hidden = !section.visible
        if (hidden) return null

        switch (section.id) {
          case 'hero':
            return (
              <ArtistHero
                key="hero"
                artist={artist}
                previewFocus={previewMode ? previewFocus : undefined}
              />
            )
          case 'video': {
            if (!artistHasVideos(artist)) return null
            return (
              <NearMount key="video" minHeight={520}>
                <LazySection>
                  <ArtistVideoSlide
                    artist={artist}
                    previewMode={previewMode}
                  />
                </LazySection>
              </NearMount>
            )
          }
          case 'instagram': {
            if (!previewMode && !isInstagramFeedActive(artist)) return null
            return (
              <NearMount key="instagram" minHeight={280}>
                <LazySection>
                  <ArtistInstagramCarousel
                    artist={artist}
                    showEmptyState={previewMode}
                    previewFocus={previewMode ? previewFocus : undefined}
                  />
                </LazySection>
              </NearMount>
            )
          }
          case 'tracks':
            return null
          case 'related':
            return (
              <NearMount key="related" minHeight={420}>
                <LazySection>
                  <RelatedArtists
                    artist={artist}
                    artists={artists}
                  />
                </LazySection>
              </NearMount>
            )
          default:
            return null
        }
      })}
    </>
  )
}

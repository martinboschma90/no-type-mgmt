import { lazy, Suspense, type ReactNode } from 'react'
import { ArtistHero } from '@/components/artists/ArtistHero'
import { ArtistVideoSlide } from '@/components/artists/ArtistVideoSlide'
import { RelatedArtists } from '@/components/artists/RelatedArtists'
import { isInstagramFeedActive } from '@/cms/artistInstagram'
import { artistHasVideos } from '@/cms/artistVideos'
import { normalizeArtistSections } from '@/cms/artistSections'
import type { ArtistPreviewFocus } from '@/cms/artistEditorTabs'
import type { Artist } from '@/types/artist'
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
        const hiddenOnLive = !section.visible
        if (
          hiddenOnLive &&
          !(previewMode && (section.id === 'video' || section.id === 'instagram'))
        ) {
          return null
        }

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
            if (!previewMode && !artistHasVideos(artist)) return null
            const slide = (
              <ArtistVideoSlide
                artist={artist}
                previewMode={previewMode}
                showEmptyState={previewMode}
              />
            )
            return (
              <div key="video">{slide}</div>
            )
          }
          case 'instagram': {
            if (!previewMode && !isInstagramFeedActive(artist)) return null
            return (
              <LazySection key="instagram">
                <ArtistInstagramCarousel
                  artist={artist}
                  showEmptyState={previewMode}
                  previewFocus={previewMode ? previewFocus : undefined}
                />
              </LazySection>
            )
          }
          case 'tracks':
            return null
          case 'related':
            return (
              <RelatedArtists
                key="related"
                artist={artist}
                artists={artists}
              />
            )
          default:
            return null
        }
      })}
    </>
  )
}

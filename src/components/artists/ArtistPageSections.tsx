import { lazy, Suspense, type ReactNode } from 'react'
import { ArtistHero } from '@/components/artists/ArtistHero'
import { isMusicEmbedActive } from '@/cms/artistMusic'
import { isInstagramFeedActive } from '@/cms/artistInstagram'
import { artistHasVideos } from '@/cms/artistVideos'
import { normalizeArtistSections } from '@/cms/artistSections'
import type { Artist } from '@/types/artist'

const ArtistVideoSlide = lazy(() =>
  import('@/components/artists/ArtistVideoSlide').then((m) => ({
    default: m.ArtistVideoSlide,
  })),
)
const ArtistInstagramCarousel = lazy(() =>
  import('@/components/artists/ArtistInstagramCarousel').then((m) => ({
    default: m.ArtistInstagramCarousel,
  })),
)
const MusicPlayer = lazy(() =>
  import('@/components/artists/MusicPlayer').then((m) => ({
    default: m.MusicPlayer,
  })),
)

type ArtistPageSectionsProps = {
  artist: Artist
  previewMode?: boolean
}

function hasMusicToShow(artist: Artist) {
  if (isMusicEmbedActive(artist.music)) return true
  return Boolean(artist.tracks?.length)
}

function LazySection({ children }: { children: ReactNode }) {
  return <Suspense fallback={null}>{children}</Suspense>
}

/** Renders artist page blocks in CMS-defined order. */
export function ArtistPageSections({
  artist,
  previewMode = false,
}: ArtistPageSectionsProps) {
  const sections = normalizeArtistSections(artist.sections)

  return (
    <>
      {sections.map((section) => {
        if (!section.visible) return null

        switch (section.id) {
          case 'hero':
            return <ArtistHero key="hero" artist={artist} />
          case 'video': {
            if (!previewMode && !artistHasVideos(artist)) return null
            return (
              <LazySection key="video">
                <ArtistVideoSlide
                  artist={artist}
                  previewMode={previewMode}
                  showEmptyState={previewMode}
                />
              </LazySection>
            )
          }
          case 'instagram': {
            if (!previewMode && !isInstagramFeedActive(artist)) return null
            return (
              <LazySection key="instagram">
                <ArtistInstagramCarousel
                  artist={artist}
                  showEmptyState={previewMode}
                />
              </LazySection>
            )
          }
          case 'tracks': {
            if (!previewMode && !hasMusicToShow(artist)) return null
            return (
              <LazySection key="tracks">
                <section className="mx-auto max-w-[1400px] px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
                  <div className="mb-5">
                    <p className="type-label text-[0.6rem] tracking-[0.18em] text-ink/40 uppercase">
                      Music
                    </p>
                    <h2 className="type-headline mt-1 text-2xl text-ink sm:text-3xl">
                      Listen
                    </h2>
                  </div>
                  <div className="max-w-3xl">
                    <MusicPlayer artist={artist} />
                  </div>
                </section>
              </LazySection>
            )
          }
          default:
            return null
        }
      })}
    </>
  )
}

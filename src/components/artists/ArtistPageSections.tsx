import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from 'react'
import { ArtistHero } from '@/components/artists/ArtistHero'
import { isMusicEmbedActive } from '@/cms/artistMusic'
import { isInstagramFeedActive } from '@/cms/artistInstagram'
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

function DeferredSection({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShow(true)
          io.disconnect()
        }
      },
      { rootMargin: '280px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={ref}>
      {show ? (
        <Suspense fallback={<div className="min-h-[12rem]" aria-hidden />}>
          {children}
        </Suspense>
      ) : (
        <div className="min-h-[12rem]" aria-hidden />
      )}
    </div>
  )
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
          case 'video':
            return (
              <DeferredSection key="video">
                <ArtistVideoSlide
                  artist={artist}
                  previewMode={previewMode}
                  showEmptyState={previewMode}
                />
              </DeferredSection>
            )
          case 'instagram': {
            if (!previewMode && !isInstagramFeedActive(artist)) return null
            return (
              <DeferredSection key="instagram">
                <ArtistInstagramCarousel
                  artist={artist}
                  showEmptyState={previewMode}
                />
              </DeferredSection>
            )
          }
          case 'tracks': {
            if (!previewMode && !hasMusicToShow(artist)) return null
            return (
              <DeferredSection key="tracks">
                <div className="mx-auto max-w-[1400px] px-4 pb-16 sm:px-6 lg:grid lg:grid-cols-12 lg:gap-10 lg:px-8">
                  <div className="lg:col-span-7 lg:col-start-6">
                    <MusicPlayer artist={artist} />
                  </div>
                </div>
              </DeferredSection>
            )
          }
          default:
            return null
        }
      })}
    </>
  )
}

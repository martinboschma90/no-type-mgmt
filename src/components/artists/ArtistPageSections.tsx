import { ArtistHero } from '@/components/artists/ArtistHero'
import { ArtistVideoSlide } from '@/components/artists/ArtistVideoSlide'
import { MusicPlayer } from '@/components/artists/MusicPlayer'
import { normalizeArtistSections } from '@/cms/artistSections'
import type { Artist } from '@/types/artist'

type ArtistPageSectionsProps = {
  artist: Artist
  /** In CMS preview, show empty video slot so layout is obvious */
  previewMode?: boolean
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
              <ArtistVideoSlide
                key="video"
                artist={artist}
                showEmptyState={previewMode || Boolean(!artist.videoUrl)}
              />
            )
          case 'tracks':
            return (
              <div
                key="tracks"
                className="mx-auto max-w-[1400px] px-4 pb-16 sm:px-6 lg:grid lg:grid-cols-12 lg:gap-10 lg:px-8"
              >
                <div className="lg:col-span-7 lg:col-start-6">
                  <MusicPlayer artist={artist} />
                </div>
              </div>
            )
          default:
            return null
        }
      })}
    </>
  )
}

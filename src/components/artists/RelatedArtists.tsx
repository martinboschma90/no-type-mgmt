import { useRef } from 'react'
import { ArtistCard } from '@/components/artists/ArtistCard'
import { artistGenres } from '@/cms/artistGenres'
import { visibleArtists } from '@/cms/artistVisibility'
import type { Artist } from '@/types/artist'

export function RelatedArtists({
  artist,
  artists,
}: {
  artist: Artist
  artists: Artist[]
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const genres = new Set(artistGenres(artist).map((genre) => genre.toLowerCase()))
  const related = visibleArtists(artists)
    .filter((candidate) => candidate.id !== artist.id && candidate.slug !== artist.slug)
    .filter((candidate) => {
      const url = candidate.imageUrl?.trim() ?? ''
      return url.startsWith('http://') || url.startsWith('https://')
    })
    .map((candidate, index) => ({
      artist: candidate,
      index,
      score: artistGenres(candidate).filter((genre) =>
        genres.has(genre.toLowerCase()),
      ).length,
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((entry) => entry.artist)

  if (related.length === 0) return null

  const scroll = (direction: -1 | 1) => {
    trackRef.current?.scrollBy({
      left: direction * trackRef.current.clientWidth * 0.82,
      behavior: 'smooth',
    })
  }

  return (
    <section className="mx-auto max-w-[1400px] px-4 pb-20 pt-8 sm:px-6 lg:px-8">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="type-label text-[0.6rem] tracking-[0.18em] text-ink/40 uppercase">
            Discover
          </p>
          <h2 className="type-headline mt-1 text-2xl text-ink sm:text-3xl">
            More artists
          </h2>
        </div>
        {related.length > 4 ? (
          <div className="flex gap-2">
            <button
              type="button"
              aria-label="Vorige artiesten"
              onClick={() => scroll(-1)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/15 text-sm text-ink transition-colors hover:border-ink/35"
            >
              ←
            </button>
            <button
              type="button"
              aria-label="Volgende artiesten"
              onClick={() => scroll(1)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/15 text-sm text-ink transition-colors hover:border-ink/35"
            >
              →
            </button>
          </div>
        ) : null}
      </div>
      <div
        ref={trackRef}
        className="grid snap-x snap-mandatory grid-flow-col auto-cols-[76%] gap-3 overflow-x-auto overscroll-x-contain pb-2 [scrollbar-width:none] sm:auto-cols-[46%] sm:gap-4 lg:auto-cols-[calc((100%-3rem)/4)] [&::-webkit-scrollbar]:hidden"
      >
        {related.map((candidate, index) => (
          <div key={candidate.id} className="snap-start">
            <ArtistCard artist={candidate} index={index + 4} />
          </div>
        ))}
      </div>
    </section>
  )
}

import { useCallback, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  instagramPostsFromArtist,
  type InstagramEmbed,
} from '@/cms/artistInstagram'
import type { Artist } from '@/types/artist'

type ArtistInstagramCarouselProps = {
  artist: Artist
  showEmptyState?: boolean
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden>
      <path d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Zm5 4.5A4.5 4.5 0 1 0 16.5 12 4.5 4.5 0 0 0 12 7.5Zm0 7.2A2.7 2.7 0 1 1 14.7 12 2.7 2.7 0 0 1 12 14.7ZM17.6 6.3a1.05 1.05 0 1 0 1.05 1.05 1.05 1.05 0 0 0-1.05-1.05Z" />
    </svg>
  )
}

function InstagramTile({ post }: { post: InstagramEmbed }) {
  const [showImage, setShowImage] = useState(true)
  const thumb = `https://www.instagram.com/${post.kind === 'reel' ? 'reel' : 'p'}/${post.shortcode}/media/?size=m`

  return (
    <a
      href={post.permalink}
      target="_blank"
      rel="noreferrer"
      className="relative block aspect-square w-full bg-[#111111] transition-opacity hover:opacity-90"
      aria-label="Open Instagram post"
    >
      {showImage ? (
        <img
          src={thumb}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
          onError={() => setShowImage(false)}
        />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center text-white/35">
          <InstagramIcon />
        </span>
      )}
    </a>
  )
}

export function ArtistInstagramCarousel({
  artist,
  showEmptyState = false,
}: ArtistInstagramCarouselProps) {
  const posts = instagramPostsFromArtist(artist.instagramFeed)
  const scrollerRef = useRef<HTMLDivElement>(null)

  const slide = useCallback((dir: -1 | 1) => {
    const el = scrollerRef.current
    if (!el) return
    const tile = el.firstElementChild
    const step =
      tile instanceof HTMLElement ? tile.offsetWidth + 8 : el.clientWidth
    el.scrollBy({ left: dir * step * 2, behavior: 'smooth' })
  }, [])

  if (posts.length === 0) {
    if (!showEmptyState) return null
    return (
      <section className="px-4 py-10 sm:px-6 lg:px-8" aria-label={`${artist.name} Instagram`}>
        <div className="mx-auto max-w-[1400px] px-4 py-8 text-center">
          <p className="type-body text-xs text-ink/45">
            Koppel tot 6 Instagram post-links in het CMS.
          </p>
          <Link
            to={`/cms/artists/${artist.slug}`}
            className="type-ui mt-3 inline-block text-[0.65rem] text-[#D8FF3E] hover:opacity-80"
          >
            Links toevoegen →
          </Link>
        </div>
      </section>
    )
  }

  const canSlide = posts.length > 6

  return (
    <section
      className="relative px-4 py-8 sm:px-6 sm:py-10 lg:px-8"
      aria-label={`${artist.name} Instagram`}
    >
      <div className="relative mx-auto max-w-[1400px]">
        {canSlide ? (
          <>
            <button
              type="button"
              aria-label="Vorige posts"
              onClick={() => slide(-1)}
              className="absolute top-1/2 left-0 z-10 hidden h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-[#0c0b0d]/80 text-ink md:flex"
            >
              <Chevron dir="left" />
            </button>
            <button
              type="button"
              aria-label="Volgende posts"
              onClick={() => slide(1)}
              className="absolute top-1/2 right-0 z-10 hidden h-10 w-10 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-[#0c0b0d]/80 text-ink md:flex"
            >
              <Chevron dir="right" />
            </button>
          </>
        ) : null}

        <div
          ref={scrollerRef}
          className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {posts.map((post) => (
            <div
              key={post.permalink}
              className="w-[calc((100%-0.5rem)/2)] shrink-0 snap-start sm:w-[calc((100%-1rem)/3)] md:w-[calc((100%-2.5rem)/6)]"
            >
              <InstagramTile post={post} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Chevron({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden
    >
      {dir === 'left' ? (
        <path d="M12 5 7 10l5 5" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="m8 5 5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  )
}

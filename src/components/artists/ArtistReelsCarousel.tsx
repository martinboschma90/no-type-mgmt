import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { Artist, ArtistVideo } from '@/types/artist'
import { useResolvedMediaUrl } from '@/cms/media/useResolvedMediaUrl'

type ReelSlideProps = {
  video: ArtistVideo
  fallbackPoster?: string
  active: boolean
  near: boolean
}

function ReelSlide({
  video,
  fallbackPoster,
  active,
  near,
}: ReelSlideProps) {
  const videoUrl = useResolvedMediaUrl(video.videoUrl)
  const posterUrl = useResolvedMediaUrl(video.posterUrl || fallbackPoster)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [showPoster, setShowPoster] = useState(true)
  const shouldLoad = active || near

  useEffect(() => {
    const el = videoRef.current
    if (!el) return

    if (!active) {
      el.pause()
      return
    }

    const play = () => {
      void el
        .play()
        .then(() => setShowPoster(false))
        .catch(() => setShowPoster(true))
    }

    if (el.readyState >= 2) play()
    else {
      const onReady = () => play()
      el.addEventListener('loadeddata', onReady, { once: true })
      return () => el.removeEventListener('loadeddata', onReady)
    }
  }, [active, videoUrl])

  useEffect(() => {
    if (!active) setShowPoster(true)
  }, [active, videoUrl])

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#090909]">
      {posterUrl ? (
        <img
          src={posterUrl}
          alt=""
          className={[
            'absolute inset-0 h-full w-full object-cover transition-opacity duration-500',
            showPoster ? 'opacity-100' : 'opacity-0',
          ].join(' ')}
          draggable={false}
        />
      ) : null}

      {shouldLoad && videoUrl ? (
        <video
          ref={videoRef}
          key={videoUrl}
          src={videoUrl}
          poster={posterUrl || undefined}
          className="absolute inset-0 h-full w-full object-cover"
          muted
          loop
          playsInline
          preload={active ? 'auto' : 'metadata'}
          onPlaying={() => setShowPoster(false)}
        />
      ) : null}

      {video.title ? (
        <p className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 pt-10 pb-4 type-label text-[0.65rem] tracking-[0.14em] text-white/80 uppercase">
          {video.title}
        </p>
      ) : null}
    </div>
  )
}

type ArtistReelsCarouselProps = {
  artist: Artist
  videos: ArtistVideo[]
  showEmptyState?: boolean
  previewMode?: boolean
}

/** Premium 9:16 vertical reels carousel for artist pages. */
export function ArtistReelsCarousel({
  artist,
  videos,
  showEmptyState = false,
}: ArtistReelsCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)
  const dragRef = useRef<{
    pointerId: number
    startX: number
    scrollLeft: number
  } | null>(null)

  const count = videos.length

  const goTo = useCallback(
    (next: number) => {
      const el = scrollerRef.current
      if (!el || count === 0) return
      const clamped = ((next % count) + count) % count
      const slide = el.children[clamped] as HTMLElement | undefined
      slide?.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      })
      setIndex(clamped)
    },
    [count],
  )

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return

    const onScroll = () => {
      const slides = Array.from(el.children) as HTMLElement[]
      if (slides.length === 0) return
      const center = el.scrollLeft + el.clientWidth / 2
      let best = 0
      let bestDist = Infinity
      slides.forEach((slide, i) => {
        const mid = slide.offsetLeft + slide.offsetWidth / 2
        const dist = Math.abs(mid - center)
        if (dist < bestDist) {
          bestDist = dist
          best = i
        }
      })
      setIndex(best)
    }

    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [count])

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    // Touch: native swipe + scroll-snap. Mouse/pen: drag-to-scroll.
    if (e.pointerType === 'touch') return
    const el = scrollerRef.current
    if (!el) return
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      scrollLeft: el.scrollLeft,
    }
    el.setPointerCapture(e.pointerId)
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const el = scrollerRef.current
    const drag = dragRef.current
    if (!el || !drag || drag.pointerId !== e.pointerId) return
    el.scrollLeft = drag.scrollLeft - (e.clientX - drag.startX)
  }

  function onPointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    const el = scrollerRef.current
    const drag = dragRef.current
    if (!el || !drag || drag.pointerId !== e.pointerId) return
    dragRef.current = null
    try {
      el.releasePointerCapture(e.pointerId)
    } catch {
      /* already released */
    }
    const slides = Array.from(el.children) as HTMLElement[]
    const center = el.scrollLeft + el.clientWidth / 2
    let best = 0
    let bestDist = Infinity
    slides.forEach((slide, i) => {
      const mid = slide.offsetLeft + slide.offsetWidth / 2
      const dist = Math.abs(mid - center)
      if (dist < bestDist) {
        bestDist = dist
        best = i
      }
    })
    goTo(best)
  }

  if (count === 0) {
    if (!showEmptyState) return null
    return (
      <section
        className="px-4 py-10 sm:px-6 sm:py-14 lg:px-8"
        aria-label={`${artist.name} video`}
      >
        <motion.div
          className="mx-auto max-w-[420px]"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="type-label mb-4 text-center text-ink/40">Reels</p>
          <div className="mx-auto aspect-[9/16] max-h-[min(72vh,640px)] w-full max-w-[360px] overflow-hidden rounded-[1.75rem] border border-ink/10 bg-[#151217]">
            <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
              <p className="type-headline text-sm text-[#F5F5F5]/80">
                Video reels
              </p>
              <p className="type-body max-w-sm text-xs text-[#F5F5F5]/45">
                Nog geen reels voor {artist.name}. Voeg 9:16 video&apos;s toe in
                het CMS.
              </p>
              <Link
                to={`/cms/artists/${artist.slug}`}
                className="type-ui mt-1 rounded-full border border-[#D8FF3E]/40 bg-[#D8FF3E]/15 px-4 py-2 text-[0.65rem] text-[#D8FF3E]"
              >
                Reels beheren →
              </Link>
            </div>
          </div>
        </motion.div>
      </section>
    )
  }

  return (
    <section
      className="px-4 py-10 sm:px-6 sm:py-14 lg:px-8"
      aria-label={`${artist.name} reels`}
    >
      <motion.div
        className="mx-auto max-w-[520px]"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="type-label mb-4 text-center text-ink/40">Reels</p>

        <div className="relative mx-auto w-full max-w-[360px]">
          <div className="aspect-[9/16] max-h-[min(72vh,640px)] overflow-hidden rounded-[1.75rem] bg-[#090909] shadow-[0_0_60px_rgba(88,40,120,0.12)]">
            <div
              ref={scrollerRef}
              className="flex h-full w-full snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              style={{ WebkitOverflowScrolling: 'touch' }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              role="region"
              aria-roledescription="carousel"
              aria-label="Artist video reels"
            >
              {videos.map((video, i) => (
                <div
                  key={video.id}
                  className="h-full w-full min-w-full shrink-0 snap-center snap-always"
                  aria-hidden={i !== index}
                >
                  <ReelSlide
                    video={video}
                    fallbackPoster={artist.imageUrl}
                    active={i === index}
                    near={Math.abs(i - index) === 1}
                  />
                </div>
              ))}
            </div>
          </div>

          {count > 1 ? (
            <>
              <button
                type="button"
                aria-label="Previous reel"
                className="absolute top-1/2 left-0 z-10 hidden h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-ink/15 bg-[var(--body-bg)]/90 text-ink shadow-lg backdrop-blur-sm md:flex"
                onClick={() => goTo(index - 1)}
              >
                <Chevron dir="left" />
              </button>
              <button
                type="button"
                aria-label="Next reel"
                className="absolute top-1/2 right-0 z-10 hidden h-10 w-10 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-ink/15 bg-[var(--body-bg)]/90 text-ink shadow-lg backdrop-blur-sm md:flex"
                onClick={() => goTo(index + 1)}
              >
                <Chevron dir="right" />
              </button>
            </>
          ) : null}
        </div>

        {count > 1 ? (
          <div
            className="mt-5 flex items-center justify-center gap-2"
            role="tablist"
            aria-label="Reel pagination"
          >
            {videos.map((video, i) => (
              <button
                key={video.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Reel ${i + 1}`}
                className={[
                  'h-1.5 rounded-full transition-all duration-300',
                  i === index
                    ? 'w-6 bg-brand'
                    : 'w-1.5 bg-ink/25 hover:bg-ink/40',
                ].join(' ')}
                onClick={() => goTo(i)}
              />
            ))}
          </div>
        ) : null}
      </motion.div>
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
      strokeWidth="1.8"
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

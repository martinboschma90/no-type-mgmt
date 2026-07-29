import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, type PanInfo } from 'framer-motion'
import type { Artist, ArtistVideo } from '@/types/artist'
import { useResolvedMediaUrl } from '@/cms/media/useResolvedMediaUrl'

/** Editorial cinematic ease — slow settle, no bounce. */
const CINEMA_EASE = [0.22, 1, 0.36, 1] as const
const CINEMA_DURATION = 0.85
const DRAG_THRESHOLD = 64

type VisualSlideProps = {
  video: ArtistVideo
  fallbackPoster?: string
  active: boolean
  near: boolean
}

function VisualSlide({
  video,
  fallbackPoster,
  active,
  near,
}: VisualSlideProps) {
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
    <div className="relative h-full w-full overflow-hidden bg-[#0a090c]">
      {posterUrl ? (
        <img
          src={posterUrl}
          alt=""
          className={[
            'absolute inset-0 h-full w-full object-cover transition-opacity duration-700',
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

      {/* Soft vignette — editorial depth */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(0,0,0,0.45)_100%)]"
        aria-hidden
      />

      {video.title ? (
        <p className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent px-5 pt-14 pb-5 type-label text-[0.6rem] tracking-[0.18em] text-white/75 uppercase">
          {video.title}
        </p>
      ) : null}
    </div>
  )
}

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

type ArtistReelsCarouselProps = {
  artist: Artist
  videos: ArtistVideo[]
  showEmptyState?: boolean
  previewMode?: boolean
}

/** Cinematic 9:16 Visuals stack — editorial, not social-feed. */
export function ArtistReelsCarousel({
  artist,
  videos,
  showEmptyState = false,
}: ArtistReelsCarouselProps) {
  const [index, setIndex] = useState(0)
  const [hovered, setHovered] = useState(false)
  const count = videos.length

  const goTo = useCallback(
    (next: number) => {
      if (count === 0) return
      setIndex(Math.max(0, Math.min(count - 1, next)))
    },
    [count],
  )

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const { offset, velocity } = info
    const swipe =
      Math.abs(offset.x) > DRAG_THRESHOLD || Math.abs(velocity.x) > 420
    if (!swipe) return
    if (offset.x < 0 || velocity.x < -420) goTo(index + 1)
    else goTo(index - 1)
  }

  if (count === 0) {
    if (!showEmptyState) return null
    return (
      <section
        className="px-4 py-12 sm:px-6 sm:py-16 lg:px-8"
        aria-label={`${artist.name} visuals`}
      >
        <motion.div
          className="mx-auto max-w-[480px]"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7, ease: CINEMA_EASE }}
        >
          <p className="type-label mb-5 text-center text-[0.65rem] tracking-[0.22em] text-ink/40 uppercase">
            Visuals
          </p>
          <div className="mx-auto aspect-[9/16] max-h-[min(70vh,620px)] w-full max-w-[340px] overflow-hidden rounded-[1.5rem] border border-white/8 bg-[#121014]">
            <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
              <p className="type-headline text-sm text-[#F5F5F5]/75">
                Visuals
              </p>
              <p className="type-body max-w-sm text-xs text-[#F5F5F5]/40">
                Nog geen visuals voor {artist.name}. Voeg 9:16 video&apos;s toe
                in het CMS.
              </p>
              <Link
                to={`/cms/artists/${artist.slug}`}
                className="type-ui mt-1 rounded-full border border-[#D8FF3E]/35 bg-[#D8FF3E]/12 px-4 py-2 text-[0.65rem] text-[#D8FF3E] transition-opacity hover:opacity-80"
              >
                Visuals beheren →
              </Link>
            </div>
          </div>
        </motion.div>
      </section>
    )
  }

  return (
    <section
      className="px-4 py-12 sm:px-6 sm:py-16 lg:px-8"
      aria-label={`${artist.name} visuals`}
    >
      <motion.div
        className="mx-auto max-w-[640px]"
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.12 }}
        transition={{ duration: 0.8, ease: CINEMA_EASE }}
      >
        <div className="mb-6 flex items-end justify-between gap-4 px-1 sm:mb-8">
          <p className="type-label text-[0.65rem] tracking-[0.22em] text-ink/40 uppercase">
            Visuals
          </p>
          {count > 1 ? (
            <p
              className="type-label text-[0.7rem] tracking-[0.2em] text-ink/55 tabular-nums uppercase"
              aria-live="polite"
            >
              <span className="text-ink">{pad2(index + 1)}</span>
              <span className="text-ink/25"> / </span>
              <span className="text-ink/40">{pad2(count)}</span>
            </p>
          ) : null}
        </div>

        <div
          className="relative mx-auto w-full max-w-[420px] touch-pan-y"
          style={{ perspective: 1400 }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {/* Stage — room for peeking neighbors */}
          <div className="relative mx-auto aspect-[9/16] max-h-[min(72vh,680px)] w-[min(100%,340px)] sm:w-[min(100%,360px)]">
            {videos.map((video, i) => {
              const offset = i - index
              const abs = Math.abs(offset)
              if (abs > 2) return null

              const isActive = offset === 0
              const peekX = offset * (hovered ? 58 : 48)
              const depthScale = isActive
                ? hovered
                  ? 1.045
                  : 1.02
                : abs === 1
                  ? 0.86
                  : 0.78
              const depthOpacity = isActive ? 1 : abs === 1 ? 0.42 : 0.18
              const rotateY = offset * -6
              const yLift = isActive ? 0 : abs * 10

              return (
                <motion.div
                  key={video.id}
                  className={[
                    'absolute inset-0 origin-center overflow-hidden rounded-[1.5rem]',
                    isActive
                      ? 'cursor-grab active:cursor-grabbing'
                      : 'pointer-events-none',
                  ].join(' ')}
                  style={{
                    zIndex: 30 - abs,
                    boxShadow: isActive
                      ? '0 28px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06)'
                      : '0 16px 40px rgba(0,0,0,0.35)',
                  }}
                  initial={false}
                  animate={{
                    x: isActive ? 0 : peekX,
                    scale: depthScale,
                    opacity: depthOpacity,
                    rotateY,
                    y: yLift,
                    filter: isActive
                      ? 'brightness(1) saturate(1)'
                      : 'brightness(0.55) saturate(0.85)',
                  }}
                  transition={{
                    duration: CINEMA_DURATION,
                    ease: CINEMA_EASE,
                  }}
                  drag={isActive && count > 1 ? 'x' : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.22}
                  dragDirectionLock
                  onDragEnd={onDragEnd}
                  aria-hidden={!isActive}
                >
                  <VisualSlide
                    video={video}
                    fallbackPoster={artist.imageUrl}
                    active={isActive}
                    near={abs === 1}
                  />
                </motion.div>
              )
            })}
          </div>

          {count > 1 ? (
            <>
              <NavButton
                dir="prev"
                disabled={index === 0}
                onClick={() => goTo(index - 1)}
                visible={hovered}
              />
              <NavButton
                dir="next"
                disabled={index === count - 1}
                onClick={() => goTo(index + 1)}
                visible={hovered}
              />
            </>
          ) : null}
        </div>

        {count > 1 ? (
          <p className="type-label mt-6 text-center text-[0.55rem] tracking-[0.16em] text-ink/30 uppercase md:hidden">
            Swipe
          </p>
        ) : null}
      </motion.div>
    </section>
  )
}

function NavButton({
  dir,
  onClick,
  disabled,
  visible,
}: {
  dir: 'prev' | 'next'
  onClick: () => void
  disabled: boolean
  visible: boolean
}) {
  return (
    <motion.button
      type="button"
      aria-label={dir === 'prev' ? 'Previous visual' : 'Next visual'}
      disabled={disabled}
      onClick={onClick}
      className={[
        'absolute top-1/2 z-40 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-[#0c0b0d]/75 text-ink backdrop-blur-md transition-colors md:flex',
        dir === 'prev' ? 'left-0 -translate-x-1/2' : 'right-0 translate-x-1/2',
        disabled ? 'opacity-0' : '',
      ].join(' ')}
      initial={false}
      animate={{
        opacity: disabled ? 0 : visible ? 1 : 0.35,
        scale: visible && !disabled ? 1 : 0.94,
      }}
      whileHover={disabled ? undefined : { scale: 1.06, borderColor: 'rgba(216,255,62,0.35)' }}
      whileTap={disabled ? undefined : { scale: 0.96 }}
      transition={{ duration: 0.35, ease: CINEMA_EASE }}
    >
      <Chevron dir={dir === 'prev' ? 'left' : 'right'} />
    </motion.button>
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

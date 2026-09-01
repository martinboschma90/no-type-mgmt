import { useContext, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { Artist, ArtistVideo } from '@/types/artist'
import { MediaContext } from '@/cms/media/MediaContext'
import { parseMediaRef } from '@/cms/media/refs'
import { useResolvedMediaUrl } from '@/cms/media/useResolvedMediaUrl'
import { ErrorBoundary } from '@/components/ErrorBoundary'

const CINEMA_EASE = [0.22, 1, 0.36, 1] as const
const MAX_PLAYING = 6
const playingVideos = new Set<HTMLVideoElement>()

function pauseVideo(element: HTMLVideoElement) {
  playingVideos.delete(element)
  element.pause()
}

function releaseVideo(element: HTMLVideoElement) {
  pauseVideo(element)
}

function requestPlay(element: HTMLVideoElement) {
  if (playingVideos.size >= MAX_PLAYING && !playingVideos.has(element)) {
    const oldest = playingVideos.values().next().value
    if (oldest && oldest !== element) pauseVideo(oldest)
  }
  playingVideos.add(element)
  void element.play().catch(() => {
    playingVideos.delete(element)
  })
}

function VideoTile({
  video,
  allowSourceFallback,
}: {
  video: ArtistVideo
  allowSourceFallback: boolean
}) {
  const media = useContext(MediaContext)
  const [preferClip, setPreferClip] = useState(Boolean(video.clipUrl))
  const sourceRef =
    preferClip && video.clipUrl ? video.clipUrl : video.videoUrl
  const resolvedUrl = useResolvedMediaUrl(sourceRef)
  const articleRef = useRef<HTMLElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [active, setActive] = useState(false)
  const mediaId = parseMediaRef(sourceRef)
  const localUrl = media?.assets.find(
    (item) => item.id === mediaId || item.publicUrl === sourceRef,
  )?.url
  const videoUrl = localUrl || resolvedUrl
  const usingGeneratedClip = preferClip && Boolean(video.clipUrl)
  const clipStart = usingGeneratedClip ? 0 : Math.max(0, video.clipStart ?? 0)
  const clipDuration = Math.max(2, video.clipDuration ?? 6)

  useEffect(() => {
    setPreferClip(Boolean(video.clipUrl))
  }, [video.clipUrl])

  useEffect(() => {
    const node = articleRef.current
    if (!node || !videoUrl) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setActive(entry.isIntersecting)
        const element = videoRef.current
        if (!element) return
        if (!entry.isIntersecting) {
          pauseVideo(element)
        } else if (element.readyState >= HTMLMediaElement.HAVE_METADATA) {
          requestPlay(element)
        }
      },
      { rootMargin: '80px', threshold: 0.2 },
    )
    observer.observe(node)
    return () => {
      observer.disconnect()
      const element = videoRef.current
      if (element) releaseVideo(element)
    }
  }, [videoUrl])

  return (
    <article
      ref={articleRef}
      className="relative w-full overflow-hidden rounded-[1.35rem] bg-[#121014] shadow-2xl"
      style={{ aspectRatio: '9 / 16' }}
    >
      {active && videoUrl ? (
        <video
          key={videoUrl}
          ref={videoRef}
          src={videoUrl}
          className="absolute inset-0 h-full w-full object-cover object-center"
          muted
          playsInline
          loop
          preload="metadata"
          onLoadedMetadata={(event) => {
            const element = event.currentTarget
            element.currentTime = Math.min(
              clipStart,
              Math.max(0, element.duration - 0.1),
            )
            requestPlay(element)
          }}
          onTimeUpdate={(event) => {
            const element = event.currentTarget
            const clipEnd = Math.min(element.duration, clipStart + clipDuration)
            if (element.currentTime >= clipEnd) {
              element.currentTime = clipStart
              requestPlay(element)
            }
          }}
          onError={() => {
            const element = videoRef.current
            if (element) pauseVideo(element)
            if (preferClip && video.clipUrl && allowSourceFallback) {
              setPreferClip(false)
            } else if (element) {
              pauseVideo(element)
            }
          }}
        />
      ) : null}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10"
        aria-hidden
      />
      {video.title ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 p-3">
          <p className="type-label min-w-0 truncate text-[0.6rem] tracking-[0.14em] text-white/80 uppercase">
            {video.title}
          </p>
        </div>
      ) : null}
    </article>
  )
}

export function ArtistReelsCarousel({
  artist,
  videos,
  showEmptyState = false,
  previewMode = false,
}: {
  artist: Artist
  videos: ArtistVideo[]
  showEmptyState?: boolean
  previewMode?: boolean
}) {
  const sectionRef = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{
    pointerId: number
    startX: number
    scrollLeft: number
  } | null>(null)
  const [isInteracting, setIsInteracting] = useState(false)
  const canMarquee = videos.length > 3

  useEffect(() => {
    const track = trackRef.current
    if (!track || !canMarquee) return

    let frame = 0
    let previousTime = 0

    const tick = (time: number) => {
      const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth)
      if (!isInteracting && previousTime > 0 && maxScroll > 8) {
        const next = track.scrollLeft + Math.min(24, time - previousTime) * 0.04
        track.scrollLeft = next >= maxScroll ? 0 : next
      }
      previousTime = time
      frame = window.requestAnimationFrame(tick)
    }

    frame = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(frame)
  }, [canMarquee, isInteracting, videos.length])

  const scroll = (direction: -1 | 1) => {
    trackRef.current?.scrollBy({
      left: direction * trackRef.current.clientWidth * 0.82,
      behavior: 'smooth',
    })
  }

  if (videos.length === 0) {
    if (!showEmptyState) return null
    return (
      <section
        ref={sectionRef}
        id="artist-visuals"
        className="mx-auto max-w-[1400px] px-4 py-12 sm:px-6 lg:px-8"
      >
        <div className="rounded-[1.5rem] border border-white/8 bg-[#121014] px-6 py-14 text-center">
          <p className="type-headline text-lg text-[#F5F5F5]">Shows</p>
          <p className="type-body mt-2 text-xs text-[#F5F5F5]/45">
            Voeg maximaal acht video’s toe in het CMS.
          </p>
          <Link
            to={`/cms/artists/${artist.slug}?tab=content`}
            className="type-ui mt-4 inline-flex rounded-full border border-[#D8FF3E]/35 bg-[#D8FF3E]/10 px-4 py-2 text-[0.65rem] text-[#D8FF3E]"
          >
            Video’s beheren →
          </Link>
        </div>
      </section>
    )
  }

  return (
    <ErrorBoundary label="visuals" compact>
      <section
        ref={sectionRef}
        id="artist-visuals"
        className="mx-auto max-w-[1400px] px-4 py-14 sm:px-6 lg:px-8 lg:py-20"
      >
        <motion.div
          initial={previewMode ? false : { opacity: 0, y: 22 }}
          animate={previewMode ? { opacity: 1, y: 0 } : undefined}
          whileInView={previewMode ? undefined : { opacity: 1, y: 0 }}
          viewport={previewMode ? undefined : { once: true, amount: 0.12 }}
          transition={{ duration: 0.7, ease: CINEMA_EASE }}
        >
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="type-label text-[0.6rem] tracking-[0.18em] text-ink/40 uppercase">
                Artist
              </p>
              <h2 className="type-headline mt-1 text-2xl text-ink sm:text-3xl">
                Shows
              </h2>
            </div>
            {videos.length > 4 ? (
              <div className="flex gap-2">
                <SliderButton label="Previous videos" onClick={() => scroll(-1)}>
                  ←
                </SliderButton>
                <SliderButton label="Next videos" onClick={() => scroll(1)}>
                  →
                </SliderButton>
              </div>
            ) : null}
          </div>

          <div className="overflow-hidden rounded-[1.75rem] border border-white/8 bg-[#0d090b] py-10 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)] sm:py-14">
            <div
              ref={trackRef}
              className={
                videos.length === 1
                  ? 'flex justify-center overflow-x-auto px-3 py-3 sm:px-6 lg:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
                  : 'grid cursor-grab grid-flow-col auto-cols-[min(62vw,17.5rem)] grid-rows-1 items-start gap-3 overflow-x-auto overscroll-x-contain px-3 py-3 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)] [scrollbar-width:none] active:cursor-grabbing sm:auto-cols-[17.5rem] sm:px-6 lg:auto-cols-[17.5rem] lg:px-8 [&::-webkit-scrollbar]:hidden'
              }
              onMouseLeave={() => {
                dragRef.current = null
                setIsInteracting(false)
              }}
              onWheel={(event) => {
                event.preventDefault()
                event.currentTarget.scrollLeft += event.deltaX + event.deltaY
              }}
              onPointerDown={(event) => {
                dragRef.current = {
                  pointerId: event.pointerId,
                  startX: event.clientX,
                  scrollLeft: event.currentTarget.scrollLeft,
                }
                event.currentTarget.setPointerCapture(event.pointerId)
                setIsInteracting(true)
              }}
              onPointerMove={(event) => {
                const drag = dragRef.current
                if (!drag || drag.pointerId !== event.pointerId) return
                event.currentTarget.scrollLeft =
                  drag.scrollLeft - (event.clientX - drag.startX)
              }}
              onPointerUp={(event) => {
                if (dragRef.current?.pointerId === event.pointerId) {
                  dragRef.current = null
                  event.currentTarget.releasePointerCapture(event.pointerId)
                  setIsInteracting(false)
                }
              }}
            >
              {videos.map((video) => (
                <div
                  key={video.id}
                  className={
                    videos.length === 1
                      ? 'w-[min(72vw,17.5rem)] shrink-0'
                      : 'w-full min-w-0 shrink-0'
                  }
                >
                  <VideoTile
                    video={video}
                    allowSourceFallback={previewMode}
                  />
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>
    </ErrorBoundary>
  )
}

function SliderButton({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: string
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/15 text-sm text-ink transition-colors hover:border-ink/35"
    >
      {children}
    </button>
  )
}

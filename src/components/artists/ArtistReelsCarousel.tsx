import { useContext, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { Artist, ArtistVideo } from '@/types/artist'
import { MediaContext } from '@/cms/media/MediaContext'
import { parseMediaRef } from '@/cms/media/refs'
import { videoObjectPosition } from '@/cms/artistVideos'
import { useResolvedMediaUrl } from '@/cms/media/useResolvedMediaUrl'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import {
  pauseVideo,
  releaseVideo,
  requestPlay,
} from '@/components/artists/videoPlayback'

const CINEMA_EASE = [0.22, 1, 0.36, 1] as const

function bindMobilePlayback(element: HTMLVideoElement) {
  element.muted = true
  element.defaultMuted = true
  element.playsInline = true
  element.setAttribute('muted', '')
  element.setAttribute('playsinline', '')
  element.setAttribute('webkit-playsinline', '')
}

function tileIsOnScreen(node: HTMLElement) {
  const rect = node.getBoundingClientRect()
  return (
    rect.bottom > 40 &&
    rect.top < window.innerHeight - 40 &&
    rect.right > 20 &&
    rect.left < window.innerWidth - 20
  )
}

function VideoTile({
  video,
  allowSourceFallback,
  eager = false,
}: {
  video: ArtistVideo
  allowSourceFallback: boolean
  eager?: boolean
}) {
  const media = useContext(MediaContext)
  const [preferClip, setPreferClip] = useState(Boolean(video.clipUrl))
  const sourceRef =
    preferClip && video.clipUrl ? video.clipUrl : video.videoUrl
  const resolvedUrl = useResolvedMediaUrl(sourceRef)
  const articleRef = useRef<HTMLElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [shouldLoad, setShouldLoad] = useState(eager)
  const [active, setActive] = useState(eager)
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

    const sync = (visible: boolean) => {
      if (visible) setShouldLoad(true)
      setActive(visible)
    }

    if (eager || tileIsOnScreen(node)) sync(true)

    const observer = new IntersectionObserver(
      ([entry]) => {
        sync(entry.isIntersecting || entry.intersectionRatio > 0)
      },
      { root: null, rootMargin: '280px 80px', threshold: 0 },
    )
    observer.observe(node)

    const fallback = window.setTimeout(() => {
      if (tileIsOnScreen(node)) sync(true)
    }, 200)

    return () => {
      observer.disconnect()
      window.clearTimeout(fallback)
      const element = videoRef.current
      if (element) releaseVideo(element)
    }
  }, [eager, videoUrl])

  useEffect(() => {
    const element = videoRef.current
    if (!element) return
    bindMobilePlayback(element)
    if (!active) {
      pauseVideo(element)
    } else if (element.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      requestPlay(element)
    }
  }, [active, shouldLoad, videoUrl])

  return (
    <article
      ref={articleRef}
      className="relative w-full overflow-hidden rounded-[1.35rem] bg-[#121014] shadow-2xl"
      style={{ aspectRatio: '9 / 16' }}
    >
      {shouldLoad && videoUrl ? (
        <video
          key={videoUrl}
          ref={(element) => {
            videoRef.current = element
            if (element) bindMobilePlayback(element)
          }}
          src={videoUrl}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: videoObjectPosition(video) }}
          muted
          autoPlay
          playsInline
          loop
          preload="auto"
          onLoadedMetadata={(event) => {
            const element = event.currentTarget
            bindMobilePlayback(element)
            if (clipStart > 0.08 && Number.isFinite(element.duration)) {
              element.currentTime = Math.min(
                clipStart,
                Math.max(0, element.duration - 0.1),
              )
            }
            requestPlay(element)
          }}
          onLoadedData={(event) => requestPlay(event.currentTarget)}
          onCanPlay={(event) => requestPlay(event.currentTarget)}
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
            }
          }}
        />
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
          initial={previewMode ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.45, ease: CINEMA_EASE }}
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
                  ? 'flex justify-start overflow-x-auto px-3 py-3 sm:px-6 lg:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
                  : videos.length === 2
                    ? 'flex snap-x snap-mandatory justify-start gap-3 overflow-x-auto px-3 py-3 sm:px-6 lg:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
                  : 'grid cursor-grab grid-flow-col auto-cols-[min(62vw,17.5rem)] grid-rows-1 items-start gap-3 overflow-x-auto overscroll-x-contain px-3 py-3 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)] [scrollbar-width:none] active:cursor-grabbing sm:auto-cols-[17.5rem] sm:px-6 lg:auto-cols-[17.5rem] lg:px-8 [&::-webkit-scrollbar]:hidden'
              }
              onMouseLeave={() => {
                dragRef.current = null
                setIsInteracting(false)
              }}
              onWheel={(event) => {
                if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) {
                  event.currentTarget.scrollLeft += event.deltaX + event.deltaY
                }
              }}
              onPointerDown={(event) => {
                if (event.pointerType !== 'mouse') return
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
              {videos.map((video, index) => (
                <div
                  key={video.id}
                  className={
                    videos.length <= 2
                      ? 'w-[min(72vw,17.5rem)] shrink-0 snap-start'
                      : 'w-full min-w-0 shrink-0'
                  }
                >
                  <VideoTile
                    video={video}
                    allowSourceFallback
                    eager={index < 2}
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

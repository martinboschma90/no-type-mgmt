import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Play } from 'lucide-react'
import type { Artist, ArtistVideo } from '@/types/artist'
import { useResolvedMediaUrl } from '@/cms/media/useResolvedMediaUrl'

const CINEMA_EASE = [0.22, 1, 0.36, 1] as const

function VideoTile({
  video,
  playing,
  onPlay,
  onStop,
}: {
  video: ArtistVideo
  playing: boolean
  onPlay: () => void
  onStop: () => void
}) {
  const videoUrl = useResolvedMediaUrl(video.clipUrl || video.videoUrl)
  const videoRef = useRef<HTMLVideoElement>(null)
  const usingGeneratedClip = Boolean(video.clipUrl)
  const clipStart = usingGeneratedClip ? 0 : Math.max(0, video.clipStart ?? 0)
  const clipDuration = Math.max(2, video.clipDuration ?? 6)

  useEffect(() => {
    const element = videoRef.current
    if (!element) return
    if (playing) {
      const clipEnd = clipStart + clipDuration
      if (element.currentTime < clipStart || element.currentTime >= clipEnd) {
        element.currentTime = clipStart
      }
      void element.play().catch(() => undefined)
    } else {
      element.pause()
      element.currentTime = clipStart
    }
  }, [clipDuration, clipStart, playing, videoUrl])

  return (
    <article
      className={`group relative aspect-[3/4] overflow-hidden rounded-[1.5rem] bg-[#121014] shadow-2xl transition-[transform,opacity] duration-500 ease-out ${
        playing
          ? 'z-10 -translate-y-2 scale-[1.035] opacity-100'
          : 'z-0 translate-y-0 scale-100 opacity-90 hover:opacity-100'
      }`}
      onMouseEnter={onPlay}
      onMouseLeave={onStop}
      onFocus={onPlay}
      onBlur={onStop}
      onClick={() => (playing ? onStop() : onPlay())}
      tabIndex={0}
    >
      {videoUrl ? (
        <video
          ref={videoRef}
          src={videoUrl}
          className="absolute inset-0 h-full w-full object-cover"
          muted
          playsInline
          preload="auto"
          onLoadedMetadata={(event) => {
            event.currentTarget.currentTime = Math.min(
              clipStart,
              Math.max(0, event.currentTarget.duration - 0.1),
            )
          }}
          onTimeUpdate={(event) => {
            const element = event.currentTarget
            const clipEnd = Math.min(element.duration, clipStart + clipDuration)
            if (playing && element.currentTime >= clipEnd) {
              element.currentTime = clipStart
              void element.play().catch(() => undefined)
            }
          }}
          onEnded={(event) => {
            event.currentTarget.currentTime = clipStart
            if (playing) void event.currentTarget.play().catch(() => undefined)
          }}
        />
      ) : null}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/10"
        aria-hidden
      />
      <div
        className={`pointer-events-none absolute inset-0 flex items-center justify-center transition-all duration-300 ${
          playing ? 'scale-90 opacity-0' : 'scale-100 opacity-100'
        }`}
        aria-hidden
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-black/30 text-white backdrop-blur-md">
          <Play className="ml-0.5 h-4 w-4 fill-current" />
        </span>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4">
        <p className="type-label min-w-0 truncate text-[0.6rem] tracking-[0.14em] text-white/80 uppercase">
          {video.title || 'Visual'}
        </p>
      </div>
    </article>
  )
}

export function ArtistReelsCarousel({
  artist,
  videos,
  showEmptyState = false,
}: {
  artist: Artist
  videos: ArtistVideo[]
  showEmptyState?: boolean
  previewMode?: boolean
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{
    pointerId: number
    startX: number
    scrollLeft: number
  } | null>(null)
  const [playingInstance, setPlayingInstance] = useState<string | null>(
    () => (videos[0] ? `1-${videos[0].id}` : null),
  )
  const [isInteracting, setIsInteracting] = useState(false)
  const loopItems = [0, 1, 2].flatMap((copy) =>
    videos.map((video) => ({
      video,
      instanceId: `${copy}-${video.id}`,
    })),
  )

  useEffect(() => {
    const track = trackRef.current
    if (!track || videos.length === 0) return

    let frame = 0
    let previousTime = 0
    let initialized = false

    const updateCenteredVideo = () => {
      const center = track.getBoundingClientRect().left + track.clientWidth / 2
      let nearest: HTMLElement | null = null
      let nearestDistance = Number.POSITIVE_INFINITY
      for (const child of Array.from(track.children)) {
        if (!(child instanceof HTMLElement)) continue
        const rect = child.getBoundingClientRect()
        const distance = Math.abs(rect.left + rect.width / 2 - center)
        if (distance < nearestDistance) {
          nearest = child
          nearestDistance = distance
        }
      }
      const instanceId = nearest?.dataset.videoInstance
      if (instanceId) {
        setPlayingInstance((current) =>
          current === instanceId ? current : instanceId,
        )
      }
    }

    const tick = (time: number) => {
      const setWidth = track.scrollWidth / 3
      if (!initialized && setWidth > 0) {
        track.scrollLeft = setWidth
        initialized = true
      }

      if (initialized && !isInteracting && previousTime > 0) {
        track.scrollLeft += Math.min(32, time - previousTime) * 0.025
      }
      if (setWidth > 0 && track.scrollLeft >= setWidth * 2) {
        track.scrollLeft -= setWidth
      } else if (setWidth > 0 && track.scrollLeft <= 1) {
        track.scrollLeft += setWidth
      }

      updateCenteredVideo()
      previousTime = time
      frame = window.requestAnimationFrame(tick)
    }

    frame = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(frame)
  }, [isInteracting, videos])

  const scroll = (direction: -1 | 1) => {
    trackRef.current?.scrollBy({
      left: direction * trackRef.current.clientWidth * 0.82,
      behavior: 'smooth',
    })
  }

  if (videos.length === 0) {
    if (!showEmptyState) return null
    return (
      <section className="mx-auto max-w-[1400px] px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-[1.5rem] border border-white/8 bg-[#121014] px-6 py-14 text-center">
          <p className="type-headline text-lg text-[#F5F5F5]">Visuals</p>
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
    <section className="mx-auto max-w-[1400px] px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
      <motion.div
        initial={{ opacity: 0, y: 22 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.12 }}
        transition={{ duration: 0.7, ease: CINEMA_EASE }}
      >
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="type-label text-[0.6rem] tracking-[0.18em] text-ink/40 uppercase">
              Content
            </p>
            <h2 className="type-headline mt-1 text-2xl text-ink sm:text-3xl">
              Visuals
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
            className="grid cursor-grab snap-x snap-mandatory grid-flow-col auto-cols-[58%] gap-3 overflow-x-auto overscroll-x-contain px-4 py-3 [mask-image:linear-gradient(to_right,transparent,black_7%,black_93%,transparent)] [perspective:1200px] [scrollbar-width:none] active:cursor-grabbing sm:auto-cols-[34%] sm:px-6 lg:auto-cols-[23%] lg:px-8 [&::-webkit-scrollbar]:hidden"
            onMouseEnter={() => setIsInteracting(true)}
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
              }
            }}
          >
            {loopItems.map(({ video, instanceId }) => (
              <div
                key={instanceId}
                data-video-instance={instanceId}
                className="snap-center"
              >
                <VideoTile
                  video={video}
                  playing={playingInstance === instanceId}
                  onPlay={() => setPlayingInstance(instanceId)}
                  onStop={() => undefined}
                />
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
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

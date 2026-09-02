import { useEffect, useId, useRef, useState } from 'react'
import { BrandMark } from '@/components/ui/BrandMark'
import { useResolvedMediaUrl } from '@/cms/media/useResolvedMediaUrl'

/** Hero loop: start in the URL, then at most this many seconds. */
const YOUTUBE_CLIP_SECONDS = 20
const YT_PLAYING = 1

type YtPlayer = {
  mute: () => void
  playVideo: () => void
  seekTo: (seconds: number, allowSeekAhead: boolean) => void
  getCurrentTime: () => number
  destroy: () => void
}

type YtPlayerCtor = new (
  element: HTMLElement | string,
  options: {
    videoId: string
    width?: string
    height?: string
    playerVars?: Record<string, number | string>
    events?: {
      onReady?: (event: { target: YtPlayer }) => void
      onStateChange?: (event: { data: number; target: YtPlayer }) => void
    }
  },
) => YtPlayer

declare global {
  interface Window {
    YT?: { Player: YtPlayerCtor; PlayerState?: { ENDED: number; PLAYING: number } }
    onYouTubeIframeAPIReady?: () => void
  }
}

function youtubeIdFromUrl(url: string) {
  try {
    const parsed = new URL(url)
    if (parsed.hostname === 'youtu.be') {
      return parsed.pathname.replace(/^\//, '').split('/')[0] || null
    }
    if (parsed.hostname.includes('youtube.com')) {
      if (parsed.searchParams.get('v')) return parsed.searchParams.get('v')
      const parts = parsed.pathname.split('/').filter(Boolean)
      const embedIndex = parts.indexOf('embed')
      if (embedIndex >= 0) return parts[embedIndex + 1] || null
      const shortsIndex = parts.indexOf('shorts')
      if (shortsIndex >= 0) return parts[shortsIndex + 1] || null
    }
  } catch {
    return null
  }
  return null
}

function parseClockToSeconds(value: string) {
  if (/^\d+$/.test(value)) return Number(value)
  const clock = value.match(/^(\d+):(\d{1,2})(?::(\d{1,2}))?$/)
  if (clock) {
    if (clock[3] != null) {
      return Number(clock[1]) * 3600 + Number(clock[2]) * 60 + Number(clock[3])
    }
    return Number(clock[1]) * 60 + Number(clock[2])
  }
  const parts = value.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/i)
  if (!parts) return null
  const hours = Number(parts[1] ?? 0)
  const minutes = Number(parts[2] ?? 0)
  const seconds = Number(parts[3] ?? 0)
  if (!hours && !minutes && !seconds && !/h|m|s/i.test(value)) return null
  return hours * 3600 + minutes * 60 + seconds
}

function youtubeStartSeconds(url: string) {
  try {
    const parsed = new URL(url)
    const raw =
      parsed.searchParams.get('t') ??
      parsed.searchParams.get('start') ??
      parsed.hash.replace(/^#t=/, '')
    if (!raw) return null
    return parseClockToSeconds(raw)
  } catch {
    return null
  }
}

function isDirectVideo(url: string) {
  return /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(url) || url.startsWith('blob:')
}

function thinConnection() {
  const connection = (
    navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string }
    }
  ).connection
  if (connection?.saveData) return true
  const type = connection?.effectiveType
  return type === 'slow-2g' || type === '2g'
}

function isNarrowViewport() {
  return window.matchMedia('(max-width: 767px)').matches
}

function youtubeThumb(id: string, file: string, format: 'jpg' | 'webp' = 'jpg') {
  if (format === 'webp') {
    return `https://i.ytimg.com/vi_webp/${id}/${file}.webp`
  }
  return `https://i.ytimg.com/vi/${id}/${file}.jpg`
}

function loadYoutubeApi() {
  if (window.YT?.Player) return Promise.resolve()
  return new Promise<void>((resolve) => {
    const previous = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      previous?.()
      resolve()
    }
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const script = document.createElement('script')
      script.src = 'https://www.youtube.com/iframe_api'
      script.async = true
      document.head.appendChild(script)
    }
  })
}

function YoutubeClip({
  videoId,
  startAt,
  onPlaying,
  compact,
}: {
  videoId: string
  startAt: number
  onPlaying: () => void
  compact: boolean
}) {
  const hostId = useId().replace(/:/g, '')
  const playerRef = useRef<YtPlayer | null>(null)
  const onPlayingRef = useRef(onPlaying)
  onPlayingRef.current = onPlaying
  const endAt = startAt + YOUTUBE_CLIP_SECONDS

  useEffect(() => {
    let cancelled = false
    let poll: number | undefined

    void loadYoutubeApi().then(() => {
      if (cancelled || !window.YT?.Player) return
      if (!document.getElementById(hostId)) return

      const player = new window.YT.Player(hostId, {
        videoId,
        width: '100%',
        height: '100%',
        playerVars: {
          autoplay: 1,
          mute: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
          iv_load_policy: 3,
          cc_load_policy: 0,
          enablejsapi: 1,
          start: startAt,
          end: endAt,
          origin: window.location.origin,
        },
        events: {
          onReady: (event) => {
            event.target.mute()
            event.target.seekTo(startAt, true)
            event.target.playVideo()
          },
          onStateChange: (event) => {
            if (event.data === YT_PLAYING) onPlayingRef.current()
            if (event.data === (window.YT?.PlayerState?.ENDED ?? 0)) {
              event.target.seekTo(startAt, true)
              event.target.playVideo()
            }
          },
        },
      })
      playerRef.current = player
      poll = window.setInterval(() => {
        try {
          if (player.getCurrentTime() >= endAt - 0.2) {
            player.seekTo(startAt, true)
            player.playVideo()
          }
        } catch {
          /* player not ready */
        }
      }, 400)
    })

    return () => {
      cancelled = true
      if (poll) window.clearInterval(poll)
      playerRef.current?.destroy()
      playerRef.current = null
    }
  }, [endAt, hostId, startAt, videoId])

  const scale = compact
    ? 'h-full w-[120%] max-w-none'
    : 'h-[155%] w-[155%] max-w-none'
  return (
    <div
      className={`pointer-events-none absolute left-1/2 top-1/2 z-0 max-w-none -translate-x-1/2 -translate-y-1/2 ${scale} [&>iframe]:h-full [&>iframe]:w-full [&>iframe]:border-0`}
    >
      <div id={hostId} />
    </div>
  )
}

type AboutVideoBannerProps = {
  url?: string
  title?: string
}

export function AboutVideoBanner({ url, title }: AboutVideoBannerProps) {
  const source = useResolvedMediaUrl(url)
  const youtubeId = youtubeIdFromUrl(source)
  const start = youtubeStartSeconds(source) ?? 0
  const direct = Boolean(source && isDirectVideo(source))
  const [playing, setPlaying] = useState(false)
  const [allowHeavy, setAllowHeavy] = useState(false)
  const [compact, setCompact] = useState(true)

  useEffect(() => {
    setCompact(isNarrowViewport())
    setPlaying(false)
    setAllowHeavy(false)
    if (!youtubeId && !direct) return
    if (thinConnection()) return

    let idleId = 0
    let timeoutId = 0
    const kick = () => {
      const wait = isNarrowViewport() ? 900 : 250
      const startHeavy = () => setAllowHeavy(true)
      const ric = (
        window as Window & {
          requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number
        }
      ).requestIdleCallback
      if (ric) idleId = ric(startHeavy, { timeout: wait })
      else timeoutId = window.setTimeout(startHeavy, wait)
    }
    timeoutId = window.setTimeout(kick, isNarrowViewport() ? 80 : 0)
    return () => {
      window.clearTimeout(timeoutId)
      const cancel = (
        window as Window & { cancelIdleCallback?: (id: number) => void }
      ).cancelIdleCallback
      if (idleId && cancel) cancel(idleId)
    }
  }, [direct, source, youtubeId])

  return (
    <section
      className="relative w-full bg-[#121014] pt-[3.35rem] sm:pt-0"
      aria-label="About hero"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#121014] sm:aspect-[16/9] lg:aspect-[21/9]">
        {allowHeavy && youtubeId ? (
          <YoutubeClip
            videoId={youtubeId}
            startAt={start}
            compact={compact}
            onPlaying={() => setPlaying(true)}
          />
        ) : null}

        {allowHeavy && source && direct ? (
          <video
            className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover"
            src={source}
            autoPlay
            muted
            loop
            playsInline
            preload={compact ? 'metadata' : 'auto'}
            controls={false}
            disablePictureInPicture
            onPlaying={() => setPlaying(true)}
          />
        ) : null}

        <div
          className={[
            'pointer-events-none absolute inset-0 z-[1] bg-[#121014] transition-opacity duration-500',
            playing ? 'opacity-0' : 'opacity-100',
          ].join(' ')}
          aria-hidden
        >
          {youtubeId ? (
            <picture>
              <source
                type="image/webp"
                srcSet={`${youtubeThumb(youtubeId, 'mqdefault', 'webp')} 320w, ${youtubeThumb(youtubeId, 'hqdefault', 'webp')} 480w, ${youtubeThumb(youtubeId, 'sddefault', 'webp')} 640w`}
                sizes="100vw"
              />
              <img
                src={youtubeThumb(youtubeId, compact ? 'sddefault' : 'hqdefault')}
                srcSet={`${youtubeThumb(youtubeId, 'mqdefault')} 320w, ${youtubeThumb(youtubeId, 'hqdefault')} 480w, ${youtubeThumb(youtubeId, 'sddefault')} 640w`}
                sizes="100vw"
                alt=""
                width={640}
                height={360}
                decoding="async"
                fetchPriority="high"
                className="absolute inset-0 h-full w-full object-cover"
              />
            </picture>
          ) : null}
          <div className="absolute inset-0 bg-[#121014]/20" />
        </div>

        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-16 bg-gradient-to-t from-[var(--body-bg)] to-transparent"
          aria-hidden
        />
      </div>
      <h1 className="sr-only">{title || 'About NOTYPE'}</h1>
      <div className="pointer-events-none absolute bottom-3 right-3 z-10 sm:bottom-5 sm:right-5 lg:bottom-6 lg:right-8">
        <div className="opacity-[0.85]">
          <BrandMark
            duration={52}
            className="h-[72px] w-[72px] sm:h-[112px] sm:w-[112px] lg:h-[132px] lg:w-[132px]"
          />
        </div>
      </div>
    </section>
  )
}

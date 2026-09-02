import { useEffect, useId, useRef } from 'react'
import { BrandMark } from '@/components/ui/BrandMark'

/** Hero loop: start in the URL, then at most this many seconds. */
const YOUTUBE_CLIP_SECONDS = 20

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
    playerVars?: Record<string, number | string>
    events?: {
      onReady?: (event: { target: YtPlayer }) => void
      onStateChange?: (event: { data: number; target: YtPlayer }) => void
    }
  },
) => YtPlayer

declare global {
  interface Window {
    YT?: { Player: YtPlayerCtor; PlayerState?: { ENDED: number } }
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
  return /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(url)
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
      document.head.appendChild(script)
    }
  })
}

function YoutubeClip({ videoId, startAt }: { videoId: string; startAt: number }) {
  const hostId = useId().replace(/:/g, '')
  const playerRef = useRef<YtPlayer | null>(null)
  const endAt = startAt + YOUTUBE_CLIP_SECONDS

  useEffect(() => {
    let cancelled = false
    let poll: number | undefined

    void loadYoutubeApi().then(() => {
      if (cancelled || !window.YT?.Player) return
      const host = document.getElementById(hostId)
      if (!host) return

      const player = new window.YT.Player(hostId, {
        videoId,
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
      }, 200)
    })

    return () => {
      cancelled = true
      if (poll) window.clearInterval(poll)
      playerRef.current?.destroy()
      playerRef.current = null
    }
  }, [endAt, hostId, startAt, videoId])

  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2 h-[135%] w-[135%] max-w-none -translate-x-1/2 -translate-y-1/2 [&>iframe]:h-full [&>iframe]:w-full [&>iframe]:border-0">
      <div id={hostId} />
    </div>
  )
}

type AboutVideoBannerProps = {
  url?: string
  title?: string
}

export function AboutVideoBanner({ url, title }: AboutVideoBannerProps) {
  const source = url?.trim() ?? ''
  const youtubeId = youtubeIdFromUrl(source)
  const start = youtubeStartSeconds(source) ?? 0

  return (
    <section className="relative w-full bg-[#121014]" aria-label="About hero">
      <div className="relative aspect-[21/9] w-full overflow-hidden">
        {youtubeId ? (
          <YoutubeClip videoId={youtubeId} startAt={start} />
        ) : source && isDirectVideo(source) ? (
          <video
            className="pointer-events-none absolute inset-0 h-full w-full object-cover"
            src={source}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            controls={false}
            disablePictureInPicture
          />
        ) : source ? (
          <iframe
            title="About video"
            src={source}
            className="pointer-events-none absolute left-1/2 top-1/2 h-[135%] w-[135%] max-w-none -translate-x-1/2 -translate-y-1/2 border-0"
            allow="autoplay; encrypted-media"
            tabIndex={-1}
          />
        ) : null}
        <div className="absolute inset-0" aria-hidden />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[var(--body-bg)] to-transparent"
          aria-hidden
        />
      </div>
      <h1 className="sr-only">{title || 'About NOTYPE'}</h1>
      <div className="pointer-events-none absolute bottom-3 right-3 z-10 sm:bottom-5 sm:right-5 lg:bottom-6 lg:right-8">
        <div className="opacity-[0.85]">
          <BrandMark
            duration={52}
            className="h-[88px] w-[88px] sm:h-[112px] sm:w-[112px] lg:h-[132px] lg:w-[132px]"
          />
        </div>
      </div>
    </section>
  )
}

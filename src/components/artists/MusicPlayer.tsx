import { useEffect, useState, type ReactNode } from 'react'
import type { Artist } from '@/types/artist'
import {
  isMusicEmbedActive,
  resolveMusicEmbedSrc,
} from '@/cms/artistMusic'
import { portraitImageStyle } from '@/cms/imageFocus'
import { useArtistImageUrl } from '@/cms/media/useArtistImageUrl'
import { OptimizedImg } from '@/components/ui/OptimizedImg'

type MusicPlayerProps = {
  artist: Artist
}

/**
 * Artist music block:
 * - Prefer flexible platform embed (SoundCloud / Spotify / custom) when active
 * - Fall back to legacy visual track list
 */
export function MusicPlayer({ artist }: MusicPlayerProps) {
  const music = artist.music
  const tracks = artist.tracks ?? []

  if (isMusicEmbedActive(music) && music) {
    const src = resolveMusicEmbedSrc(music)
    if (!src) return null

    const isSpotify = music.platform === 'spotify'
    const isSoundCloud = music.platform === 'soundcloud'

    return (
      <div className="overflow-hidden rounded-[1.5rem] bg-[#151217] text-[#F5F5F5]">
        <div className="border-b border-white/10 px-4 py-3 sm:px-5">
          <p className="type-label text-[0.6rem] tracking-[0.14em] text-white/40 uppercase">
            {music.platform === 'soundcloud'
              ? 'SoundCloud'
              : music.platform === 'spotify'
                ? 'Spotify'
                : 'Music'}
          </p>
          <p className="type-headline mt-1 text-base text-[#F5F5F5]">
            {music.title || 'Listen'}
          </p>
        </div>
        <div
          className={
            isSpotify
              ? 'aspect-[4/5] min-h-[352px] w-full sm:aspect-auto sm:h-[352px]'
              : isSoundCloud
                ? 'h-[166px] w-full'
                : 'aspect-video w-full min-h-[200px]'
          }
        >
          <DeferredIframe
            title={music.title || `${artist.name} music`}
            src={src}
            className="h-full w-full border-0"
          />
        </div>
      </div>
    )
  }

  return <LegacyTrackList artist={artist} tracks={tracks} />
}

function LegacyTrackList({
  artist,
  tracks,
}: {
  artist: Artist
  tracks: NonNullable<Artist['tracks']>
}) {
  const [active, setActive] = useState(0)
  const [playing, setPlaying] = useState(false)
  const imageUrl = useArtistImageUrl(artist)
  const frame = portraitImageStyle(artist)

  if (!tracks.length) return null

  return (
    <div className="overflow-hidden rounded-[1.5rem] bg-[#151217] text-[#F5F5F5]">
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3 sm:px-5">
        {imageUrl ? (
          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg">
            <OptimizedImg
              src={imageUrl}
              alt=""
              className="absolute object-cover"
              style={frame}
              size="thumb"
              loading="lazy"
              fetchPriority="low"
              decoding="async"
            />
          </div>
        ) : (
          <div className="h-11 w-11 rounded-lg bg-white/10" />
        )}
        <div className="min-w-0 flex-1">
          <p className="type-headline truncate text-sm">{artist.name}</p>
          <p className="type-label mt-0.5 text-white/45">Top tracks</p>
        </div>
        <button
          type="button"
          className="type-ui rounded-full border border-white/30 px-3 py-1 text-[0.65rem] hover:bg-white/10"
        >
          Follow
        </button>
        <div className="ml-1 flex items-center gap-1">
          <ControlButton
            label="Previous"
            onClick={() => setActive((i) => Math.max(0, i - 1))}
          >
            <path d="M15 6 9 12l6 6M7 6v12" />
          </ControlButton>
          <ControlButton
            label={playing ? 'Pause' : 'Play'}
            onClick={() => setPlaying((p) => !p)}
          >
            {playing ? (
              <path d="M8 6h3v12H8V6Zm5 0h3v12h-3V6Z" fill="currentColor" stroke="none" />
            ) : (
              <path d="M9 7.5v9l8-4.5-8-4.5Z" fill="currentColor" stroke="none" />
            )}
          </ControlButton>
          <ControlButton
            label="Next"
            onClick={() => setActive((i) => Math.min(tracks.length - 1, i + 1))}
          >
            <path d="m9 6 6 6-6 6M17 6v12" />
          </ControlButton>
        </div>
      </div>

      <ul className="divide-y divide-white/8">
        {tracks.map((track, index) => {
          const isActive = index === active
          return (
            <li key={track.id}>
              <button
                type="button"
                onClick={() => {
                  setActive(index)
                  setPlaying(true)
                }}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5 sm:px-5 ${
                  isActive ? 'bg-white/8' : ''
                }`}
              >
                <span className="w-5 text-xs text-white/40">{index + 1}</span>
                <div className="min-w-0 flex-1">
                  <p
                    className={`truncate text-sm font-medium tracking-tight ${
                      isActive ? 'text-[#D8FF3E]' : ''
                    }`}
                  >
                    {track.title}
                  </p>
                  {track.credit ? (
                    <p className="truncate text-xs text-white/45">{track.credit}</p>
                  ) : null}
                </div>
                <span className="text-xs tabular-nums text-white/40">
                  {track.duration}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function DeferredIframe({
  title,
  src,
  className,
}: {
  title: string
  src: string
  className?: string
}) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), 400)
    return () => window.clearTimeout(timer)
  }, [])

  if (!ready) {
    return <div className={className} aria-hidden />
  }

  return (
    <iframe
      title={title}
      src={src}
      className={className}
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      loading="lazy"
      referrerPolicy="strict-origin-when-cross-origin"
    />
  )
}

function ControlButton({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-full text-white/80 hover:bg-white/10 hover:text-white"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        {children}
      </svg>
    </button>
  )
}

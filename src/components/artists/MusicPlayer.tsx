import { useState, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import type { Artist } from '@/types/artist'
import { portraitImageStyle } from '@/cms/imageFocus'
import { useResolvedMediaUrl } from '@/cms/media/useResolvedMediaUrl'

type MusicPlayerProps = {
  artist: Artist
}

/** Visual Spotify-style top tracks widget — UI only, no audio backend. */
export function MusicPlayer({ artist }: MusicPlayerProps) {
  const tracks = artist.tracks ?? []
  const [active, setActive] = useState(0)
  const [playing, setPlaying] = useState(false)
  const imageUrl = useResolvedMediaUrl(artist.imageUrl)
  const frame = portraitImageStyle(artist)

  if (!tracks.length) return null

  return (
    <motion.div
      className="overflow-hidden rounded-[1.5rem] bg-[#151217] text-[#F5F5F5] shadow-[0_0_40px_rgba(88,40,120,0.12)]"
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45 }}
    >
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3 sm:px-5">
        {imageUrl ? (
          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg">
            <img
              src={imageUrl}
              alt=""
              className="absolute object-cover"
              style={frame}
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
                  <p className={`truncate text-sm font-medium tracking-tight ${isActive ? 'text-[#D8FF3E]' : ''}`}>
                    {track.title}
                  </p>
                  {track.credit && (
                    <p className="truncate text-xs text-white/45">{track.credit}</p>
                  )}
                </div>
                <span className="text-xs tabular-nums text-white/40">{track.duration}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </motion.div>
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
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        {children}
      </svg>
    </button>
  )
}

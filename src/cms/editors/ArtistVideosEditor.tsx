import { useRef, useState } from 'react'
import {
  MAX_ARTIST_VIDEOS,
  createBlankArtistVideo,
  reorderArtistVideos,
  syncLegacyVideoUrl,
} from '@/cms/artistVideos'
import { ArtistVisibilityToggle } from '@/cms/editors/ArtistVisibilityToggle'
import { EditorSection, TextInput } from '@/cms/fields'
import { MediaUrlField } from '@/cms/media/MediaUrlField'
import { useResolvedMediaUrl } from '@/cms/media/useResolvedMediaUrl'
import { useMedia } from '@/cms/media/MediaProvider'
import { toMediaRef } from '@/cms/media/refs'
import type { ArtistVideo } from '@/types/artist'

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const rest = Math.floor(seconds % 60)
  return `${minutes}:${String(rest).padStart(2, '0')}`
}

function VideoMomentField({
  video,
  onChange,
}: {
  video: ArtistVideo
  onChange: (partial: Partial<ArtistVideo>) => void
}) {
  const resolvedUrl = useResolvedMediaUrl(video.videoUrl)
  const { createVideoClip } = useMedia()
  const previewRef = useRef<HTMLVideoElement>(null)
  const [sourceDuration, setSourceDuration] = useState(0)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const clipDuration = Math.max(2, video.clipDuration ?? 6)
  const maxStart = Math.max(0, sourceDuration - clipDuration)
  const clipStart = Math.min(Math.max(0, video.clipStart ?? 0), maxStart)

  if (!resolvedUrl) return null

  return (
    <div className="grid gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3 sm:grid-cols-[8rem_1fr]">
      <video
        ref={previewRef}
        src={resolvedUrl}
        muted
        playsInline
        preload="metadata"
        className="aspect-[3/4] w-24 rounded-lg bg-neutral-900 object-cover sm:w-32"
        onLoadedMetadata={(event) => {
          const duration = Number.isFinite(event.currentTarget.duration)
            ? event.currentTarget.duration
            : 0
          setSourceDuration(duration)
          event.currentTarget.currentTime = Math.min(clipStart, Math.max(0, duration - 0.1))
        }}
      />
      <div className="min-w-0 self-center">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold text-neutral-800">Getoond fragment</p>
          <span className="text-[10px] tabular-nums text-neutral-500">
            {formatTime(clipStart)}–{formatTime(Math.min(sourceDuration, clipStart + clipDuration))}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={maxStart}
          step={0.1}
          value={clipStart}
          disabled={sourceDuration <= clipDuration}
          onChange={(event) => {
            const next = Number(event.target.value)
            onChange({ clipStart: next, clipUrl: undefined })
            if (previewRef.current) previewRef.current.currentTime = next
          }}
          className="mt-3 h-1.5 w-full accent-neutral-700 disabled:opacity-40"
        />
        <div className="mt-3 flex items-center gap-1.5">
          <span className="mr-1 text-[10px] text-neutral-400">Lengte</span>
          {[4, 6, 8, 10].map((seconds) => (
            <button
              key={seconds}
              type="button"
              onClick={() => {
                const nextStart = Math.min(clipStart, Math.max(0, sourceDuration - seconds))
                onChange({
                  clipDuration: seconds,
                  clipStart: nextStart,
                  clipUrl: undefined,
                })
              }}
              className={[
                'rounded-md px-2 py-1 text-[10px] font-medium transition-colors',
                clipDuration === seconds
                  ? 'bg-neutral-900 text-white'
                  : 'border border-neutral-200 bg-white text-neutral-500 hover:text-neutral-900',
              ].join(' ')}
            >
              {seconds}s
            </button>
          ))}
        </div>
        <p className="mt-2 text-[10px] leading-relaxed text-neutral-400">
          Schuif naar het moment en maak daarna het korte websitefragment.
        </p>
        <button
          type="button"
          disabled={creating || sourceDuration === 0}
          onClick={async () => {
            setCreating(true)
            setError(null)
            try {
              const asset = await createVideoClip({
                sourceUrl: resolvedUrl,
                name: video.title || 'artist-video',
                startTime: clipStart,
                duration: clipDuration,
              })
              onChange({
                clipUrl: asset.publicUrl || toMediaRef(asset.id),
                clipStart,
                clipDuration,
              })
            } catch (reason) {
              setError(
                reason instanceof Error
                  ? reason.message
                  : 'Fragment maken mislukt.',
              )
            } finally {
              setCreating(false)
            }
          }}
          className="cms-primary-action mt-3 rounded-lg bg-neutral-900 px-3 py-2 text-[11px] font-semibold text-white disabled:opacity-40"
        >
          {creating
            ? 'Fragment maken…'
            : video.clipUrl
              ? 'Fragment opnieuw maken'
              : 'Websitefragment maken'}
        </button>
        {video.clipUrl ? (
          <span className="ml-2 text-[10px] font-medium text-emerald-600">
            Fragment klaar
          </span>
        ) : null}
        {error ? <p className="mt-2 text-[10px] text-red-500">{error}</p> : null}
      </div>
    </div>
  )
}

type ArtistVideosEditorProps = {
  videos: ArtistVideo[]
  onChange: (videos: ArtistVideo[]) => void
  sectionVisible?: boolean
  onSectionVisibleChange?: (visible: boolean) => void
}

/** CMS collection editor — add / remove / reorder / poster for reels. */
export function ArtistVideosEditor({
  videos,
  onChange,
  sectionVisible = true,
  onSectionVisibleChange,
}: ArtistVideosEditorProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)

  function patch(id: string, partial: Partial<ArtistVideo>) {
    onChange(videos.map((v) => (v.id === id ? { ...v, ...partial } : v)))
  }

  function remove(id: string) {
    onChange(videos.filter((v) => v.id !== id))
  }

  function add() {
    if (videos.length >= MAX_ARTIST_VIDEOS) return
    onChange([...videos, createBlankArtistVideo()])
  }

  return (
    <EditorSection
      title="Visuals"
      description="Voeg maximaal acht video’s toe. De filmstrip beweegt automatisch en speelt de middelste clip."
      defaultOpen
      badge={`${videos.length}/${MAX_ARTIST_VIDEOS}`}
    >
      {onSectionVisibleChange ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink/8 bg-ink/[0.03] px-3.5 py-3">
          <div>
            <p className="type-label text-[0.65rem] tracking-[0.14em] text-ink/45 uppercase">
              Content sectie
            </p>
            <p className="type-body mt-1 text-xs text-ink/45">
              {sectionVisible
                ? 'Zichtbaar op de artiestenpagina'
                : 'Verborgen — visuals blijven bewaard'}
            </p>
          </div>
          <ArtistVisibilityToggle
            visible={sectionVisible}
            onChange={onSectionVisibleChange}
          />
        </div>
      ) : null}
      <ul className="space-y-3">
        {videos.map((video, index) => {
          const isDragging = dragIndex === index
          const isOver = overIndex === index && dragIndex !== index

          return (
            <li
              key={video.id}
              draggable
              onDragStart={(e) => {
                setDragIndex(index)
                e.dataTransfer.effectAllowed = 'move'
                e.dataTransfer.setData('text/plain', String(index))
              }}
              onDragEnd={() => {
                setDragIndex(null)
                setOverIndex(null)
              }}
              onDragOver={(e) => {
                e.preventDefault()
                e.dataTransfer.dropEffect = 'move'
                if (overIndex !== index) setOverIndex(index)
              }}
              onDragLeave={() => {
                if (overIndex === index) setOverIndex(null)
              }}
              onDrop={(e) => {
                e.preventDefault()
                const from = Number(e.dataTransfer.getData('text/plain'))
                if (Number.isNaN(from)) return
                onChange(reorderArtistVideos(videos, from, index))
                setDragIndex(null)
                setOverIndex(null)
              }}
              className={[
                'space-y-3 rounded-2xl border p-3.5 transition-colors',
                isDragging
                  ? 'border-neutral-500 opacity-45'
                  : isOver
                    ? 'border-neutral-500 bg-neutral-100'
                    : 'border-ink/10 bg-ink/[0.03]',
              ].join(' ')}
            >
              <div className="flex items-center gap-3">
                <span
                  className="flex h-8 w-6 shrink-0 cursor-grab flex-col items-center justify-center gap-0.5 text-ink/30 active:cursor-grabbing"
                  aria-hidden
                >
                  <span className="block h-0.5 w-3.5 rounded-full bg-current" />
                  <span className="block h-0.5 w-3.5 rounded-full bg-current" />
                  <span className="block h-0.5 w-3.5 rounded-full bg-current" />
                </span>
                <p className="type-label flex-1 text-[0.65rem] tracking-[0.12em] text-ink/50 uppercase">
                  Video {index + 1}
                  <span className="ml-2 text-ink/30">9:16</span>
                </p>
                <button
                  type="button"
                  className="text-[11px] font-medium text-neutral-400 transition-colors hover:text-red-500"
                  onClick={() => remove(video.id)}
                >
                  Verwijderen
                </button>
              </div>

              <MediaUrlField
                label="Video"
                kind="video"
                value={video.videoUrl}
                onChange={(videoUrl) =>
                  patch(video.id, { videoUrl, clipUrl: undefined })
                }
                hint="Korte verticale clip, bij voorkeur 3:4 of 9:16. Speelt gedempt af bij hover."
              />
              {video.videoUrl ? (
                <VideoMomentField
                  video={video}
                  onChange={(partial) => patch(video.id, partial)}
                />
              ) : null}
              <TextInput
                label="Titel (optioneel)"
                value={video.title ?? ''}
                onChange={(title) => patch(video.id, { title })}
                placeholder="Bijvoorbeeld: Live cut · Studio B"
              />
            </li>
          )
        })}
      </ul>

      {videos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink/15 px-4 py-8 text-center">
          <p className="text-sm font-semibold text-neutral-700">Nog geen video’s</p>
          <p className="type-body mt-1.5 text-xs text-ink/40">
            Voeg video’s toe voor de slider op de artiestenpagina.
          </p>
        </div>
      ) : null}

      <button
        type="button"
        disabled={videos.length >= MAX_ARTIST_VIDEOS}
        className="cms-secondary-action w-full rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-35"
        onClick={add}
      >
        {videos.length >= MAX_ARTIST_VIDEOS
          ? `Maximaal ${MAX_ARTIST_VIDEOS} video’s`
          : '+ Video toevoegen'}
      </button>
    </EditorSection>
  )
}

/** Apply videos + keep legacy videoUrl in sync for older paths. */
export function withSyncedVideos(videos: ArtistVideo[]) {
  return {
    videos,
    videoUrl: syncLegacyVideoUrl(videos),
  }
}

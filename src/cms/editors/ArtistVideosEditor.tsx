import { useEffect, useRef, useState } from 'react'
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
import { parseMediaRef, toMediaRef } from '@/cms/media/refs'
import type { ArtistVideo } from '@/types/artist'

function formatTime(seconds: number) {
  const safe = Number.isFinite(seconds) ? Math.max(0, seconds) : 0
  const minutes = Math.floor(safe / 60)
  const rest = (safe % 60).toFixed(1).padStart(4, '0')
  return `${minutes}:${rest}`
}

function parseTimecode(value: string) {
  const parts = value.trim().split(':').map(Number)
  if (
    parts.length === 0 ||
    parts.length > 3 ||
    parts.some((part) => !Number.isFinite(part) || part < 0)
  ) {
    return null
  }
  return parts.reduce((total, part) => total * 60 + part, 0)
}

function formatMegabytes(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function videoPerformanceScore(bytes: number) {
  const megabytes = bytes / (1024 * 1024)
  if (megabytes <= 0.5) return 100
  return Math.max(
    1,
    Math.min(100, Math.round(100 - ((megabytes - 0.5) / 3.5) * 40)),
  )
}

function TimecodeInput({
  label,
  value,
  max,
  onCommit,
}: {
  label: string
  value: number
  max: number
  onCommit: (seconds: number) => void
}) {
  const [draft, setDraft] = useState(formatTime(value))

  useEffect(() => setDraft(formatTime(value)), [value])

  function commit() {
    const parsed = parseTimecode(draft)
    if (parsed === null) {
      setDraft(formatTime(value))
      return
    }
    const next = Math.min(Math.max(0, parsed), Math.max(0, max))
    onCommit(next)
    setDraft(formatTime(next))
  }

  return (
    <label className="min-w-0">
      <span className="mb-1 block text-[9px] font-medium tracking-[0.08em] text-neutral-500 uppercase">
        {label}
      </span>
      <input
        type="text"
        inputMode="decimal"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') event.currentTarget.blur()
        }}
        aria-label={`${label} tijdcode`}
        className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-xs tabular-nums text-white outline-none focus:border-neutral-400"
      />
    </label>
  )
}

function VideoMomentField({
  video,
  onChange,
}: {
  video: ArtistVideo
  onChange: (partial: Partial<ArtistVideo>) => void
}) {
  const resolvedUrl = useResolvedMediaUrl(video.videoUrl)
  const resolvedClipUrl = useResolvedMediaUrl(video.clipUrl)
  const { assets, createVideoClip } = useMedia()
  const previewRef = useRef<HTMLVideoElement>(null)
  const durationProbeRef = useRef(false)
  const mediaId = parseMediaRef(video.videoUrl)
  const sourceAsset = assets.find(
    (asset) =>
      asset.id === mediaId ||
      asset.url === resolvedUrl ||
      asset.publicUrl === video.videoUrl ||
      asset.publicUrl === resolvedUrl,
  )
  const sourceUrl = sourceAsset?.url || resolvedUrl
  const assetDuration =
    sourceAsset?.duration && Number.isFinite(sourceAsset.duration)
      ? sourceAsset.duration
      : 0
  const [sourceDuration, setSourceDuration] = useState(assetDuration)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [liveSize, setLiveSize] = useState<number | null>(null)
  const clipDuration = Math.max(2, video.clipDuration ?? 6)
  const maxStart = Math.max(0, sourceDuration - clipDuration)
  const clipStart = Math.min(Math.max(0, video.clipStart ?? 0), maxStart)

  useEffect(() => {
    if (assetDuration > 0) setSourceDuration(assetDuration)
  }, [assetDuration])

  useEffect(() => {
    if (!video.clipUrl) {
      setLiveSize(null)
      return
    }
    setLiveSize(null)

    const clipMediaId = parseMediaRef(video.clipUrl)
    const clipAsset = assets.find(
      (asset) =>
        asset.id === clipMediaId ||
        asset.url === resolvedClipUrl ||
        asset.publicUrl === video.clipUrl ||
        asset.publicUrl === resolvedClipUrl,
    )
    if (clipAsset?.size) {
      setLiveSize(clipAsset.size)
      return
    }

    if (!/^https?:\/\//i.test(resolvedClipUrl)) return
    let cancelled = false
    void fetch(resolvedClipUrl, { method: 'HEAD' })
      .then((response) => {
        const size = Number(response.headers.get('content-length') || 0)
        if (!cancelled && response.ok && size > 0) setLiveSize(size)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [assets, resolvedClipUrl, video.clipUrl])

  function readDuration(element: HTMLVideoElement) {
    const mediaDuration =
      Number.isFinite(element.duration) && element.duration > 0
        ? element.duration
        : 0
    const seekableDuration =
      element.seekable.length > 0
        ? element.seekable.end(element.seekable.length - 1)
        : 0
    const duration = Math.max(mediaDuration, seekableDuration, assetDuration)

    if (duration > 0) {
      durationProbeRef.current = false
      setSourceDuration(duration)
      element.currentTime = Math.min(
        clipStart,
        Math.max(0, duration - 0.1),
      )
      return
    }

    // MediaRecorder WebM files can omit duration metadata. Seeking far ahead
    // makes Chromium calculate the actual duration and emit durationchange.
    if (!durationProbeRef.current) {
      durationProbeRef.current = true
      try {
        element.currentTime = Number.MAX_SAFE_INTEGER
      } catch {
        durationProbeRef.current = false
      }
    }
  }

  if (!sourceUrl) return null

  return (
    <div className="grid gap-4 rounded-xl border border-neutral-200 bg-neutral-50 p-3 sm:grid-cols-[12rem_minmax(0,1fr)]">
      <video
        ref={previewRef}
        src={sourceUrl}
        controls
        draggable={false}
        muted
        playsInline
        preload="metadata"
        className="mx-auto aspect-[9/16] w-full max-w-48 rounded-lg bg-neutral-900 object-cover"
        onPointerDown={(event) => event.stopPropagation()}
        onDragStart={(event) => {
          event.preventDefault()
          event.stopPropagation()
        }}
        onLoadedMetadata={(event) => readDuration(event.currentTarget)}
        onLoadedData={(event) => readDuration(event.currentTarget)}
        onDurationChange={(event) => readDuration(event.currentTarget)}
        onSeeked={(event) => {
          if (durationProbeRef.current || sourceDuration <= 0) return
          const nextStart = Math.min(
            Math.max(0, event.currentTarget.currentTime),
            maxStart,
          )
          if (Math.abs(nextStart - clipStart) < 0.05) return
          onChange({ clipStart: nextStart, clipUrl: undefined })
        }}
      />
      <div className="min-w-0 self-center">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold text-neutral-800">Getoond fragment</p>
          <span className="text-[10px] tabular-nums text-neutral-500">
            {formatTime(clipStart)}–{formatTime(Math.min(sourceDuration, clipStart + clipDuration))}
          </span>
        </div>
        <p className="mt-1 text-[10px] tabular-nums text-neutral-500">
          Totale videoduur: {sourceDuration > 0 ? formatTime(sourceDuration) : 'laden…'}
        </p>
        <input
          type="range"
          min={0}
          max={maxStart}
          step={0.1}
          value={clipStart}
          draggable={false}
          disabled={sourceDuration <= clipDuration}
          onPointerDown={(event) => event.stopPropagation()}
          onMouseDown={(event) => event.stopPropagation()}
          onTouchStart={(event) => event.stopPropagation()}
          onDragStart={(event) => {
            event.preventDefault()
            event.stopPropagation()
          }}
          onChange={(event) => {
            const next = Number(event.target.value)
            onChange({ clipStart: next, clipUrl: undefined })
            if (previewRef.current) previewRef.current.currentTime = next
          }}
          className="mt-3 h-1.5 w-full accent-neutral-700 disabled:opacity-40"
        />
        <div className="mt-3 grid grid-cols-2 gap-2">
          <TimecodeInput
            label="Van"
            value={clipStart}
            max={maxStart}
            onCommit={(nextStart) => {
              onChange({ clipStart: nextStart, clipUrl: undefined })
              if (previewRef.current) previewRef.current.currentTime = nextStart
            }}
          />
          <TimecodeInput
            label="Tot"
            value={Math.min(sourceDuration, clipStart + clipDuration)}
            max={sourceDuration}
            onCommit={(nextEnd) => {
              const nextDuration = Math.min(
                10,
                Math.max(2, nextEnd - clipStart),
              )
              onChange({ clipDuration: nextDuration, clipUrl: undefined })
            }}
          />
        </div>
        <div className="mt-3 flex items-center gap-1.5">
          <span className="mr-1 text-[10px] text-neutral-400">
            Fragmentduur
          </span>
          {[6, 8, 10].map((seconds) => (
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
          Spoel in de video of gebruik de tijdlijn. Het gekozen moment wordt de
          start van je websitefragment.
        </p>
        <button
          type="button"
          disabled={creating || sourceDuration === 0}
          onClick={async () => {
            setCreating(true)
            setError(null)
            try {
              const asset = await createVideoClip({
                sourceUrl,
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
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-medium text-emerald-600">
              Live fragment klaar
            </span>
            {liveSize ? (
              <>
                <span className="rounded-full bg-neutral-200 px-2 py-1 text-[10px] font-semibold tabular-nums text-neutral-700">
                  Live: {formatMegabytes(liveSize)}
                </span>
                <span
                  className={[
                    'rounded-full px-2 py-1 text-[10px] font-semibold tabular-nums',
                    videoPerformanceScore(liveSize) >= 85
                      ? 'bg-emerald-100 text-emerald-700'
                      : videoPerformanceScore(liveSize) >= 70
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-red-100 text-red-700',
                  ].join(' ')}
                  title="Geschatte videoscore op basis van de live bestandsgrootte"
                >
                  Videoscore: {videoPerformanceScore(liveSize)}/100
                </span>
              </>
            ) : (
              <span className="text-[10px] text-neutral-400">
                Live grootte meten…
              </span>
            )}
          </div>
        ) : (
          <span className="ml-2 text-[10px] font-medium text-amber-600">
            Maak eerst een fragment voor de website
          </span>
        )}
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
      title="Shows"
      description="Elke upload is één slide. Voeg per video een nieuwe slide toe (maximaal acht)."
      defaultOpen
      badge={`${videos.length}/${MAX_ARTIST_VIDEOS}`}
    >
      {onSectionVisibleChange ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink/8 bg-ink/[0.03] px-3.5 py-3">
          <div>
            <p className="type-label text-[0.65rem] tracking-[0.14em] text-ink/45 uppercase">
              Shows sectie
            </p>
            <p className="type-body mt-1 text-xs text-ink/45">
              {sectionVisible
                ? 'Zichtbaar op de artiestenpagina'
                : 'Verborgen — shows blijven bewaard'}
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
              onDragOver={(e) => {
                if (dragIndex === null) return
                e.preventDefault()
                e.dataTransfer.dropEffect = 'move'
                if (overIndex !== index) setOverIndex(index)
              }}
              onDragLeave={() => {
                if (overIndex === index) setOverIndex(null)
              }}
              onDrop={(e) => {
                if (dragIndex === null) return
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
                  draggable
                  role="button"
                  tabIndex={0}
                  aria-label={`Video ${index + 1} verslepen`}
                  onDragStart={(event) => {
                    setDragIndex(index)
                    event.dataTransfer.effectAllowed = 'move'
                    event.dataTransfer.setData('text/plain', String(index))
                  }}
                  onDragEnd={() => {
                    setDragIndex(null)
                    setOverIndex(null)
                  }}
                  className="flex h-8 w-6 shrink-0 cursor-grab flex-col items-center justify-center gap-0.5 text-ink/30 active:cursor-grabbing"
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
                onChange={(videoUrl) => {
                  const completingOnlineSync =
                    Boolean(parseMediaRef(video.videoUrl)) &&
                    /^https?:\/\//i.test(videoUrl)
                  patch(
                    video.id,
                    completingOnlineSync
                      ? { videoUrl }
                      : { videoUrl, clipUrl: undefined },
                  )
                }}
                hint="Reels-formaat 9:16. Alle clips spelen gedempt automatisch af."
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
  const seen = new Set<string>()
  const unique = videos.filter((video) => {
    const key = video.videoUrl.trim()
    if (!key) return true
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
  return {
    videos: unique,
    videoUrl: syncLegacyVideoUrl(unique),
  }
}

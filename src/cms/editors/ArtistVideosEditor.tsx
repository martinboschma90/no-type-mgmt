import { useState } from 'react'
import {
  MAX_ARTIST_VIDEOS,
  createBlankArtistVideo,
  reorderArtistVideos,
  syncLegacyVideoUrl,
} from '@/cms/artistVideos'
import { EditorSection, TextInput } from '@/cms/fields'
import { MediaUrlField } from '@/cms/media/MediaUrlField'
import type { ArtistVideo } from '@/types/artist'

type ArtistVideosEditorProps = {
  videos: ArtistVideo[]
  onChange: (videos: ArtistVideo[]) => void
}

/** CMS collection editor — add / remove / reorder / poster for reels. */
export function ArtistVideosEditor({
  videos,
  onChange,
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
      description="Vertical 9:16 clips (1080×1920). 3–5 recommended. Cinematic carousel on the public page."
      defaultOpen
      badge={`${videos.length}/${MAX_ARTIST_VIDEOS}`}
    >
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
                  ? 'border-brand/50 opacity-45'
                  : isOver
                    ? 'border-brand bg-brand/10'
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
                  Visual {index + 1}
                  <span className="ml-2 text-ink/30">9:16</span>
                </p>
                <button
                  type="button"
                  className="type-label text-[0.55rem] tracking-[0.12em] text-ink/35 uppercase transition-colors hover:text-ink"
                  onClick={() => remove(video.id)}
                >
                  Remove
                </button>
              </div>

              <MediaUrlField
                label="Video"
                kind="video"
                value={video.videoUrl}
                onChange={(videoUrl) => patch(video.id, { videoUrl })}
                hint="Portrait 9:16 (1080×1920). Autoplays muted when active."
              />
              <MediaUrlField
                label="Poster / thumbnail"
                kind="image"
                value={video.posterUrl ?? ''}
                onChange={(posterUrl) => patch(video.id, { posterUrl })}
                hint="Shown before playback. Falls back to artist portrait."
              />
              <TextInput
                label="Title (optional)"
                value={video.title ?? ''}
                onChange={(title) => patch(video.id, { title })}
                placeholder="e.g. Live cut · Studio B"
              />
            </li>
          )
        })}
      </ul>

      {videos.length === 0 ? (
        <p className="type-body text-sm text-ink/40">
          No visuals yet — add vertical clips for the carousel.
        </p>
      ) : null}

      <button
        type="button"
        disabled={videos.length >= MAX_ARTIST_VIDEOS}
        className="type-label w-full rounded-full border border-ink/15 px-4 py-2.5 text-[0.65rem] tracking-[0.12em] text-ink/70 uppercase transition-colors hover:border-ink/30 hover:text-ink disabled:opacity-35"
        onClick={add}
      >
        {videos.length >= MAX_ARTIST_VIDEOS
          ? `Maximum ${MAX_ARTIST_VIDEOS} videos`
          : '+ Add video'}
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

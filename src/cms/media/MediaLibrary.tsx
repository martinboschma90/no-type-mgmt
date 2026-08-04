import { useCallback, useRef, useState } from 'react'
import { useMedia } from '@/cms/media/MediaProvider'
import type { MediaAsset } from '@/cms/media/types'
import { EditorSection } from '@/cms/fields'

function formatBytes(size: number) {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function formatDuration(seconds?: number) {
  if (!seconds || !Number.isFinite(seconds)) return null
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

type MediaLibraryProps = {
  /** When set, clicking an asset selects it instead of only managing */
  onSelect?: (asset: MediaAsset) => void
  selectKind?: 'image' | 'video' | 'any'
}

export function MediaLibrary({ onSelect, selectKind = 'any' }: MediaLibraryProps) {
  const { assets, ready, uploading, uploadFiles, removeAsset, clearAll } = useMedia()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFiles = useCallback(
    async (files: FileList | File[] | null) => {
      if (!files || files.length === 0) return
      setError(null)
      try {
        await uploadFiles(files)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed')
      }
    },
    [uploadFiles],
  )

  const visible = assets.filter((a) => {
    if (selectKind === 'any') return true
    return a.kind === selectKind
  })

  return (
    <div className="space-y-7">
      <EditorSection
        title="Upload"
        description="Photos/videos sync to Supabase Storage when you are logged in. Use “Sync missing media to Storage” above to migrate old media:// refs."
      >
        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              inputRef.current?.click()
            }
          }}
          onClick={() => inputRef.current?.click()}
          onDragEnter={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={(e) => {
            e.preventDefault()
            setDragOver(false)
          }}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            void handleFiles(e.dataTransfer.files)
          }}
          className={[
            'flex min-h-[160px] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed px-6 py-10 text-center transition-colors',
            dragOver
              ? 'border-accent bg-accent/10'
              : 'border-ink/20 bg-cream-dark/20 hover:border-ink/35 hover:bg-cream-dark/35',
          ].join(' ')}
        >
          <p className="type-label text-[0.7rem] tracking-[0.16em] text-ink uppercase">
            Drop media here
          </p>
          <p className="type-body max-w-sm text-xs text-ink/45">
            JPG, PNG, GIF, WebP, MP4, MOV, WebM — images become WebP; videos become WebM when
            supported, otherwise the original file is kept for playback.
          </p>
          <span className="type-ui mt-2 rounded-full border border-ink/20 px-4 py-2 text-[0.65rem] text-ink/70">
            Browse files
          </span>
          <input
            ref={inputRef}
            type="file"
            accept="image/*,video/*,.webp,.webm"
            multiple
            className="sr-only"
            onChange={(e) => {
              void handleFiles(e.target.files)
              e.target.value = ''
            }}
          />
        </div>

        {uploading ? (
          <p className="type-body text-xs text-ink/60">
            <span className="text-brand">{uploading.stage}</span>
            {' · '}
            {uploading.fileName}
            {uploading.message ? ` — ${uploading.message}` : null}
          </p>
        ) : null}
        {error ? <p className="type-body text-xs text-red-500">{error}</p> : null}
      </EditorSection>

      <EditorSection
        title="Library"
        description={
          ready
            ? `${visible.length} asset${visible.length === 1 ? '' : 's'} · converted formats only`
            : 'Loading…'
        }
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="type-label text-[0.65rem] text-ink/40 uppercase">
            {onSelect ? 'Click to use in field' : 'Manage uploaded media'}
          </p>
          {assets.length > 0 ? (
            <button
              type="button"
              className="type-label text-[0.65rem] tracking-[0.12em] text-ink/40 uppercase transition-colors hover:text-ink"
              onClick={() => {
                if (window.confirm('Delete all media from this browser?')) {
                  void clearAll()
                }
              }}
            >
              Clear all
            </button>
          ) : null}
        </div>

        {visible.length === 0 ? (
          <p className="type-body text-sm text-ink/40">No media yet — upload above.</p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {visible.map((asset) => (
              <li key={asset.id}>
                <article className="overflow-hidden rounded-xl border border-ink/10 bg-cream-dark/30">
                  <button
                    type="button"
                    className="group relative block aspect-square w-full overflow-hidden bg-ink/5 text-left"
                    onClick={() => onSelect?.(asset)}
                    disabled={!onSelect}
                  >
                    {asset.kind === 'image' ? (
                      <img
                        src={asset.url}
                        alt={asset.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <video
                        src={asset.url}
                        muted
                        playsInline
                        className="h-full w-full object-cover"
                        onMouseEnter={(e) => {
                          void e.currentTarget.play().catch(() => undefined)
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.pause()
                          e.currentTarget.currentTime = 0
                        }}
                      />
                    )}
                    <span className="absolute top-2 left-2 rounded-full bg-[#090909]/80 px-2 py-0.5 type-label text-[0.55rem] tracking-[0.12em] text-brand uppercase">
                      {asset.kind === 'image'
                        ? 'WebP'
                        : asset.mimeType.includes('webm')
                          ? 'WebM'
                          : 'Video'}
                    </span>
                  </button>
                  <div className="space-y-1.5 p-2.5">
                    <p className="truncate text-xs font-medium text-ink">{asset.name}</p>
                    <p className="type-body text-[0.65rem] text-ink/40">
                      {formatBytes(asset.size)}
                      {asset.width && asset.height
                        ? ` · ${asset.width}×${asset.height}`
                        : null}
                      {asset.kind === 'video' && formatDuration(asset.duration)
                        ? ` · ${formatDuration(asset.duration)}`
                        : null}
                    </p>
                    <div className="flex items-center gap-2 pt-0.5">
                      <button
                        type="button"
                        className="type-label text-[0.6rem] tracking-[0.12em] text-ink/50 uppercase transition-colors hover:text-ink"
                        onClick={() => {
                          void navigator.clipboard.writeText(`media://${asset.id}`)
                        }}
                      >
                        Copy ref
                      </button>
                      <button
                        type="button"
                        className="type-label text-[0.6rem] tracking-[0.12em] text-ink/35 uppercase transition-colors hover:text-ink"
                        onClick={() => {
                          if (window.confirm(`Delete ${asset.name}?`)) {
                            void removeAsset(asset.id)
                          }
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}
      </EditorSection>
    </div>
  )
}

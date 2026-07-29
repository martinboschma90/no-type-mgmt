import { useRef, useState } from 'react'
import { Field } from '@/cms/fields'
import { useMedia } from '@/cms/media/MediaProvider'
import { MediaLibrary } from '@/cms/media/MediaLibrary'
import { isImageFile, isVideoFile } from '@/cms/media/convert'
import { parseMediaRef, toMediaRef } from '@/cms/media/refs'
import { useResolvedMediaUrl } from '@/cms/media/useResolvedMediaUrl'

type MediaUrlFieldProps = {
  label: string
  value: string
  onChange: (url: string) => void
  kind?: 'image' | 'video' | 'any'
  hint?: string
}

/** URL field with upload (→ WebP/WebM) and library picker. */
export function MediaUrlField({
  label,
  value,
  onChange,
  kind = 'image',
  hint,
}: MediaUrlFieldProps) {
  const { uploadFiles, assets } = useMedia()
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const previewUrl = useResolvedMediaUrl(value)

  const accept =
    kind === 'image' ? 'image/*' : kind === 'video' ? 'video/*' : 'image/*,video/*'

  const mediaId = parseMediaRef(value)
  const matched = mediaId ? assets.find((a) => a.id === mediaId) : undefined

  return (
    <Field
      label={label}
      hint={
        hint ??
        (kind === 'video'
          ? 'Upload stores the video for preview playback. WebM conversion is used when the browser supports it.'
          : 'Upload converts to WebP. Stored in the media library.')
      }
    >
      <div className="space-y-2">
        {matched ? (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-ink/12 bg-cream-dark/40 px-3 py-2.5">
            <div className="min-w-0">
              <p className="truncate text-sm text-ink">{matched.name}</p>
              <p className="type-label mt-0.5 text-[0.55rem] text-ink/40 uppercase">
                Library ·{' '}
                {matched.mimeType === 'image/webp'
                  ? 'WebP'
                  : matched.mimeType.includes('webm')
                    ? 'WebM'
                    : 'Video'}
              </p>
            </div>
            <button
              type="button"
              className="type-label shrink-0 text-[0.6rem] tracking-[0.12em] text-ink/45 uppercase hover:text-ink"
              onClick={() => onChange('')}
            >
              Clear
            </button>
          </div>
        ) : (
          <input
            type="text"
            className="w-full rounded-lg border border-ink/12 bg-cream-dark/40 px-3 py-2.5 type-body text-sm text-ink outline-none transition-colors placeholder:text-ink/30 focus:border-brand/60 focus:bg-cream-dark/70"
            value={value}
            placeholder="https://… or upload"
            onChange={(e) => onChange(e.target.value)}
          />
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
            className="type-label rounded-full border border-ink/15 px-3 py-1.5 text-[0.6rem] tracking-[0.12em] text-ink/70 uppercase transition-colors hover:border-ink/30 hover:text-ink disabled:opacity-40"
          >
            {busy ? 'Converting…' : 'Upload'}
          </button>
          <button
            type="button"
            onClick={() => setPickerOpen((o) => !o)}
            className="type-label rounded-full border border-ink/15 px-3 py-1.5 text-[0.6rem] tracking-[0.12em] text-ink/70 uppercase transition-colors hover:border-ink/30 hover:text-ink"
          >
            {pickerOpen ? 'Close library' : 'Library'}
          </button>
          {matched ? (
            <span className="type-label self-center text-[0.55rem] tracking-[0.12em] text-brand uppercase">
              {matched.mimeType === 'image/webp'
                ? 'WebP'
                : matched.mimeType.includes('webm')
                  ? 'WebM'
                  : 'Video'}
            </span>
          ) : null}
        </div>

        {error ? <p className="text-xs text-red-500">{error}</p> : null}

        {previewUrl && kind !== 'video' ? (
          <div className="overflow-hidden rounded-lg border border-ink/8 bg-ink/5">
            <img src={previewUrl} alt="" className="h-28 w-full object-cover" />
          </div>
        ) : null}
        {previewUrl && kind === 'video' ? (
          <video
            key={previewUrl}
            src={previewUrl}
            controls
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            className="h-36 w-full rounded-lg bg-ink/10 object-cover"
          />
        ) : null}

        <input
          ref={fileRef}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={async (e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            if (!file) return

            if (kind === 'image' && !isImageFile(file)) {
              setError('Expected an image file')
              return
            }
            if (kind === 'video' && !isVideoFile(file)) {
              setError('Expected a video file')
              return
            }

            setBusy(true)
            setError(null)
            try {
              const created = await uploadFiles([file])
              const asset = created[0]
              if (asset) {
                // Prefer public Storage URL so artist pages work outside this browser
                onChange(asset.publicUrl || toMediaRef(asset.id))
              }
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Upload failed')
            } finally {
              setBusy(false)
            }
          }}
        />

        {pickerOpen ? (
          <div className="max-h-[28rem] overflow-y-auto rounded-xl border border-ink/10 bg-[var(--body-bg)] p-3">
            <MediaLibrary
              selectKind={kind === 'any' ? 'any' : kind}
              onSelect={(asset) => {
                onChange(asset.publicUrl || toMediaRef(asset.id))
                setPickerOpen(false)
              }}
            />
          </div>
        ) : null}
      </div>
    </Field>
  )
}

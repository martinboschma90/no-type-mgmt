import { useEffect, useRef, useState } from 'react'
import { Field } from '@/cms/fields'
import { inputCls } from '@/cms/flow-mates/cms-ui'
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
  const { uploadFiles, assets, syncingRemote, uploading } = useMedia()
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const previewUrl = useResolvedMediaUrl(value)

  const accept =
    kind === 'image' ? 'image/*' : kind === 'video' ? 'video/*' : 'image/*,video/*'

  const mediaId = parseMediaRef(value)
  const matched = mediaId ? assets.find((a) => a.id === mediaId) : undefined

  useEffect(() => {
    if (!matched?.publicUrl || value === matched.publicUrl) return
    onChange(matched.publicUrl)
  }, [matched?.publicUrl, onChange, value])

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
          <div className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-neutral-900">{matched.name}</p>
              <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-neutral-500">
                Mediabibliotheek ·{' '}
                {matched.mimeType === 'image/webp'
                  ? 'WebP'
                  : matched.mimeType.includes('webm')
                    ? 'WebM'
                    : 'Video'}
              </p>
            </div>
            <button
              type="button"
              className="shrink-0 rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-neutral-500 hover:bg-neutral-200 hover:text-neutral-900"
              onClick={() => onChange('')}
            >
              Wissen
            </button>
          </div>
        ) : (
          <input
            type="text"
            className={inputCls}
            value={value}
            placeholder="https://… of upload een bestand"
            onChange={(e) => onChange(e.target.value)}
          />
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
            className="cms-secondary-action rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-40"
          >
            {busy ? 'Verwerken…' : 'Uploaden'}
          </button>
          <button
            type="button"
            onClick={() => setPickerOpen((o) => !o)}
            className="cms-secondary-action rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
          >
            {pickerOpen ? 'Bibliotheek sluiten' : 'Mediabibliotheek'}
          </button>
          {matched ? (
            <span className="self-center text-[10px] font-medium text-emerald-600">
              {matched.mimeType === 'image/webp'
                ? 'WebP'
                : matched.mimeType.includes('webm')
                  ? 'WebM'
                  : 'Video'}
            </span>
          ) : null}
        </div>

        {busy && uploading ? (
          <p className="rounded-lg bg-sky-500/10 px-2.5 py-2 text-[11px] leading-relaxed text-sky-600">
            {uploading.message || 'Video verwerken…'} Sluit dit tabblad nog niet.
          </p>
        ) : mediaId && !matched?.publicUrl ? (
          <p className="rounded-lg bg-amber-500/10 px-2.5 py-2 text-[11px] leading-relaxed text-amber-600">
            {syncingRemote
              ? 'Video wordt naar permanente opslag geüpload…'
              : 'Online upload wordt automatisch opnieuw geprobeerd. Laat dit tabblad open.'}
          </p>
        ) : null}

        {error ? <p className="text-xs text-red-500">{error}</p> : null}

        {previewUrl && kind !== 'video' ? (
          <div className="overflow-hidden rounded-lg border border-ink/8 bg-ink/5">
            <img src={previewUrl} alt="" className="h-28 w-full object-cover" />
          </div>
        ) : null}
        {previewUrl && kind === 'video' ? (
          <div
            className="mx-auto w-[min(100%,14rem)] overflow-hidden rounded-xl bg-ink/10"
            style={{ aspectRatio: '9 / 16' }}
          >
            <video
              key={previewUrl}
              src={previewUrl}
              controls
              muted
              playsInline
              preload="metadata"
              className="h-full w-full object-cover object-center"
            />
          </div>
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

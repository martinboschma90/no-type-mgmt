import type { Artist } from '@/types/artist'
import {
  applyArtistStatus,
  getArtistStatus,
} from '@/cms/artistVisibility'

type ArtistPublishBarProps = {
  artist: Artist
  dirty: boolean
  saving: boolean
  onSave: () => void
  onPublish: () => void
  onUnpublish: () => void
}

/** Top action bar — draft/publish workflow for the artist editor. */
export function ArtistPublishBar({
  artist,
  dirty,
  saving,
  onSave,
  onPublish,
  onUnpublish,
}: ArtistPublishBarProps) {
  const status = getArtistStatus(artist)
  const published = status === 'published'

  return (
    <div className="mb-3 flex flex-wrap items-center gap-2 rounded-2xl border border-ink/10 bg-[var(--body-bg)] px-3 py-2.5 sm:gap-3 sm:px-4">
      <span
        className={[
          'type-label inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.55rem] tracking-[0.12em] uppercase',
          published
            ? 'bg-brand/20 text-ink'
            : 'bg-ink/8 text-ink/55',
        ].join(' ')}
      >
        <span
          className={[
            'h-1.5 w-1.5 rounded-full',
            published ? 'bg-brand' : 'bg-ink/35',
          ].join(' ')}
        />
        {published ? 'Published' : 'Draft'}
      </span>

      {dirty ? (
        <span className="type-label text-[0.55rem] tracking-[0.12em] text-ink/40 uppercase">
          Unsaved changes
        </span>
      ) : (
        <span className="type-label text-[0.55rem] tracking-[0.12em] text-ink/35 uppercase">
          {artist.publishedAt && published
            ? `Live · ${new Date(artist.publishedAt).toLocaleDateString('nl-BE')}`
            : 'Not on public site'}
        </span>
      )}

      <div className="ml-auto flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={saving || !dirty}
          onClick={onSave}
          className="type-label rounded-full border border-ink/15 bg-ink/5 px-3.5 py-2 text-[0.65rem] tracking-[0.12em] text-ink uppercase transition-colors hover:border-ink/30 disabled:opacity-35"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>

        {published ? (
          <button
            type="button"
            disabled={saving}
            onClick={onUnpublish}
            className="type-label rounded-full border border-ink/15 px-3.5 py-2 text-[0.65rem] tracking-[0.12em] text-ink/55 uppercase transition-colors hover:border-ink/30 hover:text-ink disabled:opacity-35"
          >
            Unpublish
          </button>
        ) : (
          <button
            type="button"
            disabled={saving}
            onClick={onPublish}
            className="type-label rounded-full bg-brand px-3.5 py-2 text-[0.65rem] tracking-[0.12em] text-[#111111] uppercase transition-opacity hover:opacity-90 disabled:opacity-35"
          >
            Publish
          </button>
        )}
      </div>
    </div>
  )
}

/** Re-export helper for editors that toggle via publish APIs. */
export { applyArtistStatus, getArtistStatus }

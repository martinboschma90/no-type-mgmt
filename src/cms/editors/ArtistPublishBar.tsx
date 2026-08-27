import type { Artist } from '@/types/artist'
import {
  applyArtistStatus,
  getArtistStatus,
} from '@/cms/artistVisibility'
import {
  artistHasLocalMediaRefs,
  listLocalMediaFields,
  LOCAL_MEDIA_PUBLISH_WARNING,
} from '@/cms/artistLocalMedia'

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
  const localMedia = artistHasLocalMediaRefs(artist)
  const localFields = localMedia ? listLocalMediaFields(artist) : []

  return (
    <div className="space-y-2">
      <div
        className="flex flex-wrap items-center gap-2 rounded-2xl border border-ink/15 bg-ink/[0.06] px-3 py-2.5 sm:gap-3 sm:px-4"
        data-cms-publish-bar
        role="toolbar"
        aria-label="Artiest opslaan en publiceren"
      >
        <span
          className={[
            'type-label inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.6rem] tracking-[0.12em] uppercase',
            published
              ? 'bg-emerald-500/20 text-ink'
              : 'bg-ink/10 text-ink/70',
          ].join(' ')}
        >
          <span
            className={[
              'h-1.5 w-1.5 rounded-full',
              published ? 'bg-emerald-500' : 'bg-ink/40',
            ].join(' ')}
          />
          {published ? 'Live op de site' : 'Concept'}
        </span>

        {dirty ? (
          <span className="type-label rounded-full bg-brand/20 px-2.5 py-1 text-[0.55rem] tracking-[0.12em] text-ink uppercase">
            Niet opgeslagen
          </span>
        ) : (
          <span className="type-label text-[0.55rem] tracking-[0.12em] text-ink/40 uppercase">
            Alles opgeslagen
          </span>
        )}

        <div className="flex w-full flex-wrap items-center gap-2 sm:ml-auto sm:w-auto">
          <button
            type="button"
            disabled={saving || !dirty}
            onClick={onSave}
            className={[
              'type-label rounded-full px-4 py-2.5 text-[0.65rem] tracking-[0.12em] uppercase transition-opacity disabled:cursor-not-allowed disabled:opacity-45',
              dirty
                ? 'bg-brand text-[#111111] hover:opacity-90'
                : 'border border-ink/20 bg-[var(--body-bg)] text-ink',
            ].join(' ')}
          >
            {saving ? 'Opslaan…' : 'Opslaan'}
          </button>
          <a
            href={`/artists/${artist.slug}`}
            target="_blank"
            rel="noreferrer"
            className="type-label rounded-full border border-ink/20 px-3 py-2.5 text-[0.65rem] tracking-[0.12em] text-ink/55 uppercase transition-colors hover:border-ink/40 hover:text-ink"
          >
            Live pagina ↗
          </a>
          {published ? (
            <button
              type="button"
              disabled={saving}
              onClick={onUnpublish}
              className="type-label rounded-full px-3 py-2.5 text-[0.65rem] tracking-[0.12em] text-ink/40 uppercase transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-45"
            >
              Depubliceren
            </button>
          ) : (
            <button
              type="button"
              disabled={saving || localMedia}
              onClick={onPublish}
              title={localMedia ? LOCAL_MEDIA_PUBLISH_WARNING : undefined}
              className="type-label rounded-full bg-ink px-4 py-2.5 text-[0.65rem] tracking-[0.12em] text-ink-inverse uppercase transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
            >
              Publiceren
            </button>
          )}
        </div>
      </div>

      {localMedia ? (
        <div
          className="rounded-2xl border border-red-500/35 bg-red-500/10 px-3.5 py-3"
          role="alert"
        >
          <p className="type-label text-[0.65rem] tracking-[0.12em] text-red-400 uppercase">
            {LOCAL_MEDIA_PUBLISH_WARNING}
          </p>
          <p className="type-body mt-1.5 text-xs text-ink/60">
            Local-only refs: {localFields.join(', ')}. Re-upload via Profiel /
            Visuals so files get a permanent HTTPS Storage URL, then publish.
          </p>
        </div>
      ) : null}
    </div>
  )
}

/** Re-export helper for editors that toggle via publish APIs. */
export { applyArtistStatus, getArtistStatus }

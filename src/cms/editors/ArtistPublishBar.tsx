import type { Artist } from '@/types/artist'
import {
  applyArtistStatus,
  getArtistStatus,
} from '@/cms/artistVisibility'
import {
  artistHasLocalMediaRefs,
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

  return (
    <div className="space-y-2">
      <div
        className="flex flex-wrap items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 sm:px-4"
        data-cms-publish-bar
        role="toolbar"
        aria-label="Artiest opslaan en publiceren"
      >
        <span
          className={[
            'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium',
            published
              ? 'bg-emerald-500/20 text-emerald-500'
              : 'bg-neutral-500/15 text-neutral-400',
          ].join(' ')}
        >
          <span
            className={[
              'h-1.5 w-1.5 rounded-full',
              published ? 'bg-emerald-500' : 'bg-ink/40',
            ].join(' ')}
          />
          {published ? 'Live' : 'Concept'}
        </span>

        {dirty ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-500">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Niet opgeslagen
          </span>
        ) : (
          <span className="text-xs text-neutral-400">
            Alles opgeslagen
          </span>
        )}

        <div className="flex w-full flex-wrap items-center gap-2 sm:ml-auto sm:w-auto">
          <button
            type="button"
            disabled={saving || !dirty}
            onClick={onSave}
            className={[
              'cms-primary-action rounded-lg px-3.5 py-2 text-xs font-semibold transition-opacity disabled:cursor-not-allowed disabled:opacity-45',
              dirty
                ? 'bg-neutral-900 text-white hover:bg-neutral-800'
                : 'border border-neutral-600 bg-neutral-800 text-neutral-200',
            ].join(' ')}
          >
            {saving ? 'Opslaan…' : 'Opslaan'}
          </button>
          <a
            href={`/artists/${artist.slug}`}
            target="_blank"
            rel="noreferrer"
            className="cms-secondary-action inline-flex items-center rounded-lg border border-neutral-200 bg-white px-3.5 py-2 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
          >
            Live pagina ↗
          </a>
          {published ? (
            <button
              type="button"
              disabled={saving}
              onClick={onUnpublish}
              className="cms-ghost-action rounded-lg px-3 py-2 text-xs font-medium text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-45"
            >
              Depubliceren
            </button>
          ) : (
            <button
              type="button"
              disabled={saving || localMedia}
              onClick={onPublish}
              title={localMedia ? LOCAL_MEDIA_PUBLISH_WARNING : undefined}
              className="cms-primary-action rounded-lg bg-neutral-900 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-45"
            >
              Publiceren
            </button>
          )}
        </div>
      </div>

    </div>
  )
}

/** Re-export helper for editors that toggle via publish APIs. */
export { applyArtistStatus, getArtistStatus }

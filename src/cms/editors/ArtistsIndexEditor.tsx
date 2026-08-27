import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCms } from '@/cms/CmsProvider'
import {
  artistHasLocalMediaRefs,
  LOCAL_MEDIA_PUBLISH_WARNING,
} from '@/cms/artistLocalMedia'
import { artistGenres } from '@/cms/artistGenres'
import { instagramPostsFromArtist } from '@/cms/artistInstagram'
import {
  getArtistStatus,
  isArtistVisible,
  sortArtistsByName,
} from '@/cms/artistVisibility'
import { artistHasVideos } from '@/cms/artistVideos'
import { ArtistVisibilityToggle } from '@/cms/editors/ArtistVisibilityToggle'
import { portraitImageStyle } from '@/cms/imageFocus'
import { useArtistImageUrl } from '@/cms/media/useArtistImageUrl'
import type { Artist } from '@/types/artist'

function artistHasBio(artist: Artist) {
  return (artist.bio ?? '').trim().length > 20
}

function artistHasVisuals(artist: Artist) {
  if (artistHasVideos(artist)) return true
  return (artist.films ?? []).some((film) => Boolean(film.videoUrl?.trim()))
}

function artistHasInstagramFeed(artist: Artist) {
  return instagramPostsFromArtist(artist.instagramFeed).length > 0
}

function StatusChip({ label, ready }: { label: string; ready: boolean }) {
  return (
    <span
      className={[
        'type-label inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[0.5rem] tracking-[0.1em] uppercase',
        ready ? 'bg-emerald-500/12 text-ink/65' : 'bg-ink/6 text-ink/35',
      ].join(' ')}
    >
      {label}
      {ready ? <span aria-hidden> ✓</span> : null}
    </span>
  )
}

function ArtistCard({
  artist,
  onRemove,
  onVisibilityChange,
}: {
  artist: Artist
  onRemove: () => void
  onVisibilityChange: (visible: boolean) => void
}) {
  const imageUrl = useArtistImageUrl(artist)
  const frame = portraitImageStyle(artist)
  const published = getArtistStatus(artist) === 'published'
  const genres = artistGenres(artist)

  return (
    <article
      className={[
        'flex flex-col overflow-hidden rounded-2xl border border-ink/10 bg-[var(--body-bg)]',
        published ? '' : 'opacity-80',
      ].join(' ')}
    >
      <Link
        to={`/cms/artists/${artist.slug}`}
        className="group flex min-w-0 flex-1 flex-col"
      >
        <div className="relative aspect-[4/5] overflow-hidden bg-ink/5">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              style={frame}
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-0.5 px-3 text-center">
              <span className="type-label text-[0.5rem] tracking-[0.1em] text-ink/35 uppercase">
                No img
              </span>
              <span className="type-label text-[0.45rem] tracking-[0.08em] text-brand/80 uppercase">
                Re-upload
              </span>
            </div>
          )}
          <span
            className={[
              'type-label absolute top-2 left-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.5rem] tracking-[0.1em] uppercase',
              published
                ? 'bg-emerald-500/90 text-[#111]'
                : 'bg-ink/70 text-[#f5f5f5]',
            ].join(' ')}
          >
            <span
              className={`h-1 w-1 rounded-full ${
                published ? 'bg-[#111]' : 'bg-ink/25'
              }`}
              aria-hidden
            />
            {published ? 'Published' : 'Draft'}
          </span>
        </div>
        <div className="flex flex-1 flex-col p-3.5">
          <p className="type-headline truncate text-sm text-ink">{artist.name}</p>
          <p className="type-label mt-1 truncate text-[0.55rem] tracking-[0.12em] text-ink/40 uppercase">
            {genres.join(' · ') || 'No genre'}
          </p>
          <p className="mt-2 flex flex-wrap gap-1">
            <StatusChip label="Bio" ready={artistHasBio(artist)} />
            <StatusChip label="Visuals" ready={artistHasVisuals(artist)} />
            <StatusChip label="Instagram" ready={artistHasInstagramFeed(artist)} />
          </p>
        </div>
      </Link>
      <div className="flex items-center justify-between gap-2 border-t border-ink/8 px-3 py-2.5">
        <ArtistVisibilityToggle
          compact
          visible={published}
          onChange={onVisibilityChange}
        />
        <button
          type="button"
          aria-label={`Verwijder ${artist.name}`}
          onClick={onRemove}
          className="type-label rounded-full px-2 py-1 text-[0.55rem] tracking-[0.12em] text-ink/35 uppercase transition-colors hover:text-ink"
        >
          Del
        </button>
      </div>
    </article>
  )
}

function AddArtistModal({
  open,
  name,
  error,
  onNameChange,
  onClose,
  onSubmit,
}: {
  open: boolean
  name: string
  error: string | null
  onNameChange: (value: string) => void
  onClose: () => void
  onSubmit: () => void
}) {
  const titleId = useId()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    const t = window.setTimeout(() => inputRef.current?.focus(), 40)
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(t)
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 p-4"
      role="presentation"
      onClick={onClose}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md rounded-2xl border border-ink/12 bg-[var(--body-bg)] p-5 text-ink shadow-xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit()
        }}
      >
        <h2 id={titleId} className="type-headline m-0 text-lg text-ink">
          Nieuwe artiest
        </h2>
        <p className="type-body mt-2 text-sm text-ink/50">
          Naam is genoeg — de rest vul je in op de artiestenpagina.
        </p>
        <label className="mt-5 block">
          <span className="type-label mb-1.5 block text-[0.65rem] tracking-[0.14em] text-ink/45 uppercase">
            Naam
          </span>
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Naam, bv. Alber-K"
            className="w-full rounded-lg border border-ink/12 bg-[var(--body-bg)] px-3 py-2.5 type-body text-sm text-ink outline-none placeholder:text-ink/30 focus:border-accent/60"
          />
        </label>
        {error ? <p className="mt-2 text-xs text-red-500">{error}</p> : null}
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="type-label rounded-full border border-ink/12 px-4 py-2.5 text-[0.65rem] tracking-[0.12em] text-ink/50 uppercase hover:text-ink"
          >
            Annuleren
          </button>
          <button
            type="submit"
            className="type-label rounded-full bg-ink px-5 py-2.5 text-[0.65rem] tracking-[0.12em] text-ink-inverse uppercase"
          >
            + Toevoegen
          </button>
        </div>
      </form>
    </div>
  )
}

/** Overview of all artist pages — add, hide, open, or remove. */
export function ArtistsIndexEditor() {
  const { content, addArtist, removeArtist, publishArtist, unpublishArtist } =
    useCms()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = sortArtistsByName(content.artists)
    if (!q) return list
    return list.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.slug.toLowerCase().includes(q) ||
        artistGenres(a).join(' ').toLowerCase().includes(q),
    )
  }, [content.artists, query])

  const hiddenCount = content.artists.filter((a) => !isArtistVisible(a)).length

  const closeModal = () => {
    setModalOpen(false)
    setError(null)
    setName('')
  }

  const handleAdd = () => {
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Vul een artiestennaam in')
      return
    }
    setError(null)
    const artist = addArtist(trimmed)
    closeModal()
    navigate(`/cms/artists/${artist.slug}`)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="type-headline m-0 text-lg text-ink">
            Artiestenpagina&apos;s
          </h2>
          <p className="type-body mt-1 text-xs text-ink/45">
            Zet artiesten op verborgen om ze van roster én publieke pagina te
            halen — ze blijven bewerkbaar in het CMS.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="type-label shrink-0 rounded-full bg-ink px-4 py-2.5 text-[0.65rem] tracking-[0.12em] text-ink-inverse uppercase"
        >
          + Toevoegen
        </button>
      </div>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Zoek artiest…"
        className="w-full rounded-xl border border-ink/12 bg-[var(--body-bg)] px-3 py-2.5 type-body text-sm text-ink outline-none placeholder:text-ink/30 focus:border-accent/60"
      />

      <p className="type-label text-[0.6rem] tracking-[0.12em] text-ink/40 uppercase">
        {filtered.length} / {content.artists.length} pagina&apos;s
        {hiddenCount > 0 ? ` · ${hiddenCount} draft` : ''}
      </p>

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {filtered.map((artist) => (
          <li key={artist.id}>
            <ArtistCard
              artist={artist}
              onVisibilityChange={(visible) => {
                if (visible && artistHasLocalMediaRefs(artist)) {
                  window.alert(LOCAL_MEDIA_PUBLISH_WARNING)
                  return
                }
                void (visible
                  ? publishArtist(artist.slug)
                  : unpublishArtist(artist.slug))
              }}
              onRemove={() => {
                if (
                  window.confirm(
                    `Artiest “${artist.name}” verwijderen van roster en CMS?`,
                  )
                ) {
                  removeArtist(artist.slug)
                }
              }}
            />
          </li>
        ))}
      </ul>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink/15 px-4 py-10 text-center">
          <p className="type-body text-sm text-ink/40">Geen artiesten gevonden.</p>
        </div>
      ) : null}

      <AddArtistModal
        open={modalOpen}
        name={name}
        error={error}
        onNameChange={(value) => {
          setName(value)
          if (error) setError(null)
        }}
        onClose={closeModal}
        onSubmit={handleAdd}
      />
    </div>
  )
}

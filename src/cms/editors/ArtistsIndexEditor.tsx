import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowUpRight, Trash2 } from 'lucide-react'
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
import { OptimizedImg } from '@/components/ui/OptimizedImg'
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
        'inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium',
        ready
          ? 'bg-emerald-500/10 text-emerald-600'
          : 'bg-neutral-100 text-neutral-400',
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
        'group/card flex flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white transition-colors hover:border-neutral-400',
        published ? '' : 'opacity-80',
      ].join(' ')}
    >
      <Link
        to={`/cms/artists/${artist.slug}`}
        className="group flex min-w-0 flex-1 flex-col"
      >
        <div className="relative aspect-[4/5] overflow-hidden bg-neutral-100">
          {imageUrl ? (
            <OptimizedImg
              src={imageUrl}
              alt=""
              size="card"
              className="absolute inset-0 h-full w-full object-cover"
              style={frame}
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-0.5 px-3 text-center">
              <span className="text-[10px] font-medium text-neutral-500">
                Geen afbeelding
              </span>
              <span className="text-[10px] text-neutral-400">
                Opnieuw uploaden
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
        <div className="flex flex-1 flex-col p-4">
          <p className="truncate text-sm font-semibold text-neutral-900">{artist.name}</p>
          <p className="mt-1 truncate text-[10px] font-medium uppercase tracking-[0.1em] text-neutral-500">
            {genres.join(' · ') || 'No genre'}
          </p>
          <p className="mt-2 flex flex-wrap gap-1">
            <StatusChip label="Bio" ready={artistHasBio(artist)} />
            <StatusChip label="Shows" ready={artistHasVisuals(artist)} />
            <StatusChip label="Instagram" ready={artistHasInstagramFeed(artist)} />
          </p>
          <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-neutral-700 transition-all group-hover/card:gap-2 group-hover/card:text-neutral-900">
            Open artiestenpagina <ArrowUpRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </Link>
      <div className="flex items-center justify-between gap-2 border-t border-neutral-200 px-3 py-2.5">
        <ArtistVisibilityToggle
          compact
          visible={published}
          onChange={onVisibilityChange}
        />
        <button
          type="button"
          aria-label={`Verwijder ${artist.name}`}
          onClick={onRemove}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium text-neutral-400 transition-colors hover:bg-red-500/10 hover:text-red-500"
        >
          <Trash2 className="h-3 w-3" />
          Verwijderen
        </button>
      </div>
    </article>
  )
}

function AddArtistModal({
  open,
  name,
  error,
  justAdded,
  onNameChange,
  onClose,
  onSubmit,
}: {
  open: boolean
  name: string
  error: string | null
  justAdded: string | null
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
  }, [open, onClose, justAdded])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/55 p-4"
      role="presentation"
      onClick={onClose}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-5 text-neutral-900 shadow-xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit()
        }}
      >
        <h2 id={titleId} className="m-0 text-lg font-semibold text-neutral-900">
          Nieuwe artiest
        </h2>
        <p className="mt-2 text-sm text-neutral-500">
          Naam is genoeg — de rest vul je in op de artiestenpagina.
        </p>
        <label className="mt-5 block">
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-700">
            Naam
          </span>
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Naam, bv. Alber-K"
            className="w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-500 focus:ring-4 focus:ring-neutral-500/10"
          />
        </label>
        {justAdded ? (
          <p className="mt-2 text-xs text-emerald-600">
            {justAdded} toegevoegd — vul nog een naam in of sluit.
          </p>
        ) : null}
        {error ? <p className="mt-2 text-xs text-red-500">{error}</p> : null}
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="cms-secondary-action rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Annuleren
          </button>
          <button
            type="submit"
            className="cms-primary-action rounded-lg bg-neutral-900 px-5 py-2.5 text-xs font-semibold text-white"
          >
            + Toevoegen
          </button>
        </div>
      </form>
    </div>,
    document.body,
  )
}

/** Overview of all artist pages — add, hide, open, or remove. */
export function ArtistsIndexEditor() {
  const { content, addArtist, removeArtist, publishArtist, unpublishArtist } =
    useCms()
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(
    () => searchParams.get('new') === '1',
  )
  const [justAdded, setJustAdded] = useState<string | null>(null)

  useEffect(() => {
    if (searchParams.get('new') !== '1') return
    setModalOpen(true)
    const next = new URLSearchParams(searchParams)
    next.delete('new')
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams])

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
    setJustAdded(null)
  }

  const handleAdd = () => {
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Vul een artiestennaam in')
      return
    }
    const taken = content.artists.some(
      (artist) => artist.name.trim().toLowerCase() === trimmed.toLowerCase(),
    )
    if (taken) {
      setError('Die naam bestaat al')
      return
    }
    setError(null)
    addArtist(trimmed)
    setName('')
    setJustAdded(trimmed)
  }

  return (
    <div className="cms-artist-editor space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="m-0 text-lg font-semibold text-neutral-900">
            Artiestenpagina&apos;s
          </h2>
          <p className="mt-1 max-w-xl text-xs leading-relaxed text-neutral-500">
            Zet artiesten op verborgen om ze van roster én publieke pagina te
            halen — ze blijven bewerkbaar in het CMS.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="cms-primary-action shrink-0 rounded-lg bg-neutral-900 px-4 py-2.5 text-xs font-semibold text-white"
        >
          + Toevoegen
        </button>
      </div>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Zoek artiest…"
        className="w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-500 focus:ring-4 focus:ring-neutral-500/10"
      />

      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
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
        justAdded={justAdded}
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

import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCms } from '@/cms/CmsProvider'
import { isArtistVisible, sortArtistsByName } from '@/cms/artistVisibility'
import { ArtistVisibilityToggle } from '@/cms/editors/ArtistVisibilityToggle'
import { portraitImageStyle } from '@/cms/imageFocus'
import { useResolvedMediaUrl } from '@/cms/media/useResolvedMediaUrl'
import type { Artist } from '@/types/artist'

function ArtistRow({
  artist,
  onRemove,
  onVisibilityChange,
}: {
  artist: Artist
  onRemove: () => void
  onVisibilityChange: (visible: boolean) => void
}) {
  const imageUrl = useResolvedMediaUrl(artist.imageUrl)
  const frame = portraitImageStyle(artist)
  const visible = isArtistVisible(artist)

  return (
    <div
      className={[
        'flex items-stretch gap-2',
        visible ? '' : 'opacity-70',
      ].join(' ')}
    >
      <Link
        to={`/cms/artists/${artist.slug}`}
        className="group flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-ink/10 bg-[var(--body-bg)] p-3 transition-colors hover:border-ink/25 hover:bg-ink/[0.03]"
      >
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-ink/5">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt=""
              className="absolute object-cover"
              style={frame}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center type-label text-[0.55rem] text-ink/25 uppercase">
              No img
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="type-headline truncate text-sm text-ink">{artist.name}</p>
          <p className="type-label mt-1 truncate text-[0.6rem] tracking-[0.12em] text-ink/40 uppercase">
            {artist.genre || 'No genre'} · /artists/{artist.slug}
            {!visible ? ' · draft' : ' · published'}
          </p>
        </div>
        <span className="type-label shrink-0 text-[0.6rem] tracking-[0.12em] text-brand uppercase transition-opacity group-hover:opacity-80">
          Edit →
        </span>
      </Link>
      <div className="flex shrink-0 flex-col justify-center gap-1.5">
        <ArtistVisibilityToggle
          compact
          visible={visible}
          onChange={onVisibilityChange}
        />
        <button
          type="button"
          aria-label={`Verwijder ${artist.name}`}
          onClick={onRemove}
          className="type-label rounded-full border border-ink/10 px-2.5 py-1.5 text-[0.55rem] tracking-[0.12em] text-ink/35 uppercase transition-colors hover:border-ink/25 hover:text-ink"
        >
          Del
        </button>
      </div>
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = sortArtistsByName(content.artists)
    if (!q) return list
    return list.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.slug.toLowerCase().includes(q) ||
        (a.genre ?? '').toLowerCase().includes(q),
    )
  }, [content.artists, query])

  const hiddenCount = content.artists.filter((a) => !isArtistVisible(a)).length

  const handleAdd = () => {
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Vul een artiestennaam in')
      return
    }
    setError(null)
    const artist = addArtist(trimmed)
    setName('')
    navigate(`/cms/artists/${artist.slug}`)
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="type-headline m-0 text-lg text-ink">Artiestenpagina&apos;s</h2>
        <p className="type-body mt-1 text-xs text-ink/45">
          Zet artiesten op verborgen om ze van roster én publieke pagina te halen — ze blijven
          bewerkbaar in het CMS.
        </p>
      </div>

      <form
        className="space-y-2 rounded-2xl border border-brand/25 bg-brand/5 p-3.5"
        onSubmit={(e) => {
          e.preventDefault()
          handleAdd()
        }}
      >
        <p className="type-label text-[0.65rem] tracking-[0.14em] text-ink/50 uppercase">
          Nieuwe artiest
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (error) setError(null)
            }}
            placeholder="Naam, bv. Alber-K"
            className="w-full rounded-xl border border-ink/12 bg-[var(--body-bg)] px-3 py-2.5 type-body text-sm text-ink outline-none placeholder:text-ink/30 focus:border-brand/60"
          />
          <button
            type="submit"
            className="type-ui shrink-0 rounded-full bg-ink px-5 py-2.5 text-[0.65rem] text-ink-inverse transition-opacity hover:opacity-85"
          >
            + Toevoegen
          </button>
        </div>
        {error ? <p className="text-xs text-red-500">{error}</p> : null}
      </form>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Zoek artiest…"
        className="w-full rounded-xl border border-ink/12 bg-[var(--body-bg)] px-3 py-2.5 type-body text-sm text-ink outline-none placeholder:text-ink/30 focus:border-brand/60"
      />

      <p className="type-label text-[0.6rem] tracking-[0.12em] text-ink/40 uppercase">
        {filtered.length} / {content.artists.length} pagina&apos;s
        {hiddenCount > 0 ? ` · ${hiddenCount} draft` : ''}
      </p>

      <ul className="space-y-2">
        {filtered.map((artist) => (
          <li key={artist.id}>
            <ArtistRow
              artist={artist}
              onVisibilityChange={(visible) => {
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
        <p className="type-body text-sm text-ink/40">Geen artiesten gevonden.</p>
      ) : null}
    </div>
  )
}

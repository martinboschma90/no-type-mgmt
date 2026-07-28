import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useCms } from '@/cms/CmsProvider'
import { artistSlugFromPath } from '@/cms/artistSlug'
import { ArtistLayoutEditor } from '@/cms/editors/ArtistLayoutEditor'
import { EditorSection, TextArea, TextInput } from '@/cms/fields'
import { ImageFocusField } from '@/cms/editors/ImageFocusField'
import { ART_DIRECTION_VERSION, resolveArtDirection } from '@/cms/imageFocus'
import { MediaUrlField } from '@/cms/media/MediaUrlField'
import { defaultArtistSocials } from '@/cms/createArtist'
import { isArtistVisible, sortArtistsByName } from '@/cms/artistVisibility'
import { ArtistVisibilityToggle } from '@/cms/editors/ArtistVisibilityToggle'
import type { SocialPlatform } from '@/types/artist'

const PLATFORMS: SocialPlatform[] = [
  'website',
  'instagram',
  'tiktok',
  'facebook',
  'soundcloud',
  'spotify',
  'youtube',
]

export function ArtistEditor() {
  const { pathname } = useLocation()
  const slug = artistSlugFromPath(pathname) ?? ''
  const navigate = useNavigate()
  const { content, updateArtist, getArtistBySlug, removeArtist } = useCms()
  const artist = getArtistBySlug(slug)

  if (!artist) {
    return <Navigate to="/cms/artists" replace />
  }

  const socials = artist.socials ?? []
  const tracks = artist.tracks ?? []
  const visible = isArtistVisible(artist)
  const art = resolveArtDirection(artist)

  return (
    <>
      <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/cms/artists"
          className="type-label text-[0.65rem] tracking-[0.12em] text-ink/45 uppercase transition-colors hover:text-ink"
        >
          ← Alle artiesten
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <ArtistVisibilityToggle
            visible={visible}
            onChange={(next) =>
              updateArtist(slug, (a) => ({ ...a, visible: next }))
            }
          />
          <a
            href={`/artists/${artist.slug}`}
            target="_blank"
            rel="noreferrer"
            className="type-label text-[0.65rem] tracking-[0.12em] text-brand uppercase transition-opacity hover:opacity-70"
          >
            Open live page ↗
          </a>
          <button
            type="button"
            className="type-label text-[0.65rem] tracking-[0.12em] text-ink/35 uppercase transition-colors hover:text-ink"
            onClick={() => {
              if (
                window.confirm(
                  `Artiest “${artist.name}” verwijderen van roster en CMS?`,
                )
              ) {
                removeArtist(artist.slug)
                navigate('/cms/artists')
              }
            }}
          >
            Verwijderen
          </button>
        </div>
      </div>

      {!visible ? (
        <p className="rounded-xl border border-ink/10 bg-ink/5 px-3 py-2 type-body text-xs text-ink/50">
          Deze artiest is verborgen: niet op de homepage-roster en niet bereikbaar via
          /artists/{artist.slug}.
        </p>
      ) : null}

      <label className="mb-2 block">
        <span className="type-label mb-1.5 block text-[0.65rem] tracking-[0.14em] text-ink/45 uppercase">
          Switch artist page
        </span>
        <select
          className="w-full rounded-xl border border-ink/12 bg-[var(--body-bg)] px-3 py-2.5 type-body text-sm text-ink outline-none focus:border-brand/60"
          value={slug}
          onChange={(e) => navigate(`/cms/artists/${e.target.value}`)}
          aria-label="Select artist"
        >
          {sortArtistsByName(content.artists).map((a) => (
            <option key={a.slug} value={a.slug}>
              {a.name}
            </option>
          ))}
        </select>
      </label>

      <ArtistLayoutEditor
        artist={artist}
        onChange={(sections) => updateArtist(slug, (a) => ({ ...a, sections }))}
        onVideoChange={(videoUrl) =>
          updateArtist(slug, (a) => ({
            ...a,
            videoUrl: videoUrl || undefined,
          }))
        }
      />

      <EditorSection
        title="Profile"
        description="Hero identity on the public artist page."
        defaultOpen
        defaultTabId="media"
        tabs={[
          {
            id: 'content',
            label: 'Content',
            children: (
              <>
                <TextInput
                  label="Name"
                  value={artist.name}
                  onChange={(name) => updateArtist(slug, (a) => ({ ...a, name }))}
                />
                <TextInput
                  label="Slug (URL)"
                  value={artist.slug}
                  hint="Live URL: /artists/{slug} — change carefully."
                  onChange={(nextSlug) => {
                    const cleaned = nextSlug
                      .toLowerCase()
                      .replace(/[^a-z0-9-]+/g, '-')
                      .replace(/-+/g, '-')
                      .replace(/^-|-$/g, '')
                    updateArtist(slug, (a) => ({ ...a, slug: cleaned || a.slug }))
                    if (cleaned && cleaned !== slug) {
                      navigate(`/cms/artists/${cleaned}`, { replace: true })
                    }
                  }}
                />
                <TextInput
                  label="Genre"
                  value={artist.genre ?? ''}
                  onChange={(genre) => updateArtist(slug, (a) => ({ ...a, genre }))}
                />
                <TextInput
                  label="Image alt"
                  value={artist.imageAlt}
                  onChange={(imageAlt) =>
                    updateArtist(slug, (a) => ({ ...a, imageAlt }))
                  }
                />
                <TextArea
                  label="Bio"
                  value={artist.bio ?? ''}
                  rows={6}
                  onChange={(bio) => updateArtist(slug, (a) => ({ ...a, bio }))}
                />
                <TextInput
                  label="Presskit URL"
                  value={artist.presskitUrl ?? ''}
                  onChange={(presskitUrl) =>
                    updateArtist(slug, (a) => ({ ...a, presskitUrl }))
                  }
                />
              </>
            ),
          },
          {
            id: 'media',
            label: 'Media',
            children: (
              <>
                <MediaUrlField
                  label="Portrait / hero image"
                  kind="image"
                  value={artist.imageUrl}
                  onChange={(imageUrl) =>
                    updateArtist(slug, (a) => ({ ...a, imageUrl }))
                  }
                />
                <ImageFocusField
                  imageUrl={artist.imageUrl}
                  imageAlt={artist.imageAlt}
                  x={art.x}
                  y={art.y}
                  scale={art.scale}
                  onChange={({ x, y, scale }) =>
                    updateArtist(slug, (a) => ({
                      ...a,
                      imageFocusX: x,
                      imageFocusY: y,
                      imageScale: scale,
                      imageFocus: `${Math.round(x)}% ${Math.round(y)}%`,
                      artDirectionVersion: ART_DIRECTION_VERSION,
                    }))
                  }
                />
                <MediaUrlField
                  label="Video slide (midden van pagina)"
                  kind="video"
                  value={artist.videoUrl ?? ''}
                  onChange={(videoUrl) =>
                    updateArtist(slug, (a) => ({
                      ...a,
                      videoUrl: videoUrl || undefined,
                    }))
                  }
                  hint="Verschijnt gecentreerd tussen hero en tracks. Upload → WebM."
                />
              </>
            ),
          },
        ]}
      />

      <EditorSection
        title="Social links"
        description="Icons on the artist page. Vul de URL’s in — lege links worden verborgen."
        defaultOpen
      >
        {socials.length === 0 ? (
          <p className="type-body text-xs text-ink/40">Nog geen socials — voeg het volledige set toe.</p>
        ) : null}

        {socials.map((link, index) => (
          <div
            key={`${link.platform}-${index}`}
            className="space-y-3 rounded-xl border border-ink/8 bg-ink/[0.03] p-3.5"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="type-label text-[0.65rem] tracking-[0.14em] text-ink/40 uppercase">
                Link {index + 1}
              </p>
              <button
                type="button"
                className="type-label text-[0.6rem] tracking-[0.12em] text-ink/35 uppercase hover:text-ink"
                onClick={() =>
                  updateArtist(slug, (a) => ({
                    ...a,
                    socials: (a.socials ?? []).filter((_, i) => i !== index),
                  }))
                }
              >
                Remove
              </button>
            </div>
            <label className="block">
              <span className="type-label mb-1.5 block text-[0.65rem] tracking-[0.14em] text-ink/45 uppercase">
                Platform
              </span>
              <select
                className="w-full rounded-lg border border-ink/12 bg-[var(--body-bg)] px-3 py-2.5 type-body text-sm text-ink outline-none focus:border-brand/60"
                value={link.platform}
                onChange={(e) =>
                  updateArtist(slug, (a) => ({
                    ...a,
                    socials: (a.socials ?? []).map((s, i) =>
                      i === index
                        ? { ...s, platform: e.target.value as SocialPlatform }
                        : s,
                    ),
                  }))
                }
              >
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
            <TextInput
              label="Label"
              value={link.label}
              onChange={(label) =>
                updateArtist(slug, (a) => ({
                  ...a,
                  socials: (a.socials ?? []).map((s, i) =>
                    i === index ? { ...s, label } : s,
                  ),
                }))
              }
            />
            <TextInput
              label="URL"
              value={link.url}
              onChange={(url) =>
                updateArtist(slug, (a) => ({
                  ...a,
                  socials: (a.socials ?? []).map((s, i) =>
                    i === index ? { ...s, url } : s,
                  ),
                }))
              }
            />
          </div>
        ))}

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            className="type-ui flex-1 rounded-full border border-ink/15 px-4 py-2.5 text-[0.65rem] text-ink/70 transition-colors hover:border-ink/30 hover:text-ink"
            onClick={() =>
              updateArtist(slug, (a) => ({
                ...a,
                socials: [
                  ...(a.socials ?? []),
                  { platform: 'instagram', label: 'Instagram', url: '' },
                ],
              }))
            }
          >
            + Add social
          </button>
          <button
            type="button"
            className="type-ui flex-1 rounded-full border border-brand/35 bg-brand/10 px-4 py-2.5 text-[0.65rem] text-ink transition-colors hover:bg-brand/20"
            onClick={() =>
              updateArtist(slug, (a) => {
                const existing = a.socials ?? []
                const have = new Set(existing.map((s) => s.platform))
                const missing = defaultArtistSocials(a.slug).filter(
                  (s) => !have.has(s.platform),
                )
                return {
                  ...a,
                  socials: existing.length ? [...existing, ...missing] : defaultArtistSocials(a.slug),
                }
              })
            }
          >
            + Alle platforms
          </button>
        </div>
      </EditorSection>

      <EditorSection
        title="Tracks"
        description="Playlist in the music player on the artist page."
      >
        {tracks.length === 0 ? (
          <p className="type-body text-xs text-ink/40">Nog geen tracks — voeg er een toe.</p>
        ) : null}

        {tracks.map((track, index) => (
          <div
            key={track.id}
            className="space-y-3 rounded-xl border border-ink/8 bg-ink/[0.03] p-3.5"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="type-label text-[0.65rem] tracking-[0.14em] text-ink/40 uppercase">
                Track {index + 1}
              </p>
              <button
                type="button"
                className="type-label text-[0.6rem] tracking-[0.12em] text-ink/35 uppercase hover:text-ink"
                onClick={() =>
                  updateArtist(slug, (a) => ({
                    ...a,
                    tracks: (a.tracks ?? []).filter((_, i) => i !== index),
                  }))
                }
              >
                Remove
              </button>
            </div>
            <TextInput
              label="Title"
              value={track.title}
              onChange={(title) =>
                updateArtist(slug, (a) => ({
                  ...a,
                  tracks: (a.tracks ?? []).map((t, i) =>
                    i === index ? { ...t, title } : t,
                  ),
                }))
              }
            />
            <TextInput
              label="Credit"
              value={track.credit ?? ''}
              onChange={(credit) =>
                updateArtist(slug, (a) => ({
                  ...a,
                  tracks: (a.tracks ?? []).map((t, i) =>
                    i === index ? { ...t, credit } : t,
                  ),
                }))
              }
            />
            <TextInput
              label="Duration"
              value={track.duration}
              placeholder="3:24"
              onChange={(duration) =>
                updateArtist(slug, (a) => ({
                  ...a,
                  tracks: (a.tracks ?? []).map((t, i) =>
                    i === index ? { ...t, duration } : t,
                  ),
                }))
              }
            />
          </div>
        ))}

        <button
          type="button"
          className="type-ui w-full rounded-full border border-ink/15 px-4 py-2.5 text-[0.65rem] text-ink/70 transition-colors hover:border-ink/30 hover:text-ink"
          onClick={() =>
            updateArtist(slug, (a) => ({
              ...a,
              tracks: [
                ...(a.tracks ?? []),
                {
                  id: crypto.randomUUID(),
                  title: 'New track',
                  credit: '',
                  duration: '0:00',
                },
              ],
            }))
          }
        >
          + Add track
        </button>
      </EditorSection>
    </>
  )
}

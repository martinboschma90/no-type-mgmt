import { useEffect, useState } from 'react'
import { flushSync } from 'react-dom'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useCms } from '@/cms/CmsProvider'
import { artistSlugFromPath } from '@/cms/artistSlug'
import { ArtistLayoutEditor } from '@/cms/editors/ArtistLayoutEditor'
import { ArtistVideosEditor, withSyncedVideos } from '@/cms/editors/ArtistVideosEditor'
import { ArtistVisibilityToggle } from '@/cms/editors/ArtistVisibilityToggle'
import { EditorSection, Field, TextArea, TextInput } from '@/cms/fields'
import { ImageFocusField } from '@/cms/editors/ImageFocusField'
import { ART_DIRECTION_VERSION, resolveArtDirection } from '@/cms/imageFocus'
import { MediaUrlField } from '@/cms/media/MediaUrlField'
import { defaultArtistSocials } from '@/cms/createArtist'
import {
  DEFAULT_ARTIST_MUSIC,
  MUSIC_PLATFORMS,
} from '@/cms/artistMusic'
import {
  isArtistSectionVisible,
  setArtistSectionVisible,
} from '@/cms/artistSections'
import { ArtistPublishBar } from '@/cms/editors/ArtistPublishBar'
import { artistHasLocalMediaRefs } from '@/cms/artistLocalMedia'
import { normalizeArtistVideos } from '@/cms/artistVideos'
import { isArtistVisible, sortArtistsByName } from '@/cms/artistVisibility'
import type { MusicPlatform, SocialPlatform } from '@/types/artist'

const PLATFORMS: SocialPlatform[] = [
  'website',
  'instagram',
  'tiktok',
  'facebook',
  'soundcloud',
  'spotify',
  'youtube',
]

const slugControlClass =
  'w-full rounded-lg border border-ink/12 bg-[var(--body-bg)] px-3 py-2.5 type-body text-sm text-ink outline-none transition-colors placeholder:text-ink/30 focus:border-brand/60'

/** Soft sanitize while typing (keeps trailing hyphen for mid-edit). */
function sanitizeSlugDraft(raw: string) {
  return raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
}

/** Final slug for save — no leading/trailing hyphens. */
function finalizeSlug(raw: string) {
  return sanitizeSlugDraft(raw).replace(/^-+|-+$/g, '')
}

export function ArtistEditor() {
  const { pathname } = useLocation()
  const routeSlug = artistSlugFromPath(pathname) ?? ''
  const navigate = useNavigate()
  const { content, updateArtist, getArtistBySlug, removeArtist, saveArtist, publishArtist, unpublishArtist, isArtistDirty, artistSaving } = useCms()

  // Stable identity: route may lag briefly after a committed slug change
  const artistFromRoute = getArtistBySlug(routeSlug)
  const [artistId, setArtistId] = useState<string | null>(
    () => artistFromRoute?.id ?? null,
  )
  const artist =
    (artistId
      ? content.artists.find((a) => a.id === artistId)
      : undefined) ?? artistFromRoute

  const [slugDraft, setSlugDraft] = useState(artist?.slug ?? routeSlug)
  const [slugError, setSlugError] = useState<string | null>(null)

  useEffect(() => {
    if (artistFromRoute) {
      setArtistId(artistFromRoute.id)
      setSlugDraft(artistFromRoute.slug)
      setSlugError(null)
    }
  }, [routeSlug, artistFromRoute?.id, artistFromRoute?.slug])

  // Key for updateArtist: prefer current artist slug, else route
  const updateKey = artist?.slug ?? routeSlug

  // Seed full social set when empty (e.g. fresh Supabase rows) so links are editable
  useEffect(() => {
    if (!artist) return
    if ((artist.socials ?? []).length > 0) return
    updateArtist(updateKey, (a) => {
      if ((a.socials ?? []).length > 0) return a
      return { ...a, socials: defaultArtistSocials(a.slug) }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- avoid re-running on every updateArtist identity change
  }, [artistId, artist?.socials?.length])

  function commitSlug(): string | null {
    if (!artist) return null
    const cleaned = finalizeSlug(slugDraft)
    if (!cleaned) {
      setSlugError('Slug cannot be empty.')
      setSlugDraft(artist.slug)
      return null
    }
    if (cleaned.length < 2) {
      setSlugError('Slug must be at least 2 characters.')
      return null
    }
    const taken = content.artists.some(
      (a) => a.slug === cleaned && a.id !== artist.id,
    )
    if (taken) {
      setSlugError('This slug is already used by another artist.')
      return null
    }

    setSlugError(null)
    setSlugDraft(cleaned)

    if (cleaned === artist.slug) {
      if (cleaned !== routeSlug) {
        navigate(`/cms/artists/${cleaned}`, { replace: true })
      }
      return cleaned
    }

    flushSync(() => {
      updateArtist(artist.slug, (a) => ({ ...a, slug: cleaned }))
    })
    navigate(`/cms/artists/${cleaned}`, { replace: true })
    return cleaned
  }

  if (!artist) {
    return <Navigate to="/cms/artists" replace />
  }

  const socials = artist.socials ?? []
  const tracks = artist.tracks ?? []
  const music = artist.music ?? DEFAULT_ARTIST_MUSIC
  const art = resolveArtDirection(artist)
  const dirty = isArtistDirty(artist.id) || slugDraft !== artist.slug
  const editableVideos =
    artist.videos && artist.videos.length > 0
      ? artist.videos
      : normalizeArtistVideos(artist)

  async function handleSave() {
    const slug = commitSlug()
    if (!slug) return
    await saveArtist(slug)
  }

  async function handlePublish() {
    if (!artist || artistHasLocalMediaRefs(artist)) return
    const slug = commitSlug()
    if (!slug) return
    await publishArtist(slug)
  }

  const patchMusic = (patch: Partial<typeof music>) => {
    updateArtist(updateKey, (a) => ({
      ...a,
      music: { ...(a.music ?? DEFAULT_ARTIST_MUSIC), ...patch },
    }))
  }

  const musicSectionVisible = isArtistSectionVisible(artist, 'tracks')
  const contentSectionVisible = isArtistSectionVisible(artist, 'video')

  const setMusicSectionVisible = (visible: boolean) => {
    updateArtist(updateKey, (a) => ({
      ...a,
      sections: setArtistSectionVisible(a.sections, 'tracks', visible),
      music: {
        ...(a.music ?? DEFAULT_ARTIST_MUSIC),
        visible,
      },
    }))
  }

  const setContentSectionVisible = (visible: boolean) => {
    updateArtist(updateKey, (a) => ({
      ...a,
      sections: setArtistSectionVisible(a.sections, 'video', visible),
    }))
  }

  return (
    <div className="space-y-3">
      {/* Sticky so Save / Publish stay visible while scrolling the editor */}
      <div className="sticky top-0 z-20 -mx-4 border-b border-ink/10 bg-[var(--body-bg)]/95 px-4 py-2 backdrop-blur-md sm:-mx-5 sm:px-5">
        <ArtistPublishBar
          artist={artist}
          dirty={dirty}
          saving={artistSaving}
          onSave={() => void handleSave()}
          onPublish={() => void handlePublish()}
          onUnpublish={() => void unpublishArtist(artist.slug)}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/cms/artists"
          className="type-label text-[0.65rem] tracking-[0.12em] text-ink/45 uppercase transition-colors hover:text-ink"
        >
          ← Alle artiesten
        </Link>
        <div className="flex flex-wrap items-center gap-3">
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

      {!isArtistVisible(artist) ? (
        <p className="rounded-xl border border-ink/10 bg-ink/5 px-3 py-2 type-body text-xs text-ink/50">
          Draft — niet op de homepage-roster en niet bereikbaar via /artists/
          {artist.slug} tot je publiceert.
        </p>
      ) : null}

      <label className="block">
        <span className="type-label mb-1.5 block text-[0.65rem] tracking-[0.14em] text-ink/45 uppercase">
          Switch artist page
        </span>
        <select
          className="w-full rounded-xl border border-ink/12 bg-[var(--body-bg)] px-3 py-2.5 type-body text-sm text-ink outline-none focus:border-brand/60"
          value={artist.slug}
          onChange={(e) => navigate(`/cms/artists/${e.target.value}`)}
          aria-label="Select artist"
        >
          {sortArtistsByName(content.artists).map((a) => (
            <option key={a.id} value={a.slug}>
              {a.name}
            </option>
          ))}
        </select>
      </label>

      <EditorSection
        title="Section visibility"
        description="Show or hide Music and Content on this artist page. Data stays saved when hidden."
        defaultOpen
        badge="Settings"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink/8 bg-ink/[0.03] px-3.5 py-3">
          <div>
            <p className="type-label text-[0.65rem] tracking-[0.14em] text-ink/45 uppercase">
              Music
            </p>
            <p className="type-body mt-1 text-xs text-ink/45">
              {musicSectionVisible
                ? 'Zichtbaar op de artiestenpagina'
                : 'Verborgen — muziekdata blijft bewaard'}
            </p>
          </div>
          <ArtistVisibilityToggle
            visible={musicSectionVisible}
            onChange={setMusicSectionVisible}
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink/8 bg-ink/[0.03] px-3.5 py-3">
          <div>
            <p className="type-label text-[0.65rem] tracking-[0.14em] text-ink/45 uppercase">
              Content
            </p>
            <p className="type-body mt-1 text-xs text-ink/45">
              {contentSectionVisible
                ? 'Zichtbaar op de artiestenpagina'
                : 'Verborgen — visuals blijven bewaard'}
            </p>
          </div>
          <ArtistVisibilityToggle
            visible={contentSectionVisible}
            onChange={setContentSectionVisible}
          />
        </div>
      </EditorSection>

      <ArtistLayoutEditor
        artist={artist}
        onChange={(sections) => {
          updateArtist(updateKey, (a) => {
            const tracks = sections.find((s) => s.id === 'tracks')
            const musicVisible = tracks ? tracks.visible !== false : true
            return {
              ...a,
              sections,
              music: {
                ...(a.music ?? DEFAULT_ARTIST_MUSIC),
                visible: musicVisible,
              },
            }
          })
        }}
      />

      <ArtistVideosEditor
        videos={editableVideos}
        sectionVisible={contentSectionVisible}
        onSectionVisibleChange={setContentSectionVisible}
        onChange={(videos) =>
          updateArtist(updateKey, (a) => ({
            ...a,
            ...withSyncedVideos(videos),
          }))
        }
      />

      <EditorSection
        title="Profile"
        description="Content and media for the public artist page."
        defaultOpen
        defaultTabId="content"
        tabs={[
          {
            id: 'content',
            label: 'Content',
            children: (
              <>
                <TextInput
                  label="Artist name"
                  value={artist.name}
                  onChange={(name) => updateArtist(updateKey, (a) => ({ ...a, name }))}
                />
                <Field
                  label="Slug (URL)"
                  hint={
                    slugError
                      ? undefined
                      : `Live URL: /artists/${artist.slug} — apply to save. Typing does not navigate.`
                  }
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <input
                      type="text"
                      className={slugControlClass}
                      value={slugDraft}
                      spellCheck={false}
                      autoComplete="off"
                      aria-invalid={Boolean(slugError)}
                      onChange={(e) => {
                        setSlugError(null)
                        setSlugDraft(sanitizeSlugDraft(e.target.value))
                      }}
                      onBlur={() => commitSlug()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          ;(e.target as HTMLInputElement).blur()
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="type-label shrink-0 rounded-full border border-ink/15 px-4 py-2.5 text-[0.65rem] tracking-[0.12em] text-ink/70 uppercase transition-colors hover:border-ink/30 hover:text-ink"
                      onClick={() => commitSlug()}
                    >
                      Apply slug
                    </button>
                  </div>
                  {slugError ? (
                    <span className="mt-1.5 block text-xs text-red-500" role="alert">
                      {slugError}
                    </span>
                  ) : null}
                </Field>
                <TextInput
                  label="Genre"
                  value={artist.genre ?? ''}
                  placeholder="e.g. House, Techno"
                  onChange={(genre) => updateArtist(updateKey, (a) => ({ ...a, genre }))}
                />
                <TextArea
                  label="Bio"
                  value={artist.bio ?? ''}
                  rows={6}
                  onChange={(bio) => updateArtist(updateKey, (a) => ({ ...a, bio }))}
                />
                <TextInput
                  label="Image alt text"
                  value={artist.imageAlt}
                  onChange={(imageAlt) =>
                    updateArtist(updateKey, (a) => ({ ...a, imageAlt }))
                  }
                />
                <TextInput
                  label="Presskit URL"
                  value={artist.presskitUrl ?? ''}
                  placeholder="https://…"
                  onChange={(presskitUrl) =>
                    updateArtist(updateKey, (a) => ({ ...a, presskitUrl }))
                  }
                />

                <div className="space-y-3.5 border-t border-ink/8 pt-4">
                  <div>
                    <p className="type-headline m-0 text-[0.9rem] text-ink">
                      Social links
                    </p>
                    <p className="type-body mt-1 text-xs text-ink/40">
                      Existing JSON structure preserved. Empty URLs stay hidden on the
                      live page.
                    </p>
                  </div>

                  {socials.length === 0 ? (
                    <p className="type-body text-xs text-ink/40">
                      Socials worden geladen…
                    </p>
                  ) : null}

                  {socials.map((link, index) => (
                    <div
                      key={`${link.platform}-${index}`}
                      className="space-y-3 rounded-xl border border-ink/8 bg-ink/[0.03] p-3.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="type-label text-[0.65rem] tracking-[0.14em] text-ink/40 uppercase">
                          {link.platform}
                        </p>
                        <button
                          type="button"
                          className="type-label text-[0.6rem] tracking-[0.12em] text-ink/35 uppercase hover:text-ink"
                          onClick={() =>
                            updateArtist(updateKey, (a) => ({
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
                            updateArtist(updateKey, (a) => ({
                              ...a,
                              socials: (a.socials ?? []).map((s, i) =>
                                i === index
                                  ? {
                                      ...s,
                                      platform: e.target.value as SocialPlatform,
                                    }
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
                          updateArtist(updateKey, (a) => ({
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
                        placeholder="https://…"
                        onChange={(url) =>
                          updateArtist(updateKey, (a) => ({
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
                        updateArtist(updateKey, (a) => ({
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
                        updateArtist(updateKey, (a) => {
                          const existing = a.socials ?? []
                          const have = new Set(existing.map((s) => s.platform))
                          const missing = defaultArtistSocials(a.slug).filter(
                            (s) => !have.has(s.platform),
                          )
                          return {
                            ...a,
                            socials: existing.length
                              ? [...existing, ...missing]
                              : defaultArtistSocials(a.slug),
                          }
                        })
                      }
                    >
                      + Alle platforms
                    </button>
                  </div>
                </div>
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
                    updateArtist(updateKey, (a) => ({ ...a, imageUrl }))
                  }
                />
                <ImageFocusField
                  imageUrl={artist.imageUrl}
                  imageAlt={artist.imageAlt}
                  x={art.x}
                  y={art.y}
                  scale={art.scale}
                  onChange={({ x, y, scale }) =>
                    updateArtist(updateKey, (a) => ({
                      ...a,
                      imageFocusX: x,
                      imageFocusY: y,
                      imageScale: scale,
                      imageFocus: `${Math.round(x)}% ${Math.round(y)}%`,
                      artDirectionVersion: ART_DIRECTION_VERSION,
                    }))
                  }
                />
                <p className="type-body text-xs text-ink/40">
                  Visuals are managed in the <span className="text-ink/70">Visuals</span>{' '}
                  section above (9:16, up to 5 clips).
                </p>
              </>
            ),
          },
        ]}
      />

      <EditorSection
        title="Music"
        description="Choose a platform embed per artist. Legacy track list stays available below."
        defaultOpen
      >
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink/8 bg-ink/[0.03] px-3.5 py-3">
          <div>
            <p className="type-label text-[0.65rem] tracking-[0.14em] text-ink/45 uppercase">
              Music sectie
            </p>
            <p className="type-body mt-1 text-xs text-ink/45">
              {musicSectionVisible
                ? 'Zichtbaar op de artiestenpagina'
                : 'Verborgen — data blijft bewaard'}
            </p>
          </div>
          <ArtistVisibilityToggle
            visible={musicSectionVisible}
            onChange={setMusicSectionVisible}
          />
        </div>
        <fieldset className="space-y-2">
          <legend className="type-label mb-1.5 block text-[0.65rem] tracking-[0.14em] text-ink/45 uppercase">
            Platform
          </legend>
          <div className="flex flex-col gap-2">
            {MUSIC_PLATFORMS.map((option) => {
              const selected = music.platform === option.id
              return (
                <label
                  key={option.id}
                  className={[
                    'flex cursor-pointer items-start gap-3 rounded-xl border px-3.5 py-3 transition-colors',
                    selected
                      ? 'border-brand/50 bg-brand/10'
                      : 'border-ink/10 bg-ink/[0.03] hover:border-ink/20',
                  ].join(' ')}
                >
                  <input
                    type="radio"
                    name={`music-platform-${artist.id}`}
                    className="mt-1 accent-[var(--brand,#D8FF3E)]"
                    checked={selected}
                    onChange={() => {
                      const defaults: Record<MusicPlatform, string> = {
                        soundcloud: music.title || 'Latest Mix',
                        spotify: music.title || 'Latest Releases',
                        custom: music.title || 'Listen',
                      }
                      patchMusic({
                        platform: option.id,
                        title:
                          music.title &&
                          music.title !== 'Latest Mix' &&
                          music.title !== 'Latest Releases' &&
                          music.title !== 'Listen'
                            ? music.title
                            : defaults[option.id],
                      })
                    }}
                  />
                  <span className="min-w-0">
                    <span className="type-headline block text-sm text-ink">
                      {option.label}
                    </span>
                    <span className="type-body mt-0.5 block text-xs text-ink/40">
                      {option.hint}
                    </span>
                  </span>
                </label>
              )
            })}
          </div>
        </fieldset>

        <TextInput
          label="Title"
          value={music.title}
          placeholder={
            music.platform === 'spotify' ? 'Latest Releases' : 'Latest Mix'
          }
          onChange={(title) => patchMusic({ title })}
        />
        <TextInput
          label="Embed URL"
          value={music.embedUrl}
          placeholder={
            music.platform === 'spotify'
              ? 'https://open.spotify.com/artist/…'
              : music.platform === 'soundcloud'
                ? 'https://soundcloud.com/…'
                : 'https://…'
          }
          hint={MUSIC_PLATFORMS.find((p) => p.id === music.platform)?.hint}
          onChange={(embedUrl) => patchMusic({ embedUrl })}
        />

      </EditorSection>

      <EditorSection
        title="Tracks"
        description="Legacy playlist (kept for compatibility). Used when music embed is off or empty."
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
                  updateArtist(updateKey, (a) => ({
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
                updateArtist(updateKey, (a) => ({
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
                updateArtist(updateKey, (a) => ({
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
                updateArtist(updateKey, (a) => ({
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
            updateArtist(updateKey, (a) => ({
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
    </div>
  )
}

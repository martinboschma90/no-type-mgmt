import { useCallback, useEffect, useState } from 'react'
import { flushSync } from 'react-dom'
import { Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useCms } from '@/cms/CmsProvider'
import { artistSlugFromPath } from '@/cms/artistSlug'
import { artistEditorTabFromSearch } from '@/cms/artistEditorTabs'
import { withGenres } from '@/cms/artistGenres'
import { ArtistLayoutEditor } from '@/cms/editors/ArtistLayoutEditor'
import { ArtistVideosEditor, withSyncedVideos } from '@/cms/editors/ArtistVideosEditor'
import { ArtistVisibilityToggle } from '@/cms/editors/ArtistVisibilityToggle'
import { GenreTagsField } from '@/cms/editors/GenreTagsField'
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
  DEFAULT_INSTAGRAM_FEED,
  INSTAGRAM_FEED_COUNT,
  padInstagramPosts,
  parseInstagramPostUrl,
  withSyncedInstagramSocial,
} from '@/cms/artistInstagram'
import {
  isArtistSectionVisible,
  setArtistSectionVisible,
} from '@/cms/artistSections'
import { ArtistPublishBar } from '@/cms/editors/ArtistPublishBar'
import { CmsToast } from '@/cms/editors/CmsToast'
import { artistHasLocalMediaRefs } from '@/cms/artistLocalMedia'
import { normalizeArtistVideos } from '@/cms/artistVideos'
import { isArtistVisible } from '@/cms/artistVisibility'
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
  'w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-500 focus:ring-4 focus:ring-neutral-500/10'

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
  const [searchParams] = useSearchParams()
  const editorTab = artistEditorTabFromSearch(searchParams.get('tab'))
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
  const [toast, setToast] = useState<{
    message: string
    detail?: string
  } | null>(null)

  const dismissToast = useCallback(() => setToast(null), [])

  function showToast(message: string, detail?: string) {
    setToast({ message, detail })
  }

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
    const result = await saveArtist(slug)
    if (result.error) {
      showToast('Opslaan mislukt', result.error)
      return
    }
    showToast(
      'Opgeslagen ✓',
      new Date().toLocaleString('nl-BE', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }),
    )
  }

  async function handlePublish() {
    if (!artist || artistHasLocalMediaRefs(artist)) return
    const slug = commitSlug()
    if (!slug) return
    const result = await publishArtist(slug)
    if (result.error) {
      showToast('Publiceren mislukt', result.error)
      return
    }
    showToast(
      'Opgeslagen ✓',
      new Date().toLocaleString('nl-BE', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }),
    )
  }

  async function handleUnpublish() {
    if (!artist) return
    const result = await unpublishArtist(artist.slug)
    if (result.error) {
      showToast('Unpublish mislukt', result.error)
      return
    }
    showToast(
      'Opgeslagen ✓',
      new Date().toLocaleString('nl-BE', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }),
    )
  }

  const patchMusic = (patch: Partial<typeof music>) => {
    updateArtist(updateKey, (a) => ({
      ...a,
      music: { ...(a.music ?? DEFAULT_ARTIST_MUSIC), ...patch },
    }))
  }

  const musicSectionVisible = isArtistSectionVisible(artist, 'tracks')
  const instagramFeed = artist.instagramFeed ?? DEFAULT_INSTAGRAM_FEED
  const instagramPosts = padInstagramPosts(instagramFeed.posts)
  const instagramSocialUrl =
    socials.find((link) => link.platform === 'instagram')?.url ?? ''

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

  const patchInstagramFeed = (
    patch: Partial<typeof instagramFeed>,
    extra?: { socials?: typeof artist.socials },
  ) => {
    updateArtist(updateKey, (a) => ({
      ...a,
      ...extra,
      instagramFeed: { ...(a.instagramFeed ?? DEFAULT_INSTAGRAM_FEED), ...patch },
    }))
  }

  return (
    <div className="cms-artist-editor space-y-3">
      {toast ? (
        <CmsToast
          message={toast.message}
          detail={toast.detail}
          onDismiss={dismissToast}
        />
      ) : null}

      <div className="sticky top-[var(--cms-editor-sticky-top,0px)] z-20 -mx-4 -mt-4 mb-1 border-b border-ink/10 bg-[var(--body-bg)]/95 px-4 pt-4 pb-3 backdrop-blur-md sm:-mx-5 sm:px-5">
        <ArtistPublishBar
          artist={artist}
          dirty={dirty}
          saving={artistSaving}
          onSave={() => void handleSave()}
          onPublish={() => void handlePublish()}
          onUnpublish={() => void handleUnpublish()}
        />
      </div>

      {!isArtistVisible(artist) ? (
        <p className="rounded-xl border border-ink/10 bg-ink/5 px-3 py-2 type-body text-xs text-ink/50">
          Draft — niet op de homepage-roster en niet bereikbaar via /artists/
          {artist.slug} tot je publiceert.
        </p>
      ) : null}

      {editorTab === 'settings' ? (
        <>
        <EditorSection
          title="Publicatie"
          description="Draft blijft in het CMS. Published staat op de roster en op /artists/."
          defaultOpen
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="type-label text-[0.65rem] tracking-[0.14em] text-ink/45 uppercase">
              {isArtistVisible(artist) ? 'Published' : 'Draft'}
            </p>
            <ArtistVisibilityToggle
              visible={isArtistVisible(artist)}
              onChange={(visible) => {
                if (visible) void handlePublish()
                else void handleUnpublish()
              }}
            />
          </div>
        </EditorSection>
        <ArtistLayoutEditor
          artist={artist}
          onChange={(sections) => {
            updateArtist(updateKey, (a) => {
              const tracks = sections.find((s) => s.id === 'tracks')
              const musicVisible = tracks ? tracks.visible !== false : true
              const instagram = sections.find((s) => s.id === 'instagram')
              const instagramVisible = instagram
                ? instagram.visible !== false
                : true
              return {
                ...a,
                sections,
                music: {
                  ...(a.music ?? DEFAULT_ARTIST_MUSIC),
                  visible: musicVisible,
                },
                instagramFeed: {
                  ...(a.instagramFeed ?? DEFAULT_INSTAGRAM_FEED),
                  visible: instagramVisible,
                },
              }
            })
          }}
        />
        </>
      ) : null}

      {editorTab === 'content' ? (
        <ArtistVideosEditor
        videos={editableVideos}
        onChange={(videos) =>
          updateArtist(updateKey, (a) => ({
            ...a,
            ...withSyncedVideos(videos),
            sections: setArtistSectionVisible(a.sections, 'video', true),
          }))
        }
      />
      ) : null}

      {editorTab === 'instagram' ? (
      <EditorSection
        title="Instagram feed"
        description="Koppel tot 6 post- of reel-links. Zes tegels in een slide, zonder extra kader."
        defaultOpen
      >
        <TextInput
          label="Profiel-link"
          value={instagramFeed.profileUrl || instagramSocialUrl}
          placeholder="https://www.instagram.com/handle/"
          hint="Wordt ook als Instagram social op de pagina gebruikt."
          onChange={(profileUrl) =>
            patchInstagramFeed(
              { profileUrl },
              {
                socials: withSyncedInstagramSocial(artist.socials, profileUrl),
              },
            )
          }
        />
        <div className="space-y-3">
          <p className="type-label text-[0.65rem] tracking-[0.14em] text-ink/45 uppercase">
            Posts (max {INSTAGRAM_FEED_COUNT})
          </p>
          {instagramPosts.every((p) => !p.trim()) ? (
            <div className="rounded-2xl border border-dashed border-ink/15 px-4 py-6 text-center">
              <p className="text-sm font-semibold text-neutral-700">Nog geen Instagram-posts</p>
              <p className="type-body mt-1.5 text-xs text-ink/40">
                Paste post or reel URLs below — up to {INSTAGRAM_FEED_COUNT} tiles.
              </p>
            </div>
          ) : null}
          {instagramPosts.map((post, index) => {
            const parsed = parseInstagramPostUrl(post)
            const invalid = Boolean(post.trim()) && !parsed
            return (
              <Field
                key={`ig-post-${index}`}
                label={`Post ${index + 1}`}
                hint={
                  invalid
                    ? 'Plak een Instagram post- of reel-URL, bijvoorbeeld https://www.instagram.com/p/…'
                    : parsed
                      ? parsed.kind === 'reel'
                        ? 'Reel gekoppeld'
                        : 'Post gekoppeld'
                      : undefined
                }
              >
                <input
                  type="url"
                  className={slugControlClass}
                  value={post}
                  placeholder="https://www.instagram.com/p/… of /reel/…"
                  onChange={(e) => {
                    const posts = [...instagramPosts]
                    posts[index] = e.target.value
                    patchInstagramFeed({ posts })
                  }}
                />
              </Field>
            )
          })}
        </div>
      </EditorSection>
      ) : null}

      {editorTab === 'hero' ? (
      <>
      <EditorSection
        title="Foto"
        description="Portret voor de roster-card en de artiestenpagina."
        defaultOpen
        tabs={[
          {
            id: 'media',
            label: 'Media',
            children: (
                <MediaUrlField
                  label="Portretfoto"
                  kind="image"
                  value={artist.imageUrl}
                  onChange={(imageUrl) =>
                    updateArtist(updateKey, (a) => ({ ...a, imageUrl }))
                  }
                />
            ),
          },
          {
            id: 'settings',
            label: 'Uitsnede & alt-tekst',
            children: (
              <>
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
                <TextInput
                  label="Alt-tekst (toegankelijkheid)"
                  value={artist.imageAlt}
                  onChange={(imageAlt) =>
                    updateArtist(updateKey, (a) => ({ ...a, imageAlt }))
                  }
                />
              </>
            ),
          },
        ]}
      />
      <EditorSection
        title="Profielgegevens"
        description="Naam, bio, genres, presskit en sociale kanalen."
        defaultOpen
        tabs={[
          {
            id: 'content',
            label: 'Naam & bio',
            children: (
              <>
                <TextInput
                  label="Naam"
                  value={artist.name}
                  onChange={(name) => updateArtist(updateKey, (a) => ({ ...a, name }))}
                />
                <Field
                  label="URL-slug"
                  hint={
                    slugError
                      ? undefined
                      : `Live: /artists/${artist.slug} — wijziging geldt na Toepassen of als je het veld verlaat.`
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
                      className="cms-secondary-action shrink-0 rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                      onClick={() => commitSlug()}
                    >
                      Toepassen
                    </button>
                  </div>
                  {slugError ? (
                    <span className="mt-1.5 block text-xs text-red-500" role="alert">
                      {slugError}
                    </span>
                  ) : null}
                </Field>
                <GenreTagsField
                  value={artist.genres ?? (artist.genre ? [artist.genre] : [])}
                  onChange={(genres) =>
                    updateArtist(updateKey, (a) => ({ ...a, ...withGenres(genres) }))
                  }
                />
                <TextArea
                  label="Bio"
                  value={artist.bio ?? ''}
                  rows={6}
                  onChange={(bio) => updateArtist(updateKey, (a) => ({ ...a, bio }))}
                />
                <TextInput
                  label="Presskit-link"
                  value={artist.presskitUrl ?? ''}
                  placeholder="https://…"
                  hint="Boeking / presskit op de artiestenpagina."
                  onChange={(presskitUrl) =>
                    updateArtist(updateKey, (a) => ({ ...a, presskitUrl }))
                  }
                />
              </>
            ),
          },
          {
            id: 'settings',
            label: 'Socials',
            children: (
                <div className="space-y-3.5">

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
                          className="text-[11px] font-medium text-neutral-400 hover:text-red-500"
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
                        <span className="type-label mb-2 block text-[0.65rem] tracking-[0.14em] text-ink/45 uppercase">
                          Platform
                        </span>
                        <select
                          className="w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-900 outline-none focus:border-neutral-500 focus:ring-4 focus:ring-neutral-500/10"
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
                      className="cms-secondary-action flex-1 rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
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
                      className="cms-secondary-action flex-1 rounded-lg border border-neutral-200 bg-neutral-100 px-3.5 py-2.5 text-xs font-medium text-neutral-800 hover:bg-neutral-200"
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
            ),
          },
        ]}
      />
      </>
      ) : null}

      {editorTab === 'content' ? (
        <>
      <EditorSection
        title="Muziek"
        description="Koppel een SoundCloud-set of Spotify-track, album of playlist."
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
                      ? 'border-neutral-500 bg-neutral-100'
                      : 'border-neutral-200 bg-white hover:border-neutral-400',
                  ].join(' ')}
                >
                  <input
                    type="radio"
                    name={`music-platform-${artist.id}`}
                    className="mt-1 accent-neutral-700"
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
                    <span className="block text-sm font-semibold text-neutral-900">
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
          label="Titel boven de player"
          value={music.title}
          placeholder={
            music.platform === 'spotify' ? 'Latest Releases' : 'Latest Mix'
          }
          onChange={(title) => patchMusic({ title })}
        />
        <TextInput
          label="SoundCloud- of Spotify-link"
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
        title="Losse tracks"
        description="Oude handmatige tracklijst. Wordt alleen gebruikt als er geen embedlink staat."
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
                className="text-[11px] font-medium text-neutral-400 hover:text-red-500"
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
          className="cms-secondary-action w-full rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
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
        </>
      ) : null}

      {editorTab === 'settings' ? (
        <>
      <EditorSection
        title="Danger zone"
        description="Verwijderen haalt de artiest van roster en CMS. Dit kan niet ongedaan."
      >
        <button
          type="button"
          className="rounded-lg border border-red-500/25 px-3.5 py-2 text-xs font-medium text-red-500 transition-colors hover:bg-red-500/10"
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
      </EditorSection>
        </>
      ) : null}
    </div>
  )
}

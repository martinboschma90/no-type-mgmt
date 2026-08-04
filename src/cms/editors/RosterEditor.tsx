import { Link } from 'react-router-dom'
import { useCms } from '@/cms/CmsProvider'
import {
  artistHasLocalMediaRefs,
  LOCAL_MEDIA_PUBLISH_WARNING,
} from '@/cms/artistLocalMedia'
import { isArtistVisible } from '@/cms/artistVisibility'
import { ArtistVisibilityToggle } from '@/cms/editors/ArtistVisibilityToggle'
import { EditorSection, TextInput } from '@/cms/fields'
import { ImageFocusField } from '@/cms/editors/ImageFocusField'
import { ART_DIRECTION_VERSION, resolveArtDirection } from '@/cms/imageFocus'
import { MediaUrlField } from '@/cms/media/MediaUrlField'
import {
  ROSTER_GLOW_PRESETS,
  rosterGlowGradient,
  type RosterGlowPreset,
} from '@/cms/rosterGlow'

const layoutBtnClass =
  'type-label flex-1 rounded-xl border px-3 py-3 text-center text-[0.65rem] tracking-[0.12em] uppercase transition-colors'

export function RosterEditor() {
  const {
    content,
    setSite,
    setArtists,
    publishArtist,
    unpublishArtist,
    saveArtist,
    isArtistDirty,
  } = useCms()
  const { artists, site } = content
  const desktopColumns = site.rosterDesktopColumns === 3 ? 3 : 4
  const glowPreset = site.rosterGlowPreset ?? 'yellow'
  const glowPreview = rosterGlowGradient(glowPreset, site.rosterGlowCustom)

  return (
    <>
      <EditorSection
        title="Layout"
        description="Desktop roster density. Mobile and tablet stay unchanged."
        defaultOpen
        badge="Settings"
      >
        <div>
          <p className="type-label mb-2 text-[0.65rem] tracking-[0.14em] text-ink/45 uppercase">
            Artiesten per rij (desktop)
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              className={[
                layoutBtnClass,
                desktopColumns === 3
                  ? 'border-accent/45 bg-accent/15 text-ink'
                  : 'border-ink/12 text-ink/45 hover:border-ink/25 hover:text-ink',
              ].join(' ')}
              aria-pressed={desktopColumns === 3}
              onClick={() =>
                setSite((s) => ({ ...s, rosterDesktopColumns: 3 }))
              }
            >
              3 kolommen
            </button>
            <button
              type="button"
              className={[
                layoutBtnClass,
                desktopColumns === 4
                  ? 'border-accent/45 bg-accent/15 text-ink'
                  : 'border-ink/12 text-ink/45 hover:border-ink/25 hover:text-ink',
              ].join(' ')}
              aria-pressed={desktopColumns === 4}
              onClick={() =>
                setSite((s) => ({ ...s, rosterDesktopColumns: 4 }))
              }
            >
              4 kolommen
            </button>
          </div>
          <p className="type-body mt-2 text-xs text-ink/40">
            {desktopColumns === 3
              ? 'Desktop: 3 grotere cards per rij.'
              : 'Desktop: 4 compactere cards per rij.'}
          </p>
        </div>
      </EditorSection>

      <EditorSection
        title="Appearance"
        description="Hover glow on roster artist cards. Intensity and motion stay the same."
        defaultOpen
        badge="Settings"
      >
        <div>
          <p className="type-label mb-2 text-[0.65rem] tracking-[0.14em] text-ink/45 uppercase">
            Glow kleur
          </p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {ROSTER_GLOW_PRESETS.map((preset) => {
              const selected = glowPreset === preset.id
              const swatch =
                preset.id === 'custom'
                  ? site.rosterGlowCustom || preset.swatch
                  : preset.swatch
              return (
                <button
                  key={preset.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() =>
                    setSite((s) => ({
                      ...s,
                      rosterGlowPreset: preset.id as RosterGlowPreset,
                    }))
                  }
                  className={[
                    'flex flex-col items-center gap-1.5 rounded-xl border px-2 py-2.5 transition-colors',
                    selected
                      ? 'border-accent/45 bg-accent/15'
                      : 'border-ink/12 hover:border-ink/25',
                  ].join(' ')}
                >
                  <span
                    className="h-7 w-7 rounded-full border border-ink/15 shadow-inner"
                    style={{ background: swatch }}
                    aria-hidden
                  />
                  <span className="type-label text-[0.55rem] tracking-[0.1em] text-ink/55 uppercase">
                    {preset.label}
                  </span>
                </button>
              )
            })}
          </div>
          {glowPreset === 'custom' ? (
            <div className="mt-3 flex items-center gap-3">
              <input
                type="color"
                aria-label="Custom glow color"
                className="h-10 w-12 cursor-pointer rounded-lg border border-ink/12 bg-transparent p-1"
                value={
                  /^#[0-9a-f]{6}$/i.test(site.rosterGlowCustom)
                    ? site.rosterGlowCustom
                    : '#d8ff3e'
                }
                onChange={(e) =>
                  setSite((s) => ({ ...s, rosterGlowCustom: e.target.value }))
                }
              />
              <TextInput
                label="Hex"
                value={site.rosterGlowCustom}
                placeholder="#d8ff3e"
                onChange={(rosterGlowCustom) =>
                  setSite((s) => ({ ...s, rosterGlowCustom }))
                }
              />
            </div>
          ) : null}
          <div
            className="mt-3 h-10 overflow-hidden rounded-xl border border-ink/10"
            style={{
              background: glowPreview,
              backgroundSize: '300% 100%',
            }}
            aria-hidden
          />
          <p className="type-body mt-2 text-xs text-ink/40">
            Geel is de standaard No Type glow. Alleen de kleur wijzigt.
          </p>
        </div>
      </EditorSection>

      {artists.map((artist, index) => {
        const art = resolveArtDirection(artist)
        return (
        <EditorSection
          key={artist.id}
          title={artist.name}
          description={
            isArtistVisible(artist)
              ? artist.genre || 'Artist on homepage roster'
              : 'Draft — verborgen op publieke site'
          }
          defaultOpen={index === 0}
          badge={isArtistVisible(artist) ? 'Published' : 'Draft'}
          tabs={[
            {
              id: 'content',
              label: 'Content',
              children: (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <ArtistVisibilityToggle
                      visible={isArtistVisible(artist)}
                      onChange={(visible) => {
                        if (visible && artistHasLocalMediaRefs(artist)) {
                          window.alert(LOCAL_MEDIA_PUBLISH_WARNING)
                          return
                        }
                        void (visible
                          ? publishArtist(artist.slug)
                          : unpublishArtist(artist.slug))
                      }}
                    />
                    {artistHasLocalMediaRefs(artist) ? (
                      <p className="type-body w-full text-xs text-red-400">
                        {LOCAL_MEDIA_PUBLISH_WARNING}
                      </p>
                    ) : null}
                    <Link
                      to={`/cms/artists/${artist.slug}`}
                      className="type-label text-[0.65rem] tracking-[0.12em] text-brand uppercase transition-opacity hover:opacity-70"
                    >
                      Bewerk artiestenpagina →
                    </Link>
                  </div>
                  {isArtistDirty(artist.id) ? (
                    <button
                      type="button"
                      className="type-label w-full rounded-full border border-ink/15 px-4 py-2.5 text-[0.65rem] tracking-[0.12em] text-ink/70 uppercase transition-colors hover:border-ink/30 hover:text-ink"
                      onClick={() => void saveArtist(artist.slug)}
                    >
                      Save changes
                    </button>
                  ) : null}
                  <TextInput
                    label="Name"
                    value={artist.name}
                    onChange={(name) =>
                      setArtists((list) =>
                        list.map((a, i) => (i === index ? { ...a, name } : a)),
                      )
                    }
                  />
                  <TextInput
                    label="Genre"
                    value={artist.genre ?? ''}
                    onChange={(genre) =>
                      setArtists((list) =>
                        list.map((a, i) => (i === index ? { ...a, genre } : a)),
                      )
                    }
                  />
                  <TextInput
                    label="Image alt"
                    value={artist.imageAlt}
                    onChange={(imageAlt) =>
                      setArtists((list) =>
                        list.map((a, i) => (i === index ? { ...a, imageAlt } : a)),
                      )
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
                    label="Portrait"
                    kind="image"
                    value={artist.imageUrl}
                    onChange={(imageUrl) =>
                      setArtists((list) =>
                        list.map((a, i) => (i === index ? { ...a, imageUrl } : a)),
                      )
                    }
                  />
                  <ImageFocusField
                    imageUrl={artist.imageUrl}
                    imageAlt={artist.imageAlt}
                    x={art.x}
                    y={art.y}
                    scale={art.scale}
                    onChange={({ x, y, scale }) =>
                      setArtists((list) =>
                        list.map((a, i) =>
                          i === index
                            ? {
                                ...a,
                                imageFocusX: x,
                                imageFocusY: y,
                                imageScale: scale,
                                imageFocus: `${Math.round(x)}% ${Math.round(y)}%`,
                                artDirectionVersion: ART_DIRECTION_VERSION,
                              }
                            : a,
                        ),
                      )
                    }
                  />
                </>
              ),
            },
          ]}
        />
        )
      })}
    </>
  )
}

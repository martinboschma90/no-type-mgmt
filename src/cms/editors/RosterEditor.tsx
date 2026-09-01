import { Link } from 'react-router-dom'
import { useCms } from '@/cms/CmsProvider'
import {
  artistHasLocalMediaRefs,
  LOCAL_MEDIA_PUBLISH_WARNING,
} from '@/cms/artistLocalMedia'
import { isArtistVisible } from '@/cms/artistVisibility'
import { ArtistVisibilityToggle } from '@/cms/editors/ArtistVisibilityToggle'
import { EditorSection, TextInput } from '@/cms/fields'
import { GenreTagsField } from '@/cms/editors/GenreTagsField'
import { artistGenres, withGenres } from '@/cms/artistGenres'
import { ImageFocusField } from '@/cms/editors/ImageFocusField'
import { ART_DIRECTION_VERSION, resolveArtDirection } from '@/cms/imageFocus'
import { MediaUrlField } from '@/cms/media/MediaUrlField'
import {
  DEFAULT_ROSTER_GLOW_CUSTOM,
  DEFAULT_ROSTER_GLOW_PRESET,
  DEFAULT_ROSTER_GLOW_SECONDARY,
  ROSTER_GLOW_PRESETS,
  glowPresetBaseHex,
  rosterGlowGradient,
  type RosterGlowPreset,
} from '@/cms/rosterGlow'

const layoutBtnClass =
  'flex-1 rounded-lg border px-3 py-2.5 text-center text-xs font-medium transition-colors'

function GlowSwatchPicker({
  label,
  badge,
  selected,
  customHex,
  onSelect,
  onCustomHex,
}: {
  label: string
  badge: '1' | '2'
  selected: RosterGlowPreset
  customHex: string
  onSelect: (preset: RosterGlowPreset) => void
  onCustomHex: (hex: string) => void
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1.5">
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-neutral-900 text-[9px] font-semibold text-white">
          {badge}
        </span>
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-neutral-500">
          {label}
        </p>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {ROSTER_GLOW_PRESETS.map((preset) => {
          const active = selected === preset.id
          const swatch =
            preset.id === 'custom'
              ? customHex || preset.swatch
              : preset.swatch
          return (
            <button
              key={`${badge}-${preset.id}`}
              type="button"
              aria-pressed={active}
              aria-label={`${label}: ${preset.label}`}
              onClick={() => onSelect(preset.id)}
              className={[
                'relative flex min-w-0 flex-col items-center gap-1 rounded-lg border px-1 py-1.5 transition-colors',
                active
                  ? 'border-neutral-500 bg-neutral-100'
                  : 'border-neutral-200 hover:border-neutral-400',
              ].join(' ')}
            >
              {active ? (
                <span className="absolute top-1 right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-neutral-900 text-[8px] font-semibold text-white">
                  {badge}
                </span>
              ) : null}
              <span
                className="h-5 w-5 rounded-full border border-neutral-300 shadow-inner"
                style={{ background: swatch }}
                aria-hidden
              />
              <span className="max-w-full truncate text-[8px] font-semibold uppercase tracking-[0.06em] text-neutral-500">
                {preset.label}
              </span>
            </button>
          )
        })}
      </div>
      {selected === 'custom' ? (
        <div className="mt-2 flex items-end gap-2">
          <input
            type="color"
            aria-label={`${label} custom color`}
            className="h-8 w-9 cursor-pointer rounded-lg border border-neutral-200 bg-transparent p-1"
            value={
              /^#[0-9a-f]{6}$/i.test(customHex) ? customHex : '#d8ff3e'
            }
            onChange={(e) => onCustomHex(e.target.value)}
          />
          <TextInput
            label="Hex"
            value={customHex}
            placeholder="#d8ff3e"
            onChange={onCustomHex}
          />
        </div>
      ) : null}
    </div>
  )
}

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
  const glowPrimary = site.rosterGlowPreset ?? DEFAULT_ROSTER_GLOW_PRESET
  const glowSecondary =
    site.rosterGlowSecondary ?? DEFAULT_ROSTER_GLOW_SECONDARY
  const glowCustomPrimary =
    site.rosterGlowCustom || DEFAULT_ROSTER_GLOW_CUSTOM
  const glowCustomSecondary =
    site.rosterGlowCustomSecondary ||
    glowPresetBaseHex(DEFAULT_ROSTER_GLOW_SECONDARY)
  const glowPreview = rosterGlowGradient(
    glowPrimary,
    glowCustomPrimary,
    glowSecondary,
    glowCustomSecondary,
  )

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
                  ? 'border-neutral-900 bg-neutral-900 text-white'
                  : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400',
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
                  ? 'border-neutral-900 bg-neutral-900 text-white'
                  : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400',
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
        title="Kaartgloed"
        description="Kies twee kleuren voor de hovergloed van rosterkaarten."
        defaultOpen
        badge="Stijl"
      >
        <div className="grid grid-cols-2 gap-3">
          <GlowSwatchPicker
            label="Primary glow"
            badge="1"
            selected={glowPrimary}
            customHex={glowCustomPrimary}
            onSelect={(rosterGlowPreset) =>
              setSite((s) => ({ ...s, rosterGlowPreset }))
            }
            onCustomHex={(rosterGlowCustom) =>
              setSite((s) => ({ ...s, rosterGlowCustom }))
            }
          />
          <GlowSwatchPicker
            label="Secondary glow"
            badge="2"
            selected={glowSecondary}
            customHex={glowCustomSecondary}
            onSelect={(rosterGlowSecondary) =>
              setSite((s) => ({ ...s, rosterGlowSecondary }))
            }
            onCustomHex={(rosterGlowCustomSecondary) =>
              setSite((s) => ({ ...s, rosterGlowCustomSecondary }))
            }
          />
          <div className="col-span-2">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-neutral-500">
              Voorvertoning
            </p>
            <div
              className="h-5 overflow-hidden rounded-lg border border-neutral-200"
              style={{
                background: glowPreview,
                backgroundSize: '300% 100%',
              }}
              aria-hidden
            />
            <p className="mt-1.5 text-[10px] text-neutral-500">
              Standaard: geel + roze. Beide kleuren zijn apart te wijzigen.
            </p>
          </div>
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
              ? artistGenres(artist).join(' · ') || 'Artist on homepage roster'
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
                      className="text-xs font-medium text-neutral-600 transition-colors hover:text-neutral-900"
                    >
                      Bewerk artiestenpagina →
                    </Link>
                  </div>
                  {isArtistDirty(artist.id) ? (
                    <button
                      type="button"
                      className="cms-primary-action w-full rounded-lg bg-neutral-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-neutral-800"
                      onClick={() => void saveArtist(artist.slug)}
                    >
                      Wijzigingen opslaan
                    </button>
                  ) : null}
                  <TextInput
                    label="Naam"
                    value={artist.name}
                    onChange={(name) =>
                      setArtists((list) =>
                        list.map((a, i) => (i === index ? { ...a, name } : a)),
                      )
                    }
                  />
                  <GenreTagsField
                    value={artist.genres ?? (artist.genre ? [artist.genre] : [])}
                    onChange={(genres) =>
                      setArtists((list) =>
                        list.map((a, i) =>
                          i === index ? { ...a, ...withGenres(genres) } : a,
                        ),
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

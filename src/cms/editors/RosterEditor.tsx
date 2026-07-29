import { Link } from 'react-router-dom'
import { useCms } from '@/cms/CmsProvider'
import { isArtistVisible } from '@/cms/artistVisibility'
import { ArtistVisibilityToggle } from '@/cms/editors/ArtistVisibilityToggle'
import { EditorSection, TextInput } from '@/cms/fields'
import { ImageFocusField } from '@/cms/editors/ImageFocusField'
import { ART_DIRECTION_VERSION, resolveArtDirection } from '@/cms/imageFocus'
import { MediaUrlField } from '@/cms/media/MediaUrlField'

export function RosterEditor() {
  const { content, setArtists, publishArtist, unpublishArtist, saveArtist, isArtistDirty } =
    useCms()
  const { artists } = content

  return (
    <>
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
                        void (visible
                          ? publishArtist(artist.slug)
                          : unpublishArtist(artist.slug))
                      }}
                    />
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

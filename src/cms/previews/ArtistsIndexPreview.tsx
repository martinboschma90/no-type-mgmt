import { ArtistCard } from '@/components/artists/ArtistCard'
import { useCms } from '@/cms/CmsProvider'
import { isArtistVisible, visibleArtists } from '@/cms/artistVisibility'
import { PreviewFrame } from '@/cms/previews/PreviewFrame'

export function ArtistsIndexPreview() {
  const { content } = useCms()
  const publicCount = visibleArtists(content.artists).length

  return (
    <PreviewFrame label="Artist pages">
      <div className="space-y-6 px-6 py-10 sm:px-8">
        <div>
          <p className="type-label text-[0.65rem] tracking-[0.16em] text-ink/40 uppercase">
            Roster pages
          </p>
          <h3 className="type-display mt-2 text-[clamp(1.6rem,4vw,2.4rem)] text-ink">
            Artists
          </h3>
          <p className="type-body mt-2 max-w-md text-sm text-ink/50">
            {publicCount} zichtbaar op de site · {content.artists.length - publicCount}{' '}
            verborgen
          </p>
        </div>

        <div className="grid grid-cols-2 items-start gap-3 sm:grid-cols-3 sm:gap-4">
          {content.artists.slice(0, 6).map((artist, index) => (
            <div
              key={artist.id}
              className={isArtistVisible(artist) ? undefined : 'opacity-40'}
            >
              <ArtistCard artist={artist} index={index} />
            </div>
          ))}
        </div>
      </div>
    </PreviewFrame>
  )
}

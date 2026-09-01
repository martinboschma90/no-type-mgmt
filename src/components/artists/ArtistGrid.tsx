import { ArtistCard } from '@/components/artists/ArtistCard'
import { useCms } from '@/cms/CmsContext'
import type { Artist } from '@/types/artist'

type ArtistGridProps = {
  artists: Artist[]
}

export function ArtistGrid({ artists }: ArtistGridProps) {
  const { content } = useCms()
  const desktopColumns = content.site.rosterDesktopColumns === 3 ? 3 : 4

  return (
    <div
      className={[
        'grid grid-cols-2 items-start gap-3 sm:gap-4 md:grid-cols-3',
        desktopColumns === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4',
      ].join(' ')}
    >
      {artists.length > 0
        ? artists.map((artist, index) => (
            <ArtistCard key={artist.id} artist={artist} index={index} />
          ))
        : Array.from({ length: 8 }, (_, index) => (
            <div
              key={`roster-skel-${index}`}
              className="w-full rounded-[1.5rem] bg-[#151217]"
              style={{ aspectRatio: '3 / 4' }}
              aria-hidden
            />
          ))}
    </div>
  )
}

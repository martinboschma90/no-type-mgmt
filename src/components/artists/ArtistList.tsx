import { Link } from 'react-router-dom'
import type { Artist } from '@/types/artist'
import { portraitImageStyle } from '@/cms/imageFocus'
import { useArtistImageUrl } from '@/cms/media/useArtistImageUrl'
import { OptimizedImg } from '@/components/ui/OptimizedImg'
import { prefetchRoute } from '@/lib/prefetchRoute'

type ArtistListProps = {
  artists: Artist[]
}

function ArtistListRow({ artist }: { artist: Artist }) {
  const imageUrl = useArtistImageUrl(artist)
  const frame = portraitImageStyle(artist)
  const href = `/artists/${artist.slug}`

  return (
    <Link
      to={href}
      onPointerEnter={() => prefetchRoute(href)}
      onFocus={() => prefetchRoute(href)}
      className="flex items-center gap-3 rounded-2xl py-1.5 transition-opacity hover:opacity-70"
    >
      <span
        className="relative h-14 w-11 shrink-0 overflow-hidden rounded-xl bg-[#151217]"
        aria-hidden
      >
        {imageUrl ? (
          <OptimizedImg
            src={imageUrl}
            alt=""
            className="absolute inset-0 object-cover"
            style={frame}
            size="card"
            sizes="44px"
            loading="lazy"
            decoding="async"
            draggable={false}
          />
        ) : null}
      </span>
      <span className="type-headline text-[clamp(1.15rem,2vw,1.45rem)] text-ink">
        {artist.name}
      </span>
    </Link>
  )
}

export function ArtistList({ artists }: ArtistListProps) {
  return (
    <ul className="grid list-none grid-cols-1 gap-x-10 gap-y-1 p-0 sm:grid-cols-2 lg:grid-cols-3">
      {artists.map((artist) => (
        <li key={artist.id}>
          <ArtistListRow artist={artist} />
        </li>
      ))}
    </ul>
  )
}

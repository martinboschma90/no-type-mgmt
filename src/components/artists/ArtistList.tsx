import { Link } from 'react-router-dom'
import type { Artist } from '@/types/artist'
import { prefetchRoute } from '@/lib/prefetchRoute'

type ArtistListProps = {
  artists: Artist[]
}

export function ArtistList({ artists }: ArtistListProps) {
  return (
    <ul className="grid list-none grid-cols-1 gap-x-12 gap-y-1 p-0 sm:grid-cols-2 lg:grid-cols-3">
      {artists.map((artist) => {
        const href = `/artists/${artist.slug}`
        return (
          <li key={artist.id}>
            <Link
              to={href}
              onPointerEnter={() => prefetchRoute(href)}
              onFocus={() => prefetchRoute(href)}
              className="type-headline block py-2 text-[clamp(1.35rem,2.4vw,1.85rem)] text-ink transition-opacity hover:opacity-55"
            >
              {artist.name}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { Artist } from '@/types/artist'

type ArtistListProps = {
  artists: Artist[]
}

export function ArtistList({ artists }: ArtistListProps) {
  return (
    <motion.ul
      className="grid list-none grid-cols-1 gap-x-10 gap-y-2 p-0 sm:grid-cols-2 lg:grid-cols-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      {artists.map((artist, index) => (
        <motion.li
          key={artist.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: Math.min(index * 0.015, 0.4),
            duration: 0.3,
          }}
        >
          <Link
            to={`/artists/${artist.slug}`}
            className="type-headline block text-[clamp(1.15rem,2vw,1.45rem)] text-ink transition-opacity hover:opacity-45"
          >
            {artist.name}
          </Link>
        </motion.li>
      ))}
    </motion.ul>
  )
}

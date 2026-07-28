import { motion } from 'framer-motion'
import { ArtistCard } from '@/components/artists/ArtistCard'
import type { Artist } from '@/types/artist'

type ArtistGridProps = {
  artists: Artist[]
}

export function ArtistGrid({ artists }: ArtistGridProps) {
  return (
    <motion.div
      className="grid grid-cols-2 items-start gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      {artists.map((artist, index) => (
        <ArtistCard key={artist.id} artist={artist} index={index} />
      ))}
    </motion.div>
  )
}

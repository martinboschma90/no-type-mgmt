import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ViewToggle } from '@/components/artists/ViewToggle'
import { ArtistGrid } from '@/components/artists/ArtistGrid'
import { ArtistList } from '@/components/artists/ArtistList'
import type { Artist, ViewMode } from '@/types/artist'

type ArtistRosterProps = {
  artists: Artist[]
}

export function ArtistRoster({ artists }: ArtistRosterProps) {
  const [view, setView] = useState<ViewMode>('grid')

  return (
    <section
      className="relative px-4 pb-20 pt-1 sm:px-6 lg:px-8 lg:pb-28"
      aria-label="Artists"
    >
      <div className="mx-auto max-w-[1600px]">
        <motion.div
          className="mb-5 flex items-center justify-between sm:mb-6"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          <ViewToggle value={view} onChange={setView} />
        </motion.div>

        <AnimatePresence mode="wait">
          {view === 'grid' ? (
            <motion.div
              key="grid"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
            >
              <ArtistGrid artists={artists} />
            </motion.div>
          ) : (
            <motion.div
              key="list"
              className="min-h-[40vh] pt-4"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
            >
              <ArtistList artists={artists} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}

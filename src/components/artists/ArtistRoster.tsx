import { useState } from 'react'
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
        <div className="mb-5 flex items-center justify-between sm:mb-6">
          <ViewToggle value={view} onChange={setView} />
        </div>
        {view === 'grid' ? (
          <ArtistGrid artists={artists} />
        ) : (
          <div className="min-h-[40vh] pt-4">
            <ArtistList artists={artists} />
          </div>
        )}
      </div>
    </section>
  )
}

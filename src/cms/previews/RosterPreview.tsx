import { ArtistRoster } from '@/components/artists/ArtistRoster'
import { useCms } from '@/cms/CmsProvider'
import { visibleArtists } from '@/cms/artistVisibility'
import { PreviewFrame } from '@/cms/previews/PreviewFrame'

export function RosterPreview() {
  const { content } = useCms()

  return (
    <PreviewFrame label="Roster">
      <div className="px-4 pt-10 sm:px-6 lg:px-8">
        <p className="type-label mb-6 text-ink/40">Homepage artist roster</p>
        <ArtistRoster artists={visibleArtists(content.artists)} />
      </div>
    </PreviewFrame>
  )
}

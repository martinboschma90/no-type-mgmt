import { Hero } from '@/components/hero/Hero'
import { ArtistRoster } from '@/components/artists/ArtistRoster'
import { useCms } from '@/cms/CmsProvider'
import { visibleArtists } from '@/cms/artistVisibility'
import { PreviewFrame } from '@/cms/previews/PreviewFrame'

export function HomePreview() {
  const { content } = useCms()

  return (
    <PreviewFrame label="Home">
      <div className="px-4 pt-8 sm:px-6 lg:px-8">
        <Hero />
        <ArtistRoster artists={visibleArtists(content.artists)} />
      </div>
    </PreviewFrame>
  )
}

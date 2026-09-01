import { ArtistRoster } from '@/components/artists/ArtistRoster'
import { Hero } from '@/components/hero/Hero'
import { AppShell } from '@/components/layout/AppShell'
import { useCms } from '@/cms/CmsProvider'
import { visibleArtists } from '@/cms/artistVisibility'
import { PreviewFrame } from '@/cms/previews/PreviewFrame'

export function RosterPreview() {
  const { content } = useCms()

  return (
    <PreviewFrame label="Roster">
      <AppShell navVariant={content.site.homeHeroVisible !== false ? 'hero' : 'wordmark'}>
        {content.site.homeHeroVisible !== false ? <Hero /> : null}
        <ArtistRoster artists={visibleArtists(content.artists)} />
      </AppShell>
    </PreviewFrame>
  )
}

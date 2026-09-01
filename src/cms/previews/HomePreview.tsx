import { Hero } from '@/components/hero/Hero'
import { ArtistRoster } from '@/components/artists/ArtistRoster'
import { AppShell } from '@/components/layout/AppShell'
import { useCms } from '@/cms/CmsProvider'
import { visibleArtists } from '@/cms/artistVisibility'
import { PreviewFrame } from '@/cms/previews/PreviewFrame'

export function HomePreview() {
  const { content } = useCms()

  return (
    <PreviewFrame label="Home">
      <AppShell navVariant={content.site.homeHeroVisible !== false ? 'hero' : 'wordmark'}>
        {content.site.homeHeroVisible !== false ? <Hero /> : null}
        <ArtistRoster artists={visibleArtists(content.artists)} />
      </AppShell>
    </PreviewFrame>
  )
}

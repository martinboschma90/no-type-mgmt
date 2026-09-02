import { AppShell } from '@/components/layout/AppShell'
import { Hero } from '@/components/hero/Hero'
import { ArtistRoster } from '@/components/artists/ArtistRoster'
import { usePublicArtists } from '@/cms/usePublicArtists'
import { useCms } from '@/cms/CmsContext'
import { prefetchRoute } from '@/lib/prefetchRoute'
import { useEffect } from 'react'

export function HomePage() {
  const { artists } = usePublicArtists()
  const { content } = useCms()
  const heroVisible = content.site.homeHeroVisible !== false

  useEffect(() => {
    const timer = window.setTimeout(() => prefetchRoute('/artists/_'), 800)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <AppShell navVariant={heroVisible ? 'hero' : 'wordmark'}>
      {heroVisible ? <Hero /> : null}
      <ArtistRoster artists={artists} />
    </AppShell>
  )
}

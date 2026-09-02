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
    const warm = () => {
      prefetchRoute('/artists/_')
      prefetchRoute('/about')
      prefetchRoute('/contact')
      prefetchRoute('/booking')
    }
    const idle = (
      window as Window & {
        requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number
      }
    ).requestIdleCallback
    if (idle) {
      const id = idle(warm, { timeout: 700 })
      return () =>
        (
          window as Window & { cancelIdleCallback?: (id: number) => void }
        ).cancelIdleCallback?.(id)
    }
    const timer = window.setTimeout(warm, 500)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <AppShell navVariant={heroVisible ? 'hero' : 'wordmark'}>
      {heroVisible ? <Hero /> : null}
      <ArtistRoster artists={artists} />
    </AppShell>
  )
}

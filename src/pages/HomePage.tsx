import { useEffect, useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { Hero } from '@/components/hero/Hero'
import { ArtistRoster } from '@/components/artists/ArtistRoster'
import { usePublicArtists } from '@/cms/usePublicArtists'
import { useCms } from '@/cms/CmsContext'

export function HomePage() {
  const { artists } = usePublicArtists()
  const { content } = useCms()
  const heroVisible = content.site.homeHeroVisible !== false
  const [navVariant, setNavVariant] = useState<'hero' | 'mark'>('hero')

  useEffect(() => {
    const onScroll = () => {
      setNavVariant(window.scrollY > 280 ? 'mark' : 'hero')
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <AppShell navVariant={heroVisible ? navVariant : 'wordmark'}>
      {heroVisible ? <Hero /> : null}
      <ArtistRoster artists={artists} />
    </AppShell>
  )
}

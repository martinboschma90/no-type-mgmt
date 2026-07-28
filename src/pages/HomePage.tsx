import { useEffect, useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { Hero } from '@/components/hero/Hero'
import { ArtistRoster } from '@/components/artists/ArtistRoster'
import { useCms } from '@/cms/CmsProvider'
import { visibleArtists } from '@/cms/artistVisibility'

export function HomePage() {
  const { content } = useCms()
  const [navVariant, setNavVariant] = useState<'hero' | 'mark'>('hero')
  const artists = visibleArtists(content.artists)

  useEffect(() => {
    const onScroll = () => {
      setNavVariant(window.scrollY > 280 ? 'mark' : 'hero')
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <AppShell navVariant={navVariant}>
      <Hero />
      <ArtistRoster artists={artists} />
    </AppShell>
  )
}

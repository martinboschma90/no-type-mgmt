import { useEffect, useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { Hero } from '@/components/hero/Hero'
import { ArtistRoster } from '@/components/artists/ArtistRoster'
import { usePublicArtists } from '@/cms/usePublicArtists'

export function HomePage() {
  const { artists, ready } = usePublicArtists()
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
    <AppShell navVariant={navVariant}>
      <Hero />
      {ready ? (
        <ArtistRoster artists={artists} />
      ) : (
        <section
          className="relative min-h-[50vh] px-4 pb-20 pt-1 sm:px-6 lg:px-8"
          aria-busy="true"
          aria-label="Artists loading"
        />
      )}
    </AppShell>
  )
}

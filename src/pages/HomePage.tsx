import { lazy, Suspense, useEffect, useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { Hero } from '@/components/hero/Hero'
import { usePublicArtists } from '@/cms/usePublicArtists'

const ArtistRoster = lazy(() =>
  import('@/components/artists/ArtistRoster').then((m) => ({
    default: m.ArtistRoster,
  })),
)

export function HomePage() {
  const { artists } = usePublicArtists()
  const [navVariant, setNavVariant] = useState<'hero' | 'mark'>('hero')

  useEffect(() => {
    const onScroll = () => {
      setNavVariant(window.scrollY > 280 ? 'mark' : 'hero')
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const warm = () => {
      void import('@/components/artists/ArtistRoster')
    }
    const ric = window.requestIdleCallback
    if (typeof ric === 'function') {
      const id = ric.call(window, warm, { timeout: 1200 })
      return () => window.cancelIdleCallback(id)
    }
    const t = window.setTimeout(warm, 200)
    return () => window.clearTimeout(t)
  }, [])

  return (
    <AppShell navVariant={navVariant}>
      <Hero />
      <Suspense
        fallback={
          <section className="relative min-h-[40vh]" aria-busy="true" />
        }
      >
        <ArtistRoster artists={artists} />
      </Suspense>
    </AppShell>
  )
}

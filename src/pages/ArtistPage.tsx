import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { ArtistPageSections } from '@/components/artists/ArtistPageSections'
import { usePublicArtist } from '@/cms/usePublicArtists'

export function ArtistPage() {
  const { slug = '' } = useParams()
  const { artist: publicArtist, checkingRemote } = usePublicArtist(slug)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [slug])

  if (!publicArtist && checkingRemote) {
    return (
      <AppShell navVariant="wordmark">
        <div className="min-h-[60vh]" aria-busy="true" />
      </AppShell>
    )
  }

  if (!publicArtist) {
    return (
      <AppShell navVariant="wordmark">
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
          <h1 className="type-display text-[clamp(2.5rem,7vw,4.5rem)] text-ink">
            Artist not found
          </h1>
          <Link
            to="/"
            className="type-ui mt-6 rounded-full bg-ink px-5 py-2.5 text-xs text-ink-inverse"
          >
            Back to roster
          </Link>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell navVariant="wordmark">
      <ArtistPageSections artist={publicArtist} />
    </AppShell>
  )
}

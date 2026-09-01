import { useLocation, useSearchParams } from 'react-router-dom'
import { ArtistPageSections } from '@/components/artists/ArtistPageSections'
import { RelatedArtists } from '@/components/artists/RelatedArtists'
import { AppShell } from '@/components/layout/AppShell'
import { useCms } from '@/cms/CmsProvider'
import { artistSlugFromPath } from '@/cms/artistSlug'
import { artistEditorTabFromSearch } from '@/cms/artistEditorTabs'
import { PreviewFrame } from '@/cms/previews/PreviewFrame'

export function ArtistPreview() {
  const { pathname } = useLocation()
  const [searchParams] = useSearchParams()
  const slug = artistSlugFromPath(pathname) ?? ''
  const { getArtistBySlug, content } = useCms()
  const artist = getArtistBySlug(slug)
  const tab = artistEditorTabFromSearch(searchParams.get('tab'))
  const previewFocus =
    tab === 'content' ? 'video' : tab === 'instagram' ? 'instagram' : 'hero'

  if (!artist) {
    return (
      <PreviewFrame label="Artist">
        <div className="flex min-h-[40vh] items-center justify-center px-6">
          <p className="type-body text-ink/50">Artist not found</p>
        </div>
      </PreviewFrame>
    )
  }

  return (
    <PreviewFrame
      label={artist.name}
      scrollToId={
        previewFocus === 'video'
          ? 'artist-visuals'
          : previewFocus === 'instagram'
            ? 'artist-instagram'
            : undefined
      }
    >
      <AppShell navVariant="wordmark">
        <ArtistPageSections
          artist={artist}
          previewMode
          previewFocus={previewFocus}
        />
        <RelatedArtists artist={artist} artists={content.artists} />
      </AppShell>
    </PreviewFrame>
  )
}

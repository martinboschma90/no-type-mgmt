import { useLocation } from 'react-router-dom'
import { ArtistPageSections } from '@/components/artists/ArtistPageSections'
import { useCms } from '@/cms/CmsProvider'
import { artistSlugFromPath } from '@/cms/artistSlug'
import { PreviewFrame } from '@/cms/previews/PreviewFrame'

export function ArtistPreview() {
  const { pathname } = useLocation()
  const slug = artistSlugFromPath(pathname) ?? ''
  const { getArtistBySlug } = useCms()
  const artist = getArtistBySlug(slug)

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
    <PreviewFrame label={artist.name}>
      <ArtistPageSections artist={artist} previewMode />
    </PreviewFrame>
  )
}

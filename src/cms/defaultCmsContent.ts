import { artists as defaultArtists } from '@/data/artists'
import { getArtistBySlug } from '@/data/artistDetails'
import { team as defaultTeam } from '@/data/site'
import { withArtDirection } from '@/cms/imageFocus'
import { createDefaultSiteContent, type CmsContent } from '@/cms/content'

/** Seed roster for CMS reset / scripts — keep out of the public homepage bundle. */
export function createDefaultContent(): CmsContent {
  const artists = defaultArtists.map((artist) => {
    const full = getArtistBySlug(artist.slug)
    const base = withArtDirection(full ?? { ...artist })
    return {
      ...base,
      status: 'published' as const,
      visible: true,
      publishedAt: base.publishedAt ?? new Date().toISOString(),
    }
  })

  return {
    site: createDefaultSiteContent(),
    team: defaultTeam.map((member) => ({ ...member })),
    artists,
  }
}

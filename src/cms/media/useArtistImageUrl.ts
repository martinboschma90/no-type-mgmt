import type { Artist } from '@/types/artist'
import { getSeedImageUrl } from '@/cms/media/publicMedia'
import { useResolvedMediaUrl } from '@/cms/media/useResolvedMediaUrl'

/**
 * Artist portrait URL for public + CMS UI.
 * Resolves media:// via library/Storage, then falls back to seed http image.
 */
export function useArtistImageUrl(
  artist: Pick<Artist, 'slug' | 'imageUrl'>,
): string {
  return useResolvedMediaUrl(artist.imageUrl, getSeedImageUrl(artist.slug))
}

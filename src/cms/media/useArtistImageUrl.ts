import type { Artist } from '@/types/artist'
import { getRosterImageUrl } from '@/data/artists'
import { useResolvedMediaUrl } from '@/cms/media/useResolvedMediaUrl'

export function useArtistImageUrl(
  artist: Pick<Artist, 'slug' | 'imageUrl'>,
): string {
  return useResolvedMediaUrl(artist.imageUrl, getRosterImageUrl(artist.slug))
}

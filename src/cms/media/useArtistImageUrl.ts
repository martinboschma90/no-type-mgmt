import type { Artist } from '@/types/artist'
import { useResolvedMediaUrl } from '@/cms/media/useResolvedMediaUrl'

export function useArtistImageUrl(
  artist: Pick<Artist, 'imageUrl'>,
): string {
  return useResolvedMediaUrl(artist.imageUrl)
}

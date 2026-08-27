import {
  parsePublicArtistsPayload,
} from '@/cms/api/publicArtistsFormat'
import {
  PUBLIC_ARTISTS_STORAGE_KEY,
  PUBLIC_ARTISTS_STORAGE_KEY_V2,
} from '@/cms/storageKeys'
import { withArtDirection } from '@/cms/imageFocus'
import { restGet } from '@/lib/publicRest'
import type { Artist } from '@/types/artist'

export type CmsContentRow = {
  key: string
  data: unknown
  updated_at: string
}

export type CmsArtistRow = {
  id: string
  slug: string
  data: unknown
  updated_at: string
}

function parseArtist(data: unknown, fallbackSlug: string): Artist | null {
  if (!data || typeof data !== 'object') return null
  const artist = data as Artist
  if (!artist.name) return null
  return withArtDirection({
    ...artist,
    slug: artist.slug || fallbackSlug,
  })
}

async function fetchPublicCmsArtistsByKey(
  key: string,
): Promise<Artist[] | null> {
  const data = await restGet<CmsContentRow[]>(
    `cms_content?key=eq.${encodeURIComponent(key)}&select=data,updated_at&limit=1`,
  )
  return parsePublicArtistsPayload(data?.[0]?.data)
}

/** Public roster snapshot — REST only, no supabase-js. */
export async function fetchPublicCmsArtistsRow(): Promise<Artist[] | null> {
  const current = await fetchPublicCmsArtistsByKey(PUBLIC_ARTISTS_STORAGE_KEY)
  if (current?.length) return current
  return fetchPublicCmsArtistsByKey(PUBLIC_ARTISTS_STORAGE_KEY_V2)
}

/** Single published artist blob — REST only, no supabase-js. */
export async function fetchPublicCmsArtistBySlug(
  slug: string,
): Promise<Artist | null> {
  const data = await restGet<CmsArtistRow[]>(
    `cms_artists?slug=eq.${encodeURIComponent(slug)}&select=slug,data&limit=1`,
  )
  const row = data?.[0]
  if (!row) return null
  return parseArtist(row.data, row.slug)
}

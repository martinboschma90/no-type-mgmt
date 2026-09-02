import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { publicArtistsToSlugMap } from '@/cms/api/publicArtistsFormat'
import {
  CMS_STORAGE_KEY,
  PUBLIC_ARTISTS_STORAGE_KEY,
} from '@/cms/storageKeys'
import type { CmsContent } from '@/cms/content'
import { visibleArtists } from '@/cms/artistVisibility'
import { withArtDirection } from '@/cms/imageFocus'
import { coerceArtist } from '@/cms/mappers/artist'
import type { Json } from '@/lib/database.types'
import type { Artist } from '@/types/artist'

export type { CmsArtistRow, CmsContentRow } from '@/cms/api/publicCmsRead'
export {
  fetchPublicCmsArtistBySlug,
  fetchPublicCmsArtistsRow,
} from '@/cms/api/publicCmsRead'

function asJson(value: unknown): Json {
  return value as Json
}

function parseCmsBlob(data: unknown): CmsContent | null {
  if (!data || typeof data !== 'object') return null
  const parsed = data as CmsContent
  if (!parsed.site || !Array.isArray(parsed.artists) || !Array.isArray(parsed.team)) {
    return null
  }
  return {
    ...parsed,
    artists: parsed.artists.map((artist) => coerceArtist(withArtDirection(artist))),
  }
}

function parseArtist(data: unknown, fallbackSlug: string): Artist | null {
  if (!data || typeof data !== 'object') return null
  const artist = data as Artist
  if (!artist.name) return null
  return coerceArtist(
    withArtDirection({
      ...artist,
      slug: artist.slug || fallbackSlug,
    }),
  )
}

export async function fetchCmsContentRow(
  key: string,
): Promise<{ data: unknown; updatedAt: number } | null> {
  if (!isSupabaseConfigured || !supabase) return null
  const { data, error } = await supabase
    .from('cms_content')
    .select('key,data,updated_at')
    .eq('key', key)
    .maybeSingle()
  if (error || !data) return null
  return {
    data: data.data,
    updatedAt: new Date(data.updated_at).getTime(),
  }
}

export async function upsertCmsContentRow(
  key: string,
  data: unknown,
): Promise<{ error: string | null; updatedAt: number | null }> {
  if (!isSupabaseConfigured || !supabase) {
    return { error: 'Supabase is not configured', updatedAt: null }
  }
  const { data: row, error } = await supabase
    .from('cms_content')
    .upsert({ key, data: asJson(data) }, { onConflict: 'key' })
    .select('updated_at')
    .single()
  if (error) return { error: error.message, updatedAt: null }
  return {
    error: null,
    updatedAt: row?.updated_at ? new Date(row.updated_at).getTime() : Date.now(),
  }
}

export async function fetchCmsContentBlob(): Promise<{
  content: CmsContent
  updatedAt: number
} | null> {
  const row = await fetchCmsContentRow(CMS_STORAGE_KEY)
  if (!row) return null
  const content = parseCmsBlob(row.data)
  if (!content) return null
  return { content, updatedAt: row.updatedAt }
}

export async function fetchCmsArtists(): Promise<Artist[]> {
  if (!isSupabaseConfigured || !supabase) return []
  const { data, error } = await supabase
    .from('cms_artists')
    .select('id,slug,data,updated_at')
    .order('slug', { ascending: true })
  if (error || !data?.length) return []
  return data
    .map((row) => parseArtist(row.data, row.slug))
    .filter((artist): artist is Artist => Boolean(artist))
}

export async function upsertCmsArtist(
  artist: Artist,
): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured || !supabase) {
    return { error: 'Supabase is not configured' }
  }
  const payload = {
    slug: artist.slug,
    data: asJson(artist),
  }
  const { error } = await supabase
    .from('cms_artists')
    .upsert(payload, { onConflict: 'slug' })
  return { error: error?.message ?? null }
}

export async function deleteCmsArtist(
  slug: string,
): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured || !supabase) {
    return { error: 'Supabase is not configured' }
  }
  const { error } = await supabase.from('cms_artists').delete().eq('slug', slug)
  return { error: error?.message ?? null }
}

export async function replaceCmsArtists(
  artists: Artist[],
): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured || !supabase) {
    return { error: 'Supabase is not configured' }
  }
  const { data: existing, error: listError } = await supabase
    .from('cms_artists')
    .select('slug')
  if (listError) return { error: listError.message }

  const unique = new Map<string, Artist>()
  for (const artist of artists) {
    if (!artist.slug) continue
    unique.set(artist.slug, artist)
  }
  const list = [...unique.values()]

  const keep = new Set(list.map((a) => a.slug))
  for (const artist of list) {
    const { error } = await upsertCmsArtist(artist)
    if (error) return { error }
  }
  const toDelete = (existing ?? [])
    .map((row) => row.slug)
    .filter((slug) => !keep.has(slug))
  if (toDelete.length) {
    const { error } = await supabase.from('cms_artists').delete().in('slug', toDelete)
    if (error) return { error: error.message }
  }
  return { error: null }
}

/** Write CMS blob + artist rows + public roster snapshot. */
export async function pushCmsSnapshot(
  content: CmsContent,
): Promise<{ error: string | null; updatedAt: number | null }> {
  const blob = await upsertCmsContentRow(CMS_STORAGE_KEY, content)
  if (blob.error) return blob
  const artistsResult = await replaceCmsArtists(content.artists)
  if (artistsResult.error) {
    return { error: artistsResult.error, updatedAt: blob.updatedAt }
  }
  const publicRoster = await upsertCmsContentRow(
    PUBLIC_ARTISTS_STORAGE_KEY,
    publicArtistsToSlugMap(visibleArtists(content.artists)),
  )
  if (publicRoster.error) {
    return { error: publicRoster.error, updatedAt: blob.updatedAt }
  }
  return blob
}

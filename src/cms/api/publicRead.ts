import { artistFromRow, artistFromRosterRow, type ArtistRosterRow } from '@/cms/mappers/artist'
import { teamMemberFromRow } from '@/cms/mappers/team'
import { normalizeSiteContent } from '@/cms/mappers/site'
import { fetchPublicCmsArtistBySlug } from '@/cms/api/cmsStore'
import { restGet, publicStorageUrl } from '@/lib/publicRest'
import { isSupabaseConfigured } from '@/lib/supabaseEnv'
import type { ArtistRow, TeamMemberRow } from '@/lib/database.types'
import type { Artist, TeamMember } from '@/types/artist'
import type { SiteContent } from '@/cms/content'

export type ArtistsReadResult = {
  artists: Artist[]
  fromSupabase: boolean
}

export const ROSTER_COLUMNS =
  'id,slug,name,genre,image_url,image_alt,image_focus,image_focus_x,image_focus_y,image_scale,art_direction_version,status,published_at,visible'

export async function fetchPublicRoster(): Promise<ArtistsReadResult> {
  if (!isSupabaseConfigured) return { artists: [], fromSupabase: false }

  const data = await restGet<ArtistRosterRow[]>(
    `artists?select=${ROSTER_COLUMNS}&order=name.asc`,
  )
  if (!data?.length) return { artists: [], fromSupabase: false }

  const artists = data
    .map(artistFromRosterRow)
    .filter((a) => a.status === 'published')

  return { artists, fromSupabase: true }
}

export async function fetchPublicArtistBySlug(
  slug: string,
): Promise<Artist | null> {
  if (!isSupabaseConfigured || !slug) return null
  const fromStore = await fetchPublicCmsArtistBySlug(slug)
  if (fromStore) return fromStore
  const data = await restGet<ArtistRow[]>(
    `artists?slug=eq.${encodeURIComponent(slug)}&select=*&limit=1`,
  )
  const row = data?.[0]
  if (!row) return null
  return artistFromRow(row)
}

export async function fetchPublicSite(): Promise<SiteContent | null> {
  if (!isSupabaseConfigured) return null
  const data = await restGet<{ id: string; content: unknown }[]>(
    'site_settings?select=id,content&order=updated_at.desc&limit=1',
  )
  const row = data?.[0]
  if (!row) return null
  return normalizeSiteContent(row.content)
}

export async function fetchPublicTeam(): Promise<TeamMember[] | null> {
  if (!isSupabaseConfigured) return null
  const data = await restGet<TeamMemberRow[]>(
    'team_members?select=id,name,role,image_url,sort_order&order=sort_order.asc',
  )
  if (!data?.length) return null
  return data.map(teamMemberFromRow)
}

export async function fetchPublicMediaUrl(
  mediaId: string,
): Promise<string | null> {
  if (!isSupabaseConfigured || !mediaId) return null
  const data = await restGet<{ storage_path: string }[]>(
    `media_assets?id=eq.${encodeURIComponent(mediaId)}&select=storage_path&limit=1`,
  )
  const path = data?.[0]?.storage_path
  if (!path) return null
  return publicStorageUrl(path)
}

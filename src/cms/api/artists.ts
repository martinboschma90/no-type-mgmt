import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { artistFromRow } from '@/cms/mappers/artist'
import type { Artist } from '@/types/artist'

export type ArtistsReadResult = {
  artists: Artist[]
  /** True when Supabase returned at least one row. */
  fromSupabase: boolean
}

/**
 * Read-only artists from Supabase (Phase 2.1).
 * Returns empty `artists` + fromSupabase false when not configured, on error, or no rows.
 */
export async function fetchArtistsFromSupabase(): Promise<ArtistsReadResult> {
  if (!isSupabaseConfigured || !supabase) {
    return { artists: [], fromSupabase: false }
  }

  const { data, error } = await supabase
    .from('artists')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    console.warn('[supabase] fetchArtists:', error.message)
    return { artists: [], fromSupabase: false }
  }

  if (!data?.length) {
    return { artists: [], fromSupabase: false }
  }

  return {
    artists: data.map(artistFromRow),
    fromSupabase: true,
  }
}

/**
 * Read a single artist by slug (any visibility — caller filters for public).
 * Returns null when not configured, missing, or on error.
 */
export async function fetchArtistBySlugFromSupabase(
  slug: string,
): Promise<Artist | null> {
  if (!isSupabaseConfigured || !supabase || !slug) {
    return null
  }

  const { data, error } = await supabase
    .from('artists')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

  if (error) {
    console.warn('[supabase] fetchArtistBySlug:', error.message)
    return null
  }

  if (!data) return null
  return artistFromRow(data)
}

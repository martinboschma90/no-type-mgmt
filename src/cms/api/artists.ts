import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import {
  artistFromRow,
  artistToColumns,
  artistToInsert,
  isArtistUuid,
} from '@/cms/mappers/artist'
import type { Artist } from '@/types/artist'

export type ArtistsReadResult = {
  artists: Artist[]
  /** True when Supabase returned at least one row. */
  fromSupabase: boolean
}

export type ArtistWriteResult = {
  artist: Artist | null
  error: string | null
}

/**
 * Read artists from Supabase (Phase 2.1 / 3.1).
 * Returns empty + fromSupabase false when not configured, on error, or no rows.
 * With Phase 3.1 temp RLS, anon can read all rows (incl. hidden) for CMS.
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

/** Insert a new artist row. */
export async function insertArtistInSupabase(
  artist: Artist,
): Promise<ArtistWriteResult> {
  if (!isSupabaseConfigured || !supabase) {
    return { artist: null, error: 'Supabase is not configured' }
  }

  const { data, error } = await supabase
    .from('artists')
    .insert(artistToInsert(artist))
    .select('*')
    .single()

  if (error) {
    console.warn('[supabase] insertArtist:', error.message)
    return { artist: null, error: error.message }
  }

  return { artist: artistFromRow(data), error: null }
}

/**
 * Update by UUID id. If local id is not a UUID (legacy seed), upsert by slug
 * and return the server row so the CMS can adopt the real id.
 */
export async function updateArtistInSupabase(
  artist: Artist,
): Promise<ArtistWriteResult> {
  if (!isSupabaseConfigured || !supabase) {
    return { artist: null, error: 'Supabase is not configured' }
  }

  if (isArtistUuid(artist.id)) {
    const { data, error } = await supabase
      .from('artists')
      .update(artistToColumns(artist))
      .eq('id', artist.id)
      .select('*')
      .maybeSingle()

    if (error) {
      console.warn('[supabase] updateArtist:', error.message)
      return { artist: null, error: error.message }
    }

    if (!data) {
      return {
        artist: null,
        error: `Artist not found for id ${artist.id}`,
      }
    }

    return { artist: artistFromRow(data), error: null }
  }

  // Legacy local ids ("1", "2", …) — reconcile via slug upsert
  const { data, error } = await supabase
    .from('artists')
    .upsert(artistToInsert(artist), { onConflict: 'slug' })
    .select('*')
    .single()

  if (error) {
    console.warn('[supabase] upsertArtist (legacy id):', error.message)
    return { artist: null, error: error.message }
  }

  return { artist: artistFromRow(data), error: null }
}

/** Delete by UUID id, or by slug when id is a legacy non-UUID. */
export async function deleteArtistInSupabase(
  artist: Pick<Artist, 'id' | 'slug'>,
): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured || !supabase) {
    return { error: 'Supabase is not configured' }
  }

  const query = isArtistUuid(artist.id)
    ? supabase.from('artists').delete().eq('id', artist.id)
    : supabase.from('artists').delete().eq('slug', artist.slug)

  const { error } = await query

  if (error) {
    console.warn('[supabase] deleteArtist:', error.message)
    return { error: error.message }
  }

  return { error: null }
}

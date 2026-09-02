import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export type BookingRequestRow = {
  submitted_at: string
  country: string
  city: string
  artists: { id?: string; name?: string }[]
}

function asArtistList(value: unknown): BookingRequestRow['artists'] {
  if (!Array.isArray(value)) return []
  const artists: BookingRequestRow['artists'] = []
  for (const item of value) {
    if (!item || typeof item !== 'object') continue
    const row = item as { id?: unknown; name?: unknown }
    const name = typeof row.name === 'string' ? row.name.trim() : ''
    if (!name) continue
    artists.push({
      id: typeof row.id === 'string' ? row.id : undefined,
      name,
    })
  }
  return artists
}

/** CMS-authenticated read of booking form submissions. */
export async function fetchBookingRequestsSince(
  sinceIso: string,
): Promise<BookingRequestRow[]> {
  if (!isSupabaseConfigured || !supabase) return []
  const client = supabase
  const query = (columns: string) =>
    client
      .from('booking_requests')
      .select(columns)
      .gte('submitted_at', sinceIso)
      .order('submitted_at', { ascending: false })
      .limit(500)

  let result = await query('submitted_at,country,city,artists')
  if (result.error) {
    result = await query('submitted_at,country,artists')
  }
  if (result.error || !Array.isArray(result.data)) return []
  return (result.data as unknown as Array<Record<string, unknown>>).map((row) => ({
    submitted_at: String(row.submitted_at || ''),
    country: String(row.country || ''),
    city: String(row.city || ''),
    artists: asArtistList(row.artists),
  }))
}

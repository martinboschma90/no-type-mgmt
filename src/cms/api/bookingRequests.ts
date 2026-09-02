import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export type BookingRequestRow = {
  submitted_at: string
  country: string
  city: string
  artists: { id?: string; name?: string }[]
}

function asArtistList(value: unknown): BookingRequestRow['artists'] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const row = item as { id?: unknown; name?: unknown }
      const name = typeof row.name === 'string' ? row.name.trim() : ''
      if (!name) return null
      return {
        id: typeof row.id === 'string' ? row.id : undefined,
        name,
      }
    })
    .filter((item): item is { id?: string; name: string } => Boolean(item))
}

/** CMS-authenticated read of booking form submissions. */
export async function fetchBookingRequestsSince(
  sinceIso: string,
): Promise<BookingRequestRow[]> {
  if (!isSupabaseConfigured || !supabase) return []
  const base = () =>
    supabase
      .from('booking_requests')
      .gte('submitted_at', sinceIso)
      .order('submitted_at', { ascending: false })
      .limit(500)

  let result = await base().select('submitted_at,country,city,artists')
  if (result.error) {
    result = await base().select('submitted_at,country,artists')
  }
  if (result.error || !Array.isArray(result.data)) return []
  return result.data.map((row) => ({
    submitted_at: String(row.submitted_at || ''),
    country: String(row.country || ''),
    city: String((row as { city?: string }).city || ''),
    artists: asArtistList(row.artists),
  }))
}

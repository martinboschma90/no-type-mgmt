const COUNTRY_ISO = {
  Netherlands: 'NL',
  Belgium: 'BE',
  Germany: 'DE',
  France: 'FR',
  'United Kingdom': 'GB',
  Spain: 'ES',
  Italy: 'IT',
  Portugal: 'PT',
  Switzerland: 'CH',
  Austria: 'AT',
  'United States': 'US',
}

export function countryIsoFromName(name) {
  const trimmed = String(name || '').trim()
  if (!trimmed || trimmed === 'Other') return ''
  if (COUNTRY_ISO[trimmed]) return COUNTRY_ISO[trimmed]
  if (trimmed.length === 2) return trimmed.toUpperCase()
  return ''
}

export async function recordBookingRequest(payload) {
  const artists = Array.isArray(payload?.artists)
    ? payload.artists
        .map((artist) => ({
          id: String(artist?.id || ''),
          name: String(artist?.name || '').trim(),
        }))
        .filter((artist) => artist.name)
    : []
  if (!artists.length) return false

  const row = {
    submitted_at: payload.submittedAt || new Date().toISOString(),
    country: String(payload.event?.country || '').trim(),
    city: String(payload.event?.city || '').trim(),
    artists,
  }

  const { url, key } = supabaseEnv()
  if (!url || !key) return false

  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    Prefer: 'return=minimal',
  }

  const first = await fetch(`${url}/rest/v1/booking_requests`, {
    method: 'POST',
    headers,
    body: JSON.stringify(row),
  }).catch(() => null)

  if (first?.ok) return true
  if (!row.city) return false

  const { city: _city, ...withoutCity } = row
  const retry = await fetch(`${url}/rest/v1/booking_requests`, {
    method: 'POST',
    headers,
    body: JSON.stringify(withoutCity),
  }).catch(() => null)
  return Boolean(retry?.ok)
}

export async function loadBookingStats({ days, accessToken }) {
  const { url, anonKey, serviceKey } = supabaseEnv()
  const key = serviceKey || anonKey
  if (!url || !key) {
    return emptyStats()
  }

  const since = new Date()
  since.setUTCDate(since.getUTCDate() - (days || 30))

  const headers = {
    apikey: anonKey || key,
    Authorization: `Bearer ${serviceKey || accessToken || key}`,
  }

  const query = new URLSearchParams({
    select: 'submitted_at,country,city,artists',
    submitted_at: `gte.${since.toISOString()}`,
    order: 'submitted_at.desc',
    limit: '500',
  })

  const response = await fetch(
    `${url}/rest/v1/booking_requests?${query.toString().replace('submitted_at=', 'submitted_at=')}`,
    { headers },
  )

  if (!response.ok) return emptyStats()
  const rows = await response.json().catch(() => [])
  return summarizeBookings(Array.isArray(rows) ? rows : [])
}

function summarizeBookings(rows) {
  const artists = new Map()
  const countries = new Map()
  const countryArtists = new Map()

  for (const row of rows) {
    const country = String(row.country || '').trim() || 'Onbekend'
    const countryEntry = countries.get(country) || { country, count: 0, iso: countryIsoFromName(country) }
    countryEntry.count += 1
    countries.set(country, countryEntry)

    const list = Array.isArray(row.artists) ? row.artists : []
    for (const artist of list) {
      const name = String(artist?.name || '').trim()
      if (!name) continue
      const artistEntry = artists.get(name) || { name, count: 0 }
      artistEntry.count += 1
      artists.set(name, artistEntry)

      const key = `${country}::${name}`
      const pair = countryArtists.get(key) || { country, name, count: 0, iso: countryIsoFromName(country) }
      pair.count += 1
      countryArtists.set(key, pair)
    }
  }

  return {
    total: rows.length,
    artists: [...artists.values()].sort((a, b) => b.count - a.count).slice(0, 8),
    countries: [...countries.values()].sort((a, b) => b.count - a.count).slice(0, 8),
    countryArtists: [...countryArtists.values()].sort((a, b) => b.count - a.count).slice(0, 16),
  }
}

export function emptyStats() {
  return { total: 0, artists: [], countries: [], countryArtists: [] }
}

function supabaseEnv() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  return { url, anonKey, serviceKey, key: serviceKey || anonKey }
}

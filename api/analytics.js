const VERCEL_ANALYTICS_URL =
  'https://api.vercel.com/v1/query/web-analytics/visits'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return json(res, 405, { error: 'Method not allowed' })
  }

  const authorized = await verifyCmsSession(req)
  if (!authorized) {
    return json(res, 401, { error: 'Niet ingelogd of sessie verlopen.' })
  }

  const token = process.env.VERCEL_TOKEN
  const projectId = process.env.VERCEL_PROJECT_ID
  if (!token || !projectId) {
    return json(res, 503, {
      error:
        'Analytics is nog niet geconfigureerd. Voeg VERCEL_TOKEN en VERCEL_PROJECT_ID toe in Vercel.',
      code: 'ANALYTICS_NOT_CONFIGURED',
    })
  }

  const days = clamp(Number(req.query?.days) || 30, 7, 90)
  const until = new Date()
  const since = new Date(until)
  since.setUTCDate(since.getUTCDate() - days)
  const previousUntil = new Date(since)
  const previousSince = new Date(previousUntil)
  previousSince.setUTCDate(previousSince.getUTCDate() - days)

  try {
    const [totals, previous, trend, pages, referrers, countries, devices] =
      await Promise.all([
        queryVercel('count', { since, until }),
        queryVercel('count', { since: previousSince, until: previousUntil }),
        queryVercel('aggregate', { since, until, by: 'day', limit: days }),
        queryVercel('aggregate', {
          since,
          until,
          by: 'requestPath',
          limit: 8,
        }),
        queryVercel('aggregate', {
          since,
          until,
          by: 'referrerHostname',
          limit: 6,
        }),
        queryVercel('aggregate', { since, until, by: 'country', limit: 6 }),
        queryVercel('aggregate', {
          since,
          until,
          by: 'deviceType',
          limit: 6,
        }),
      ])

    res.setHeader('Cache-Control', 'private, max-age=300')
    return json(res, 200, {
      period: {
        days,
        since: since.toISOString(),
        until: until.toISOString(),
      },
      totals: totals.data,
      previous: previous.data,
      trend: trend.data,
      pages: pages.data,
      referrers: referrers.data,
      countries: countries.data,
      devices: devices.data,
    })
  } catch (error) {
    return json(res, error.status || 502, {
      error: error.message || 'Vercel Analytics kon niet worden geladen.',
    })
  }
}

async function queryVercel(endpoint, options) {
  const params = new URLSearchParams({
    projectId: process.env.VERCEL_PROJECT_ID,
    since: options.since.toISOString(),
    until: options.until.toISOString(),
  })

  if (options.by) params.set('by', options.by)
  if (options.limit) params.set('limit', String(options.limit))
  if (process.env.VERCEL_TEAM_ID) {
    params.set('teamId', process.env.VERCEL_TEAM_ID)
  } else if (process.env.VERCEL_TEAM_SLUG) {
    params.set('slug', process.env.VERCEL_TEAM_SLUG)
  }

  const response = await fetch(`${VERCEL_ANALYTICS_URL}/${endpoint}?${params}`, {
    headers: {
      Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
      Accept: 'application/json',
    },
  })

  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    const error = new Error(
      payload?.error?.message ||
        payload?.message ||
        `Vercel Analytics fout (${response.status})`,
    )
    error.status = response.status
    throw error
  }
  return payload
}

async function verifyCmsSession(req) {
  const authorization = req.headers.authorization
  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const supabaseAnonKey =
    process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

  if (!authorization?.startsWith('Bearer ') || !supabaseUrl || !supabaseAnonKey) {
    return false
  }

  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: authorization,
        apikey: supabaseAnonKey,
      },
    })
    return response.ok
  } catch {
    return false
  }
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function json(res, status, payload) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(payload))
}

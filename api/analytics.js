import { json, verifyCmsUser } from './cms-session.mjs'

const VERCEL_ANALYTICS_URL =
  'https://api.vercel.com/v1/query/web-analytics/visits'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return json(res, 405, { error: 'Method not allowed' })
  }

  const authorized = await verifyCmsUser(req)
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
    const [totals, previous, trend, pages, artists, referrers, countries, cities, devices, countryArtists] =
      await Promise.all([
        queryVercel('count', { since, until }),
        queryVercel('count', { since: previousSince, until: previousUntil }),
        queryVercel('aggregate', { since, until, by: 'day', limit: days }),
        queryVercel('aggregate', {
          since,
          until,
          by: 'requestPath',
          limit: 30,
        }),
        queryVercel('aggregate', {
          since,
          until,
          by: 'requestPath',
          limit: 12,
          filter: "startswith(requestPath,'/artists')",
        }).catch(() => ({ data: [] })),
        queryVercel('aggregate', {
          since,
          until,
          by: 'referrerHostname',
          limit: 8,
        }),
        queryVercel('aggregate', { since, until, by: 'country', limit: 8 }),
        queryPlaces({ since, until }),
        queryVercel('aggregate', {
          since,
          until,
          by: 'deviceType',
          limit: 6,
        }),
        queryVercel('aggregate', {
          since,
          until,
          by: ['country', 'requestPath'],
          limit: 40,
          filter: "startswith(requestPath,'/artists')",
        }).catch(() => ({ data: [] })),
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
      artists: artists.data,
      referrers: referrers.data,
      channels: summarizeChannels(referrers.data),
      countries: countries.data,
      cities: cities.data,
      citiesSource: cities.source,
      devices: devices.data,
      countryArtists: countryArtists.data,
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

  if (options.by) {
    const dimensions = Array.isArray(options.by) ? options.by : [options.by]
    for (const dimension of dimensions) params.append('by', dimension)
  }
  if (options.limit) params.set('limit', String(options.limit))
  if (options.filter) params.set('filter', options.filter)
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

async function queryPlaces({ since, until }) {
  const attempts = [
    { by: 'city', source: 'city' },
    { by: ['country', 'city'], source: 'city' },
    { by: 'region', source: 'region' },
  ]
  for (const attempt of attempts) {
    try {
      const result = await queryVercel('aggregate', {
        since,
        until,
        by: attempt.by,
        limit: 12,
      })
      const data = Array.isArray(result?.data) ? result.data : []
      const usable = data.filter(
        (row) =>
          String(row?.city || '').trim() || String(row?.region || '').trim(),
      )
      if (usable.length) return { data: usable, source: attempt.source }
    } catch {
      // Vercel Web Analytics ondersteunt city vaak niet; probeer de volgende dimensie.
    }
  }
  return { data: [], source: null }
}

function summarizeChannels(rows) {
  const counts = { organic: 0, direct: 0, social: 0, referral: 0 }
  for (const row of Array.isArray(rows) ? rows : []) {
    const host = String(row?.referrerHostname || '').toLowerCase()
    const views = Number(row?.pageviews) || 0
    counts[classifyReferrer(host)] += views
  }
  return counts
}

function classifyReferrer(host) {
  if (!host) return 'direct'
  if (
    /google\.|bing\.|duckduckgo\.|yahoo\.|ecosia\.|baidu\.|search\.brave/.test(host)
  ) {
    return 'organic'
  }
  if (
    /instagram\.|facebook\.|fb\.com|t\.co$|twitter\.|x\.com|tiktok\.|linkedin\.|youtube\.|youtu\.be|pinterest\./.test(
      host,
    )
  ) {
    return 'social'
  }
  return 'referral'
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

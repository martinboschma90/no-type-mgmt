import { rateLimit } from './http-security.mjs'

const KINDS = new Set(['vital', 'error', 'presence', 'notfound'])
const VITAL_NAMES = new Set(['LCP', 'INP', 'CLS', 'TTFB', 'FCP'])

function supabaseEnv() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  return { url, anonKey, serviceKey, key: serviceKey || anonKey }
}

function clip(value, max) {
  return String(value || '').trim().slice(0, max)
}

function decodeHeader(value) {
  try {
    return decodeURIComponent(String(value || '').replace(/\+/g, ' '))
  } catch {
    return String(value || '')
  }
}

function geoFromRequest(req) {
  const headers = req.headers || {}
  const city = clip(
    decodeHeader(headers['x-vercel-ip-city'] || headers['cf-ipcity'] || ''),
    80,
  )
  const country = clip(
    headers['x-vercel-ip-country'] || headers['cf-ipcountry'] || '',
    8,
  ).toUpperCase()
  return { city, country }
}

function parseBody(req) {
  if (!req.body) return {}
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body)
    } catch {
      return {}
    }
  }
  return req.body
}

export async function handleRum(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return
  }
  if (req.method !== 'POST') {
    res.statusCode = 405
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Method not allowed' }))
    return
  }

  if (!rateLimit(req, { limit: 40, windowMs: 10 * 60 * 1000 })) {
    res.statusCode = 429
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ ok: false }))
    return
  }

  const payload = parseBody(req)
  const kind = clip(payload.kind, 20)
  if (!KINDS.has(kind)) {
    res.statusCode = 400
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Invalid kind' }))
    return
  }

  const name =
    kind === 'vital'
      ? clip(payload.name, 12)
      : kind === 'error'
        ? 'js'
        : kind === 'notfound'
          ? '404'
          : 'ping'
  if (kind === 'vital' && !VITAL_NAMES.has(name)) {
    res.statusCode = 400
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Invalid metric' }))
    return
  }

  const path = clip(payload.path, 180)
  if (path.startsWith('/cms') || path.startsWith('/admin') || path.startsWith('/api')) {
    res.statusCode = 204
    res.end()
    return
  }

  const { url, key } = supabaseEnv()
  if (!url || !key) {
    res.statusCode = 204
    res.end()
    return
  }

  const geo = geoFromRequest(req)
  const value =
    typeof payload.value === 'number' && Number.isFinite(payload.value)
      ? payload.value
      : null

  const row = {
    kind,
    name,
    value,
    path: path || '/',
    message: clip(payload.message, 280),
    session_id: clip(payload.sessionId, 64),
    city: geo.city,
    country: geo.country,
  }

  await fetch(`${url}/rest/v1/site_rum`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(row),
  }).catch(() => null)

  res.statusCode = 204
  res.end()
}

export async function loadRumSince(sinceIso, { accessToken } = {}) {
  const { url, anonKey, serviceKey, key } = supabaseEnv()
  if (!url || !key) return []

  const headers = {
    apikey: anonKey || key,
    Authorization: `Bearer ${serviceKey || accessToken || key}`,
  }
  const query = new URLSearchParams({
    select: 'created_at,kind,name,value,path,message,session_id,city,country',
    created_at: `gte.${sinceIso}`,
    order: 'created_at.desc',
    limit: '2000',
  })
  const response = await fetch(
    `${url}/rest/v1/site_rum?${query.toString().replace('created_at=', 'created_at=')}`,
    { headers },
  )
  if (!response.ok) return []
  const rows = await response.json().catch(() => [])
  return Array.isArray(rows) ? rows : []
}

export async function readHealthCache(cacheKey, { accessToken } = {}) {
  const { url, anonKey, serviceKey, key } = supabaseEnv()
  if (!url || !key) return null
  const headers = {
    apikey: anonKey || key,
    Authorization: `Bearer ${serviceKey || accessToken || key}`,
  }
  const response = await fetch(
    `${url}/rest/v1/site_health_cache?cache_key=eq.${encodeURIComponent(cacheKey)}&select=payload,fetched_at&limit=1`,
    { headers },
  )
  if (!response.ok) return null
  const rows = await response.json().catch(() => [])
  return Array.isArray(rows) && rows[0] ? rows[0] : null
}

export async function writeHealthCache(cacheKey, payload) {
  const { url, key } = supabaseEnv()
  if (!url || !key) return
  await fetch(`${url}/rest/v1/site_health_cache?on_conflict=cache_key`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify({
      cache_key: cacheKey,
      payload,
      fetched_at: new Date().toISOString(),
    }),
  }).catch(() => null)
}

function speedHeaders(accessToken) {
  const { url, anonKey, serviceKey, key } = supabaseEnv()
  return {
    url,
    key,
    headers: {
      apikey: anonKey || key,
      Authorization: `Bearer ${serviceKey || accessToken || key}`,
    },
  }
}

export async function listSpeedTests({ accessToken, limit = 8 } = {}) {
  const { url, key, headers } = speedHeaders(accessToken)
  if (!url || !key) return []
  const query = new URLSearchParams({
    select: 'id,created_at,origin,score,lcp,inp,cls,ttfb,source,optimized_at,optimize_summary',
    order: 'created_at.desc',
    limit: String(limit),
  })
  const response = await fetch(`${url}/rest/v1/site_speed_tests?${query}`, { headers })
  if (!response.ok) return []
  const rows = await response.json().catch(() => [])
  return Array.isArray(rows) ? rows : []
}

export async function insertSpeedTest(row, { accessToken } = {}) {
  const { url, key, headers } = speedHeaders(accessToken)
  if (!url || !key) return null
  const response = await fetch(`${url}/rest/v1/site_speed_tests`, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(row),
  })
  if (!response.ok) return null
  const rows = await response.json().catch(() => [])
  return Array.isArray(rows) ? rows[0] : rows
}

export async function patchSpeedTest(id, patch, { accessToken } = {}) {
  const { url, key, headers } = speedHeaders(accessToken)
  if (!url || !key || !id) return false
  const response = await fetch(
    `${url}/rest/v1/site_speed_tests?id=eq.${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(patch),
    },
  )
  return response.ok
}

export { supabaseEnv }

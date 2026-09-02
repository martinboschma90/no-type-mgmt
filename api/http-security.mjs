const ALLOWED_ORIGIN_PATTERN =
  /^https:\/\/((www\.)?notype-mgmt\.com|no-type-mgmt[\w.-]*\.vercel\.app)$/i
const LOCAL_ORIGIN_PATTERN = /^http:\/\/localhost:(5173|5174|4173)$/i

const hits = new Map()

export function allowedOrigin(origin) {
  const value = String(origin || '').trim()
  if (!value) return ''
  if (ALLOWED_ORIGIN_PATTERN.test(value) || LOCAL_ORIGIN_PATTERN.test(value)) {
    return value
  }
  return ''
}

export function isSiteHost(host) {
  const value = String(host || '').split(':')[0].toLowerCase()
  return (
    value === 'notype-mgmt.com' ||
    value === 'www.notype-mgmt.com' ||
    value.endsWith('.vercel.app') ||
    value === 'localhost'
  )
}

export function setCors(res, origin) {
  const allowed = allowedOrigin(origin)
  if (allowed) {
    res.setHeader('Access-Control-Allow-Origin', allowed)
    res.setHeader('Vary', 'Origin')
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

export function clientIp(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '')
  const first = forwarded.split(',')[0]?.trim()
  return first || req.socket?.remoteAddress || 'unknown'
}

/** Best-effort per-instance limit (serverless instances do not share memory). */
export function rateLimit(req, { limit = 8, windowMs = 15 * 60 * 1000 } = {}) {
  const key = clientIp(req)
  const now = Date.now()
  const recent = (hits.get(key) || []).filter((stamp) => now - stamp < windowMs)
  if (recent.length >= limit) {
    hits.set(key, recent)
    return false
  }
  recent.push(now)
  hits.set(key, recent)
  return true
}

export function json(res, status, payload) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(payload))
}

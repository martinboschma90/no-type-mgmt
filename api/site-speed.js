import { json, verifyCmsUser } from './cms-session.mjs'
import {
  insertSpeedTest,
  listSpeedTests,
  patchSpeedTest,
} from './rum-lib.mjs'
import {
  SPEED_INTERVAL_DAYS,
  SPEED_THRESHOLD,
  fetchPageSpeed,
} from './pagespeed-lib.mjs'

const DEFAULT_ORIGIN = 'https://www.notype-mgmt.com'
const INTERVAL_MS = SPEED_INTERVAL_DAYS * 24 * 60 * 60 * 1000

export default async function handler(req, res) {
  await handleSiteSpeed(req, res)
}

export async function handleSiteSpeed(req, res) {
  const cron = isCron(req)
  const user = cron ? null : await verifyCmsUser(req)
  if (!cron && !user) {
    return json(res, 401, { error: 'Niet ingelogd of sessie verlopen.' })
  }

  const accessToken = user?.token
  const origin = resolveOrigin(
    queryValue(req, 'origin') || bodyValue(req, 'origin'),
  )

  if (req.method === 'POST') {
    const action = String(bodyValue(req, 'action') || 'run')
    if (action === 'optimize-done') {
      const id = String(bodyValue(req, 'id') || '')
      const summary = String(bodyValue(req, 'summary') || '').slice(0, 280)
      const ok = await patchSpeedTest(
        id,
        {
          optimized_at: new Date().toISOString(),
          optimize_summary: summary,
        },
        { accessToken },
      )
      return json(res, ok ? 200 : 502, { ok })
    }
  }

  const history = await listSpeedTests({ accessToken, limit: 8 })
  const latest = history[0] || null
  const stale =
    !latest ||
    Date.now() - new Date(latest.created_at).getTime() >= INTERVAL_MS
  const force =
    req.method === 'POST' && String(bodyValue(req, 'force') || '') === 'true'
  const shouldRun =
    cron ||
    force ||
    (req.method === 'POST' &&
      String(bodyValue(req, 'action') || 'run') === 'run' &&
      stale) ||
    (req.method === 'GET' && String(queryValue(req, 'run') || '') === '1' && stale)

  let current = latest
  let runError = null
  if (shouldRun) {
    const psi = await fetchPageSpeed(origin, { timeoutMs: cron ? 50000 : 52000 })
    if (psi?.source) {
      const saved = await insertSpeedTest(
        {
          origin,
          score: psi.score,
          lcp: psi.lcp,
          inp: psi.inp,
          cls: psi.cls,
          ttfb: psi.ttfb,
          source: psi.source,
        },
        { accessToken },
      )
      current = saved || {
        ...psi,
        created_at: new Date().toISOString(),
        origin,
        optimized_at: null,
        optimize_summary: '',
      }
    } else {
      runError =
        psi?.error || 'PageSpeed gaf geen resultaat. Probeer het zo opnieuw.'
    }
  }

  const nextHistory = current && current !== latest ? [current, ...history] : history
  const nextLatest = nextHistory[0] || null
  const previous = nextHistory[1] || null
  const fetchedAt = nextLatest
    ? new Date(nextLatest.created_at || nextLatest.fetchedAt).getTime()
    : null

  return json(res, runError ? 502 : 200, {
    origin,
    intervalDays: SPEED_INTERVAL_DAYS,
    threshold: SPEED_THRESHOLD,
    stale: !nextLatest || Date.now() - (fetchedAt || 0) >= INTERVAL_MS,
    nextDueAt: fetchedAt ? fetchedAt + INTERVAL_MS : Date.now(),
    belowThreshold:
      nextLatest?.score != null && nextLatest.score < SPEED_THRESHOLD,
    latest: nextLatest,
    previous,
    history: nextHistory.slice(0, 6),
    error: runError,
  })
}

function isCron(req) {
  const headers = req.headers || {}
  const auth = String(headers.authorization || headers.Authorization || '')
  const cronHeader = String(headers['x-vercel-cron'] || '')
  const secret = process.env.CRON_SECRET || ''
  if (secret && auth === `Bearer ${secret}`) return true
  return cronHeader === '1'
}

function queryValue(req, key) {
  const value = req.query?.[key]
  return Array.isArray(value) ? value[0] : value
}

function bodyValue(req, key) {
  const body =
    typeof req.body === 'string'
      ? (() => {
          try {
            return JSON.parse(req.body)
          } catch {
            return {}
          }
        })()
      : req.body || {}
  return body[key]
}

function resolveOrigin(raw) {
  try {
    const url = new URL(String(raw || DEFAULT_ORIGIN))
    const host = url.hostname.toLowerCase()
    if (host === 'localhost' || host === '127.0.0.1') return DEFAULT_ORIGIN
    if (
      host === 'www.notype-mgmt.com' ||
      host === 'notype-mgmt.com' ||
      host.endsWith('.vercel.app')
    ) {
      return `${url.protocol}//${url.host}`
    }
  } catch {
    /* fall through */
  }
  return DEFAULT_ORIGIN
}

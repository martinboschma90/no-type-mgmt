import { json, verifyCmsUser } from './cms-session.mjs'
import { loadRumSince, listSpeedTests } from './rum-lib.mjs'
import {
  SPEED_INTERVAL_DAYS,
  SPEED_PAGES,
  SPEED_THRESHOLD,
  bucketSpeedPath,
  combinePageScore,
} from './pagespeed-lib.mjs'

const DEFAULT_ORIGIN = 'https://www.notype-mgmt.com'
const INTERVAL_MS = SPEED_INTERVAL_DAYS * 24 * 60 * 60 * 1000

function queryValue(req, key) {
  const value = req.query?.[key]
  return Array.isArray(value) ? value[0] : value
}

export default async function handler(req, res) {
  await handleSiteLive(req, res)
}

export async function handleSiteLive(req, res) {
  if (req.method !== 'GET') {
    return json(res, 405, { error: 'Method not allowed' })
  }

  const authorized = await verifyCmsUser(req)
  if (!authorized) {
    return json(res, 401, { error: 'Niet ingelogd of sessie verlopen.' })
  }

  const origin = resolveOrigin(queryValue(req, 'origin') || queryValue(req, 'url'))
  const since7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const token = authorized.token

  const [uptime, rum, history] = await Promise.all([
    probeOrigin(origin),
    loadRumSince(since7, { accessToken: token }),
    listSpeedTests({ accessToken: token, limit: 8 }),
  ])

  const latest = history[0] || null
  const previous = history[1] || null
  const fetchedAt = latest ? new Date(latest.created_at).getTime() : null
  const psi = latest
    ? {
        id: latest.id,
        score: latest.score,
        lcp: latest.lcp,
        inp: latest.inp,
        cls: latest.cls,
        ttfb: latest.ttfb,
        fetchedAt,
        source: latest.source || 'pagespeed',
        optimizedAt: latest.optimized_at,
        optimizeSummary: latest.optimize_summary,
      }
    : null

  const live = summarizeRum(rum)
  const speedPages = buildSpeedPages(uptime.pages, live.pageVitals, psi)
  res.setHeader('Cache-Control', 'private, max-age=30')
  return json(res, 200, {
    origin,
    checkedAt: Date.now(),
    uptime,
    vitals: live.vitals,
    errors: live.errors,
    presence: live.presence,
    cities: live.cities,
    search: {
      robots: uptime.robots,
      sitemap: uptime.sitemap,
      rankings: null,
      rankingsHint:
        'Google Search Console is niet gekoppeld — rankings komen daar vandaan.',
      searchConsoleUrl: `https://search.google.com/search-console?resource_id=${encodeURIComponent(origin)}`,
    },
    psi,
    speed: {
      intervalDays: SPEED_INTERVAL_DAYS,
      threshold: SPEED_THRESHOLD,
      stale: !fetchedAt || Date.now() - fetchedAt >= INTERVAL_MS,
      nextDueAt: fetchedAt ? fetchedAt + INTERVAL_MS : Date.now(),
      belowThreshold: psi?.score != null && psi.score < SPEED_THRESHOLD,
      latest: psi,
      previous: previous
        ? {
            id: previous.id,
            score: previous.score,
            lcp: previous.lcp,
            inp: previous.inp,
            cls: previous.cls,
            fetchedAt: new Date(previous.created_at).getTime(),
          }
        : null,
      history: history.slice(0, 6).map((row) => ({
        id: row.id,
        score: row.score,
        fetchedAt: new Date(row.created_at).getTime(),
      })),
      pages: speedPages,
    },
  })
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

async function probeOrigin(origin) {
  const paths = SPEED_PAGES.map((page) => (page.path === '/artists' ? '/' : page.path)).filter(
    (path, index, all) => all.indexOf(path) === index,
  )
  const pages = []
  for (const path of paths) {
    pages.push(await ping(`${origin}${path}`))
  }
  const home = pages[0]
  const robots = await pingFile(`${origin}/robots.txt`, /user-agent/i)
  const sitemap = await pingFile(`${origin}/sitemap.xml`, /<urlset|<sitemapindex/i)
  const ok = pages.every((page) => page.ok)
  return {
    ok,
    status: home.status,
    ttfbMs: home.ttfbMs,
    url: origin,
    pages,
    robots,
    sitemap,
  }
}

async function ping(url) {
  const started = Date.now()
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 6000)
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: { Accept: 'text/html' },
    })
    clearTimeout(timer)
    const ttfbMs = Date.now() - started
    return {
      path: new URL(url).pathname,
      ok: response.ok,
      status: response.status,
      ttfbMs,
    }
  } catch {
    return {
      path: safePath(url),
      ok: false,
      status: 0,
      ttfbMs: Date.now() - started,
    }
  }
}

async function pingFile(url, expect) {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 5000)
    const response = await fetch(url, { signal: controller.signal })
    clearTimeout(timer)
    const text = await response.text()
    const looksLikeApp = /<!doctype html/i.test(text) && !expect.test(text)
    return {
      ok: response.ok && expect.test(text) && !looksLikeApp,
      status: response.status,
    }
  } catch {
    return { ok: false, status: 0 }
  }
}

function safePath(url) {
  try {
    return new URL(url).pathname
  } catch {
    return '/'
  }
}

function percentile(values, p) {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((p / 100) * sorted.length) - 1),
  )
  return sorted[index]
}

function summarizeRum(rows) {
  const now = Date.now()
  const vitals = { LCP: [], INP: [], CLS: [], TTFB: [], FCP: [] }
  const byPath = new Map()
  const errors = []
  const notFound = []
  const liveSessions = new Set()
  const cities = new Map()

  for (const row of rows) {
    const created = new Date(row.created_at).getTime()
    const age = now - created
    if (row.kind === 'vital' && vitals[row.name] && typeof row.value === 'number') {
      vitals[row.name].push(row.value)
      const bucket = bucketSpeedPath(row.path)
      if (bucket) {
        const current = byPath.get(bucket) || {
          LCP: [],
          INP: [],
          CLS: [],
          TTFB: [],
        }
        if (current[row.name]) current[row.name].push(row.value)
        byPath.set(bucket, current)
      }
    }
    if (row.kind === 'error' && age < 24 * 60 * 60 * 1000) {
      errors.push({
        at: row.created_at,
        path: row.path,
        message: row.message,
      })
    }
    if (row.kind === 'notfound' && age < 24 * 60 * 60 * 1000) {
      notFound.push({ at: row.created_at, path: row.path })
    }
    if ((row.kind === 'presence' || row.kind === 'vital') && age < 2 * 60 * 1000) {
      if (row.session_id) liveSessions.add(row.session_id)
    }
    if (row.city && age < 7 * 24 * 60 * 60 * 1000) {
      const key = `${row.city}|${row.country || ''}`
      const current = cities.get(key) || {
        city: row.city,
        country: row.country || '',
        count: 0,
      }
      current.count += 1
      cities.set(key, current)
    }
  }

  return {
    vitals: {
      samples: vitals.LCP.length,
      lcp: percentile(vitals.LCP, 75),
      inp: percentile(vitals.INP, 75),
      cls: percentile(vitals.CLS, 75),
      ttfb: percentile(vitals.TTFB, 75),
      fcp: percentile(vitals.FCP, 75),
    },
    errors: {
      jsCount24h: errors.length,
      notFoundCount24h: notFound.length,
      recent: errors.slice(0, 5),
      notFound: notFound.slice(0, 5),
    },
    presence: { live: liveSessions.size },
    cities: [...cities.values()].sort((a, b) => b.count - a.count).slice(0, 12),
    pageVitals: Object.fromEntries(
      [...byPath.entries()].map(([path, metrics]) => [
        path,
        {
          samples: metrics.LCP.length,
          lcp: percentile(metrics.LCP, 75),
          inp: percentile(metrics.INP, 75),
          cls: percentile(metrics.CLS, 75),
          ttfb: percentile(metrics.TTFB, 75),
        },
      ]),
    ),
  }
}

function buildSpeedPages(probes, pageVitals, psi) {
  const probeByPath = new Map((probes || []).map((page) => [page.path, page]))
  return SPEED_PAGES.map((page) => {
    const rum = pageVitals?.[page.path] || {}
    const probe = probeByPath.get(page.path === '/artists' ? '/' : page.path)
    const ttfb = rum.ttfb ?? probe?.ttfbMs ?? null
    const lcp = page.path === '/' && psi?.lcp != null ? psi.lcp : rum.lcp ?? null
    const inp = page.path === '/' && psi?.inp != null ? psi.inp : rum.inp ?? null
    const cls = page.path === '/' && psi?.cls != null ? psi.cls : rum.cls ?? null
    const score =
      page.path === '/' && psi?.score != null
        ? psi.score
        : combinePageScore({ lcp, inp, cls, ttfb })
    return {
      id: page.id,
      label: page.label,
      path: page.path,
      to: page.to,
      score,
      ttfbMs: ttfb,
      lcp,
      samples: rum.samples || 0,
    }
  }).sort((a, b) => (a.score ?? 101) - (b.score ?? 101))
}

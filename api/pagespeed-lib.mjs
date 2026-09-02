export const SPEED_INTERVAL_DAYS = 14
export const SPEED_THRESHOLD = 70

export const SPEED_PAGES = [
  { id: 'home', label: 'Home', path: '/', to: '/cms/home' },
  { id: 'about', label: 'About', path: '/about', to: '/cms/about' },
  { id: 'contact', label: 'Contact', path: '/contact', to: '/cms/contact' },
  { id: 'booking', label: 'Booking', path: '/booking', to: '/cms/booking' },
  { id: 'faq', label: 'FAQ', path: '/faq', to: '/cms/faq' },
  { id: 'artists', label: 'Artiesten', path: '/artists', to: '/cms/artists' },
]

export function metricScore(name, value) {
  if (value == null || !Number.isFinite(Number(value))) return null
  const n = Number(value)
  if (name === 'lcp') return n <= 2500 ? 100 : n <= 4000 ? 70 : 35
  if (name === 'inp') return n <= 200 ? 100 : n <= 500 ? 70 : 35
  if (name === 'cls') {
    const cls = n > 1 ? n / 100 : n
    return cls <= 0.1 ? 100 : cls <= 0.25 ? 70 : 35
  }
  if (name === 'ttfb') return n <= 800 ? 100 : n <= 1800 ? 70 : 35
  return null
}

export function combinePageScore({ lcp, inp, cls, ttfb } = {}) {
  const parts = [
    metricScore('lcp', lcp),
    metricScore('inp', inp),
    metricScore('cls', cls),
    metricScore('ttfb', ttfb),
  ].filter((value) => value != null)
  if (!parts.length) return null
  return Math.round(parts.reduce((sum, value) => sum + value, 0) / parts.length)
}

export function bucketSpeedPath(path) {
  const raw = String(path || '/').split('?')[0]
  const clean = raw.replace(/\/+$/, '') || '/'
  if (clean === '/') return '/'
  const top = `/${clean.slice(1).split('/')[0]}`
  if (SPEED_PAGES.some((page) => page.path === top)) return top
  return null
}

export async function fetchPageSpeed(origin, { timeoutMs = 52000 } = {}) {
  const key = process.env.PAGESPEED_API_KEY || process.env.GOOGLE_PSI_API_KEY || ''
  const params = new URLSearchParams({
    url: origin,
    strategy: 'mobile',
    category: 'PERFORMANCE',
  })
  if (key) params.set('key', key)
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    const response = await fetch(
      `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${params}`,
      { signal: controller.signal },
    )
    clearTimeout(timer)
    if (!response.ok) {
      return {
        error:
          response.status === 429
            ? 'PageSpeed-limiet bereikt. Probeer het over een paar minuten.'
            : `PageSpeed gaf ${response.status}. Probeer het zo opnieuw.`,
      }
    }
    const payload = await response.json()
    const audits = payload?.lighthouseResult?.audits || {}
    const crux = payload?.loadingExperience?.metrics || {}
    const lcp =
      numeric(crux.LARGEST_CONTENTFUL_PAINT_MS?.percentile) ??
      secondsToMs(audits['largest-contentful-paint']?.numericValue)
    return {
      score: Math.round(
        (payload?.lighthouseResult?.categories?.performance?.score || 0) * 100,
      ),
      lcp,
      inp: numeric(crux.INTERACTION_TO_NEXT_PAINT?.percentile),
      cls: numeric(crux.CUMULATIVE_LAYOUT_SHIFT_SCORE?.percentile),
      ttfb: secondsToMs(audits['server-response-time']?.numericValue),
      fetchedAt: Date.now(),
      source: 'pagespeed',
    }
  } catch (reason) {
    return {
      error:
        reason?.name === 'AbortError'
          ? 'PageSpeed duurde te lang. Klik zo nog eens op Test nu.'
          : 'PageSpeed gaf geen resultaat. Probeer het zo opnieuw.',
    }
  }
}

function numeric(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function secondsToMs(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

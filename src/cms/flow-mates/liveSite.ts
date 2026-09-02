export type LiveVitalSet = {
  samples: number
  lcp: number | null
  inp: number | null
  cls: number | null
  ttfb: number | null
  fcp: number | null
}

export type LiveSiteSnapshot = {
  origin: string
  checkedAt: number
  uptime: {
    ok: boolean
    status: number
    ttfbMs: number | null
    url: string
    pages: { path: string; ok: boolean; status: number; ttfbMs: number }[]
    robots: { ok: boolean; status: number }
    sitemap: { ok: boolean; status: number }
  }
  vitals: LiveVitalSet
  errors: {
    jsCount24h: number
    notFoundCount24h: number
    recent: { at: string; path: string; message: string }[]
    notFound: { at: string; path: string }[]
  }
  presence: { live: number }
  cities: { city: string; country: string; count: number }[]
  search: {
    robots: { ok: boolean; status: number }
    sitemap: { ok: boolean; status: number }
    rankings: null
    rankingsHint: string
    searchConsoleUrl: string
  }
  psi: {
    id?: string
    score: number
    lcp: number | null
    inp: number | null
    cls: number | null
    ttfb?: number | null
    fetchedAt: number
    source: string
    optimizedAt?: string | null
    optimizeSummary?: string
  } | null
  speed?: {
    intervalDays: number
    threshold: number
    stale: boolean
    nextDueAt: number
    belowThreshold: boolean
    latest: LiveSiteSnapshot['psi']
    previous: {
      id: string
      score: number | null
      lcp: number | null
      inp: number | null
      cls: number | null
      fetchedAt: number
    } | null
    history: { id: string; score: number | null; fetchedAt: number }[]
    pages?: {
      id: string
      label: string
      path: string
      to: string
      score: number | null
      ttfbMs: number | null
      lcp: number | null
      samples: number
    }[]
  }
}

export function vitalRating(
  name: 'lcp' | 'inp' | 'cls' | 'ttfb',
  value: number | null,
): 'good' | 'ok' | 'poor' | 'empty' {
  if (value == null) return 'empty'
  if (name === 'lcp') return value <= 2500 ? 'good' : value <= 4000 ? 'ok' : 'poor'
  if (name === 'inp') return value <= 200 ? 'good' : value <= 500 ? 'ok' : 'poor'
  if (name === 'cls') return value <= 0.1 ? 'good' : value <= 0.25 ? 'ok' : 'poor'
  return value <= 800 ? 'good' : value <= 1800 ? 'ok' : 'poor'
}

export function ratingScore(rating: ReturnType<typeof vitalRating>) {
  if (rating === 'good') return 100
  if (rating === 'ok') return 70
  if (rating === 'poor') return 35
  return 70
}

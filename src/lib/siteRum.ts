const SESSION_KEY = 'notype-rum-session'

function sessionId() {
  try {
    const existing = window.sessionStorage.getItem(SESSION_KEY)
    if (existing) return existing
    const next = crypto.randomUUID()
    window.sessionStorage.setItem(SESSION_KEY, next)
    return next
  } catch {
    return 'anon'
  }
}

function isCmsPath(path: string) {
  return path.startsWith('/cms') || path.startsWith('/admin') || path.startsWith('/login')
}

function send(payload: Record<string, unknown>) {
  const path = window.location.pathname
  if (isCmsPath(path)) return
  const body = JSON.stringify({
    ...payload,
    path: String(payload.path || path).slice(0, 180),
    sessionId: sessionId(),
  })
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/rum', new Blob([body], { type: 'application/json' }))
      return
    }
  } catch {
    /* fall through */
  }
  void fetch('/api/rum', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => null)
}

export function reportRumError(error: unknown, path?: string) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : 'Unknown error'
  send({ kind: 'error', message: message.slice(0, 280), path })
}

export function reportNotFound(path: string) {
  send({ kind: 'notfound', path })
}

function observeVitals() {
  const reported = new Set<string>()
  const report = (name: string, value: number) => {
    if (!Number.isFinite(value) || value < 0) return
    if (reported.has(name)) return
    reported.add(name)
    send({ kind: 'vital', name, value })
  }

  try {
    const nav = performance.getEntriesByType('navigation')[0] as
      | PerformanceNavigationTiming
      | undefined
    if (nav) report('TTFB', nav.responseStart)

    const lcp = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const last = entries[entries.length - 1]
      if (last) report('LCP', last.startTime)
    })
    lcp.observe({ type: 'largest-contentful-paint', buffered: true })

    let cls = 0
    const clsObs = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as PerformanceEntry[]) {
        const shift = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number }
        if (!shift.hadRecentInput) cls += Number(shift.value) || 0
      }
    })
    clsObs.observe({ type: 'layout-shift', buffered: true })

    const inp = new PerformanceObserver((list) => {
      let max = 0
      for (const entry of list.getEntries()) {
        const delay =
          'duration' in entry ? Number((entry as PerformanceEventTiming).duration) : 0
        if (delay > max) max = delay
      }
      if (max > 0) report('INP', max)
    })
    inp.observe({ type: 'event', buffered: true, durationThreshold: 40 } as PerformanceObserverInit)

    document.addEventListener(
      'visibilitychange',
      () => {
        if (document.visibilityState === 'hidden') report('CLS', cls)
      },
      { once: true },
    )
  } catch {
    /* observers not supported */
  }
}

function pingPresence() {
  send({ kind: 'presence' })
}

export function startPublicRum() {
  if (typeof window === 'undefined') return

  observeVitals()
  pingPresence()
  const timer = window.setInterval(() => {
    if (document.visibilityState === 'visible') pingPresence()
  }, 45_000)

  const onError = (event: ErrorEvent) => reportRumError(event.error || event.message)
  const onReject = (event: PromiseRejectionEvent) => reportRumError(event.reason)
  window.addEventListener('error', onError)
  window.addEventListener('unhandledrejection', onReject)

  return () => {
    window.clearInterval(timer)
    window.removeEventListener('error', onError)
    window.removeEventListener('unhandledrejection', onReject)
  }
}

/** Warm lazy route chunks on intent (hover / focus). */
const loaders: Record<string, () => Promise<unknown>> = {
  '/about': () => import('@/pages/AboutPage'),
  '/booking': () => import('@/pages/BookingPage'),
  '/faq': () => import('@/pages/FaqPage'),
  '/contact': () => import('@/pages/ContactPage'),
}

const warmed = new Set<string>()

export function prefetchRoute(to: string) {
  const path = to.split('?')[0]
  if (warmed.has(path)) return
  if (path.startsWith('/artists/') && path !== '/artists') {
    warmed.add(path)
    return
  }
  const load = loaders[path]
  if (!load) return
  warmed.add(path)
  void load()
}

/** Download menu + inner pages while the roster is on screen. */
export function prefetchPublicApp() {
  prefetchRoute('/about')
  prefetchRoute('/booking')
  prefetchRoute('/faq')
  prefetchRoute('/contact')
}

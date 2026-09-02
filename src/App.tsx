import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import type { BeforeSendEvent } from '@vercel/analytics/react'
import { ScrollToTop } from '@/components/layout/ScrollToTop'
import { PublicSeo } from '@/components/layout/PublicSeo'
import { PublicContentProvider } from '@/cms/PublicContentProvider'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { RouteFallback } from '@/components/ui/RouteFallback'
import { HomePage } from '@/pages/HomePage'
import { reportNotFound, startPublicRum } from '@/lib/siteRum'

const Analytics = lazy(() =>
  import('@vercel/analytics/react').then((m) => ({ default: m.Analytics })),
)

const ArtistPage = lazy(() =>
  import('@/pages/ArtistPage').then((m) => ({ default: m.ArtistPage })),
)

const AboutPage = lazy(() =>
  import('@/pages/AboutPage').then((m) => ({ default: m.AboutPage })),
)
const ContactPage = lazy(() =>
  import('@/pages/ContactPage').then((m) => ({ default: m.ContactPage })),
)
const BookingPage = lazy(() =>
  import('@/pages/BookingPage').then((m) => ({ default: m.BookingPage })),
)
const FaqPage = lazy(() =>
  import('@/pages/FaqPage').then((m) => ({ default: m.FaqPage })),
)
const CmsApp = lazy(() => import('@/CmsApp'))

function publicPageViewsOnly(event: BeforeSendEvent) {
  const pathname = new URL(event.url, window.location.origin).pathname
  return pathname.startsWith('/cms') || pathname.startsWith('/admin')
    ? null
    : event
}

/** Flow Mates CMS lives at /cms; /admin is an alias. Public routes stay Notype. */
function AdminToCms() {
  const { pathname, search } = useLocation()
  const rest = pathname.replace(/^\/admin/, '') || '/home'
  return <Navigate to={`/cms${rest}${search}`} replace />
}

function RouteErrorBoundary({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  const { pathname } = useLocation()
  return (
    <ErrorBoundary label={label} resetKey={pathname}>
      {children}
    </ErrorBoundary>
  )
}

function PublicApp() {
  return (
    <PublicContentProvider>
      <PublicSeo />
      <ScrollToTop />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/artists" element={<Navigate to="/" replace />} />
          <Route path="/artists/:slug" element={<ArtistPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/booking" element={<BookingPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="*" element={<UnknownPublicPath />} />
        </Routes>
      </Suspense>
    </PublicContentProvider>
  )
}

function UnknownPublicPath() {
  const { pathname } = useLocation()
  useEffect(() => {
    reportNotFound(pathname)
  }, [pathname])
  return <Navigate to="/" replace />
}

export default function App() {
  const [analyticsReady, setAnalyticsReady] = useState(false)

  useEffect(() => {
    const start = () => setAnalyticsReady(true)
    const timer = window.setTimeout(start, 1200)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => startPublicRum(), [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Navigate to="/cms/login" replace />} />
        <Route
          path="/admin/*"
          element={<AdminToCms />}
        />
        <Route
          path="/cms/*"
          element={
            <RouteErrorBoundary label="cms">
              <Suspense fallback={<RouteFallback />}>
                <CmsApp />
              </Suspense>
            </RouteErrorBoundary>
          }
        />
        <Route
          path="*"
          element={
            <RouteErrorBoundary label="public">
              <PublicApp />
            </RouteErrorBoundary>
          }
        />
      </Routes>
      {analyticsReady ? (
        <Suspense fallback={null}>
          <Analytics beforeSend={publicPageViewsOnly} />
        </Suspense>
      ) : null}
    </BrowserRouter>
  )
}

import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Analytics, type BeforeSendEvent } from '@vercel/analytics/react'
import { ScrollToTop } from '@/components/layout/ScrollToTop'
import { PublicContentProvider } from '@/cms/PublicContentProvider'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { RouteFallback } from '@/components/ui/RouteFallback'
import { HomePage } from '@/pages/HomePage'

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

function PublicApp() {
  return (
    <PublicContentProvider>
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </PublicContentProvider>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/admin/*"
          element={<AdminToCms />}
        />
        <Route
          path="/cms/*"
          element={
            <ErrorBoundary label="cms">
              <Suspense fallback={<RouteFallback />}>
                <CmsApp />
              </Suspense>
            </ErrorBoundary>
          }
        />
        <Route
          path="*"
          element={
            <ErrorBoundary label="public">
              <PublicApp />
            </ErrorBoundary>
          }
        />
      </Routes>
      <Analytics beforeSend={publicPageViewsOnly} />
    </BrowserRouter>
  )
}

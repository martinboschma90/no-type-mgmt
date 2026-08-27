import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ScrollToTop } from '@/components/layout/ScrollToTop'
import { PublicContentProvider } from '@/cms/PublicContentProvider'
import { RouteFallback } from '@/components/ui/RouteFallback'
import { HomePage } from '@/pages/HomePage'

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
const ArtistPage = lazy(() =>
  import('@/pages/ArtistPage').then((m) => ({ default: m.ArtistPage })),
)
const CmsApp = lazy(() => import('@/CmsApp'))

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
          path="/cms/*"
          element={
            <Suspense fallback={<RouteFallback />}>
              <CmsApp />
            </Suspense>
          }
        />
        <Route path="*" element={<PublicApp />} />
      </Routes>
    </BrowserRouter>
  )
}

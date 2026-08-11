import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ScrollToTop } from '@/components/layout/ScrollToTop'
import { AuthProvider } from '@/cms/auth/AuthProvider'
import { CmsProvider } from '@/cms/CmsProvider'
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
const CmsLoginPage = lazy(() =>
  import('@/pages/CmsLoginPage').then((m) => ({ default: m.CmsLoginPage })),
)
const CmsShell = lazy(() =>
  import('@/cms/CmsShell').then((m) => ({ default: m.CmsShell })),
)

/** Minimal route fallback — avoid heavy BrandLoader + framer-motion on navigations. */
function RouteFallback() {
  return (
    <div
      className="min-h-svh bg-[var(--body-bg,#090909)]"
      aria-busy="true"
      aria-label="Loading"
    />
  )
}

function AppRoutes() {
  return (
    <>
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
          <Route path="/cms/login" element={<CmsLoginPage />} />
          <Route path="/cms/*" element={<CmsShell />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CmsProvider>
          <AppRoutes />
        </CmsProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

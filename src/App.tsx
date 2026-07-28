import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ScrollToTop } from '@/components/layout/ScrollToTop'
import { BrandLoader } from '@/components/ui/BrandLoader'
import { CmsProvider } from '@/cms/CmsProvider'
import { MediaProvider } from '@/cms/media/MediaProvider'
import { CmsLayout } from '@/cms/CmsLayout'
import { HomePage } from '@/pages/HomePage'
import { AboutPage } from '@/pages/AboutPage'
import { ContactPage } from '@/pages/ContactPage'
import { ArtistPage } from '@/pages/ArtistPage'

function AppRoutes() {
  const [booting, setBooting] = useState(
    () => !window.location.pathname.startsWith('/cms'),
  )

  useEffect(() => {
    if (!booting) return
    const t = window.setTimeout(() => setBooting(false), 900)
    return () => window.clearTimeout(t)
  }, [booting])

  return (
    <>
      <ScrollToTop />
      {booting && <BrandLoader />}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/artists" element={<Navigate to="/" replace />} />
        <Route path="/artists/:slug" element={<ArtistPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/cms/*" element={<CmsLayout />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <CmsProvider>
        <MediaProvider>
          <AppRoutes />
        </MediaProvider>
      </CmsProvider>
    </BrowserRouter>
  )
}

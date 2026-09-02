import { lazy, Suspense, useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/cms/auth/AuthProvider'
import { CmsProvider } from '@/cms/CmsProvider'
import { CmsThemeProvider } from '@/cms/flow-mates/CmsTheme'
import { ScrollToTop } from '@/components/layout/ScrollToTop'
import { RouteFallback } from '@/components/ui/RouteFallback'

const CmsLoginPage = lazy(() =>
  import('@/pages/CmsLoginPage').then((m) => ({ default: m.CmsLoginPage })),
)
const CmsShell = lazy(() =>
  import('@/cms/CmsShell').then((m) => ({ default: m.CmsShell })),
)

function CmsNoIndex() {
  useEffect(() => {
    const robots = document.createElement('meta')
    robots.name = 'robots'
    robots.content = 'noindex, nofollow, noarchive'
    document.head.appendChild(robots)
    return () => {
      robots.remove()
    }
  }, [])
  return null
}

export default function CmsApp() {
  return (
    <CmsThemeProvider>
      <AuthProvider>
        <CmsProvider>
          <CmsNoIndex />
          <ScrollToTop />
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="login" element={<CmsLoginPage />} />
              <Route path="*" element={<CmsShell />} />
            </Routes>
          </Suspense>
        </CmsProvider>
      </AuthProvider>
    </CmsThemeProvider>
  )
}

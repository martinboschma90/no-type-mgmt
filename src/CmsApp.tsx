import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/cms/auth/AuthProvider'
import { CmsProvider } from '@/cms/CmsProvider'
import { ScrollToTop } from '@/components/layout/ScrollToTop'
import { RouteFallback } from '@/components/ui/RouteFallback'

const CmsLoginPage = lazy(() =>
  import('@/pages/CmsLoginPage').then((m) => ({ default: m.CmsLoginPage })),
)
const CmsShell = lazy(() =>
  import('@/cms/CmsShell').then((m) => ({ default: m.CmsShell })),
)

export default function CmsApp() {
  return (
    <AuthProvider>
      <CmsProvider>
        <ScrollToTop />
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="login" element={<CmsLoginPage />} />
            <Route path="*" element={<CmsShell />} />
          </Routes>
        </Suspense>
      </CmsProvider>
    </AuthProvider>
  )
}

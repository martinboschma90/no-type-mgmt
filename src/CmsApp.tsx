import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/cms/auth/AuthProvider'
import { CmsProvider } from '@/cms/CmsProvider'
import { ScrollToTop } from '@/components/layout/ScrollToTop'

const CmsLoginPage = lazy(() =>
  import('@/pages/CmsLoginPage').then((m) => ({ default: m.CmsLoginPage })),
)
const CmsShell = lazy(() =>
  import('@/cms/CmsShell').then((m) => ({ default: m.CmsShell })),
)

function Fallback() {
  return (
    <div
      className="min-h-[100vh] bg-[var(--body-bg,#090909)]"
      aria-busy="true"
      aria-label="Loading"
    />
  )
}

export default function CmsApp() {
  return (
    <AuthProvider>
      <CmsProvider>
        <ScrollToTop />
        <Suspense fallback={<Fallback />}>
          <Routes>
            <Route path="/cms/login" element={<CmsLoginPage />} />
            <Route path="/cms/*" element={<CmsShell />} />
          </Routes>
        </Suspense>
      </CmsProvider>
    </AuthProvider>
  )
}

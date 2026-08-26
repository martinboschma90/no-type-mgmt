import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react'
import { Navbar } from '@/components/layout/Navbar'
import { GradientOverlay } from '@/components/layout/GradientOverlay'

const MenuOverlay = lazy(() =>
  import('@/components/layout/MenuOverlay').then((m) => ({
    default: m.MenuOverlay,
  })),
)
const Footer = lazy(() =>
  import('@/components/layout/Footer').then((m) => ({ default: m.Footer })),
)

type AppShellProps = {
  children: ReactNode
  navVariant?: 'hero' | 'mark' | 'wordmark'
  showFooter?: boolean
}

export function AppShell({
  children,
  navVariant = 'wordmark',
  showFooter = true,
}: AppShellProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuReady, setMenuReady] = useState(false)

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  const warmMenu = () => {
    if (menuReady) return
    setMenuReady(true)
    void import('@/components/layout/MenuOverlay')
  }

  return (
    <>
      <GradientOverlay />
      <div className="relative z-[1] min-h-svh bg-[var(--body-bg)] text-ink">
        <Navbar
          menuOpen={menuOpen}
          onMenuToggle={() => {
            warmMenu()
            setMenuOpen((v) => !v)
          }}
          onMenuIntent={warmMenu}
          variant={navVariant}
        />
        {menuReady ? (
          <Suspense fallback={null}>
            <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} />
          </Suspense>
        ) : null}
        <main>{children}</main>
        {showFooter ? (
          <Suspense fallback={null}>
            <Footer />
          </Suspense>
        ) : null}
      </div>
    </>
  )
}

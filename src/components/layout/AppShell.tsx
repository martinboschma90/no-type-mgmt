import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react'
import { Navbar } from '@/components/layout/Navbar'
import { GradientOverlay } from '@/components/layout/GradientOverlay'
import { MenuOverlay } from '@/components/layout/MenuOverlay'
import { StickyContactBar } from '@/components/layout/StickyContactBar'

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

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  return (
    <>
      <GradientOverlay />
      <div className="relative z-[1] min-h-svh bg-[var(--body-bg)] pb-20 text-ink sm:pb-24">
        <Navbar
          menuOpen={menuOpen}
          onMenuToggle={() => setMenuOpen((v) => !v)}
          variant={navVariant}
        />
        <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} />
        <main>{children}</main>
        {showFooter ? (
          <Suspense fallback={null}>
            <Footer />
          </Suspense>
        ) : null}
        <StickyContactBar />
      </div>
    </>
  )
}

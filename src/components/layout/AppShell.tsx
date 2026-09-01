import {
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
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
  const [footerReady, setFooterReady] = useState(false)
  const footerBoundaryRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  useEffect(() => {
    if (!showFooter) return
    const boundary = footerBoundaryRef.current
    if (!boundary || !window.IntersectionObserver) {
      setFooterReady(true)
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        setFooterReady(true)
        observer.disconnect()
      },
      { rootMargin: '500px 0px', threshold: 0 },
    )
    observer.observe(boundary)
    return () => observer.disconnect()
  }, [showFooter])

  return (
    <>
      <GradientOverlay />
      <div className="relative z-[1] min-h-svh bg-[var(--body-bg)] text-ink">
        <Navbar
          menuOpen={menuOpen}
          onMenuToggle={() => setMenuOpen((v) => !v)}
          variant={navVariant}
        />
        <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} />
        <main>{children}</main>
        {showFooter ? (
          <>
            <div
              ref={footerBoundaryRef}
              data-footer-boundary
              className="h-px"
              aria-hidden
            />
            {footerReady ? (
              <Suspense fallback={null}>
                <Footer />
              </Suspense>
            ) : null}
          </>
        ) : null}
        <StickyContactBar />
      </div>
    </>
  )
}

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
import { StickyContactBar } from '@/components/layout/StickyContactBar'
import { prefetchRoute } from '@/lib/prefetchRoute'

const Footer = lazy(() =>
  import('@/components/layout/Footer').then((m) => ({ default: m.Footer })),
)
const MenuOverlay = lazy(() =>
  import('@/components/layout/MenuOverlay').then((m) => ({ default: m.MenuOverlay })),
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
          onMenuToggle={() => {
            setMenuReady(true)
            prefetchRoute('/about')
            prefetchRoute('/contact')
            prefetchRoute('/booking')
            prefetchRoute('/faq')
            setMenuOpen((v) => !v)
          }}
          onMenuIntent={() => {
            setMenuReady(true)
            prefetchRoute('/about')
            prefetchRoute('/contact')
          }}
          variant={navVariant}
        />
        {menuReady ? (
          <Suspense fallback={null}>
            <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} />
          </Suspense>
        ) : null}
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

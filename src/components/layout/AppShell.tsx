import { useEffect, useState, type ReactNode } from 'react'
import { Navbar } from '@/components/layout/Navbar'
import { MenuOverlay } from '@/components/layout/MenuOverlay'
import { Footer } from '@/components/layout/Footer'
import { GradientOverlay } from '@/components/layout/GradientOverlay'

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
      <div className="relative z-[1] min-h-svh">
        <Navbar
          menuOpen={menuOpen}
          onMenuToggle={() => setMenuOpen((v) => !v)}
          variant={navVariant}
        />
        <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} />
        <main>{children}</main>
        {showFooter && <Footer />}
      </div>
    </>
  )
}

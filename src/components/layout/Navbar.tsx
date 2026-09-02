import { Link, useLocation } from 'react-router-dom'
import { Logo } from '@/components/ui/Logo'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

type NavbarProps = {
  menuOpen: boolean
  onMenuToggle: () => void
  onMenuIntent?: () => void
  variant?: 'hero' | 'mark' | 'wordmark'
}

export function Navbar({
  menuOpen,
  onMenuToggle,
  onMenuIntent,
}: NavbarProps) {
  const { pathname } = useLocation()
  const showBack = pathname !== '/'

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50">
      <div className="mx-auto flex max-w-[1600px] items-start justify-between px-4 pt-4 sm:px-6 sm:pt-5 lg:px-8">
        <div className="pointer-events-auto flex min-h-11 items-center gap-2.5 sm:gap-3">
          {showBack ? (
            <>
              <Link
                to="/"
                aria-label="Back to home"
                className="type-ui inline-flex h-11 items-center gap-1.5 rounded-full px-3.5 text-[0.65rem] tracking-[0.12em] text-ink uppercase transition-colors active:scale-95 sm:px-4"
                style={{ backgroundColor: 'var(--nav-chip)' }}
              >
                <span aria-hidden>←</span>
                Home
              </Link>
              <Link to="/" aria-label="NOTYPE MGMT — home">
                <Logo variant="auto" height={32} />
              </Link>
            </>
          ) : null}
        </div>

        <div className="pointer-events-auto flex items-center gap-2 sm:gap-3">
          <ThemeToggle />

          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-full backdrop-blur-sm transition-colors active:scale-95"
            style={{ backgroundColor: 'var(--nav-chip)' }}
            onPointerEnter={onMenuIntent}
            onTouchStart={onMenuIntent}
            onClick={onMenuToggle}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            <span className="relative flex h-[14px] w-5 flex-col items-stretch justify-between">
              <span
                className={`block h-[1.5px] w-full origin-center bg-ink transition-transform duration-200 ${
                  menuOpen ? 'translate-y-[6.25px] rotate-45' : ''
                }`}
              />
              <span
                className={`block h-[1.5px] w-full origin-center bg-ink transition-transform duration-200 ${
                  menuOpen ? '-translate-y-[6.25px] -rotate-45' : ''
                }`}
              />
            </span>
          </button>
        </div>
      </div>
    </header>
  )
}

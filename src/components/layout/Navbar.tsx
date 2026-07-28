import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Logo } from '@/components/ui/Logo'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

type NavbarProps = {
  menuOpen: boolean
  onMenuToggle: () => void
  /**
   * `hero` — only hamburger (logo lives in Hero)
   * `mark` — seal mark + hamburger
   * `wordmark` — theme-aware wordmark + hamburger
   */
  variant?: 'hero' | 'mark' | 'wordmark'
}

export function Navbar({
  menuOpen,
  onMenuToggle,
  variant = 'hero',
}: NavbarProps) {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50">
      <div className="mx-auto flex max-w-[1600px] items-start justify-between px-4 pt-4 sm:px-6 sm:pt-5 lg:px-8">
        <div className="pointer-events-auto min-h-11">
          {variant === 'mark' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <Link to="/" aria-label="No Type — home">
                <Logo variant="seal" height={44} />
              </Link>
            </motion.div>
          )}
          {variant === 'wordmark' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Link to="/" aria-label="No Type — home">
                <Logo variant="auto" height={32} />
              </Link>
            </motion.div>
          )}
        </div>

        <div className="pointer-events-auto flex items-center gap-2 sm:gap-3">
          <ThemeToggle />

          <motion.button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-full backdrop-blur-sm transition-colors"
            style={{
              backgroundColor: 'var(--nav-chip)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--nav-chip-hover)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--nav-chip)'
            }}
            onClick={onMenuToggle}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            whileTap={{ scale: 0.94 }}
          >
            <span className="relative flex h-[14px] w-5 flex-col items-stretch justify-between">
              <motion.span
                className="block h-[1.5px] w-full bg-ink"
                animate={
                  menuOpen ? { rotate: 45, y: 6.25 } : { rotate: 0, y: 0 }
                }
                transition={{ duration: 0.25 }}
              />
              <motion.span
                className="block h-[1.5px] w-full bg-ink"
                animate={
                  menuOpen ? { rotate: -45, y: -6.25 } : { rotate: 0, y: 0 }
                }
                transition={{ duration: 0.25 }}
              />
            </span>
          </motion.button>
        </div>
      </div>
    </header>
  )
}

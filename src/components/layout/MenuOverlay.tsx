import { Link, useLocation } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useCms } from '@/cms/CmsContext'
import { prefetchRoute } from '@/lib/prefetchRoute'

type MenuOverlayProps = {
  open: boolean
  onClose: () => void
}

export function MenuOverlay({ open, onClose }: MenuOverlayProps) {
  const { pathname } = useLocation()
  const { content } = useCms()
  const reduceMotion = useReducedMotion()
  const links = [
    { label: 'Artists', to: '/' },
    { label: 'About', to: '/about' },
    ...(content.site.bookingVisible !== false
      ? [{ label: 'Booking', to: '/booking' }]
      : []),
    ...(content.site.faqVisible !== false
      ? [{ label: 'FAQ', to: '/faq' }]
      : []),
    { label: 'Contact', to: '/contact' },
  ]

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-40 flex items-center justify-center backdrop-blur-md"
          style={{ backgroundColor: 'var(--menu-bg)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <nav className="flex flex-col items-center gap-6" aria-label="Primary">
            {links.map((link, i) => {
              const active = pathname === link.to
              return (
                <motion.div
                  key={link.to}
                  initial={reduceMotion ? false : { opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? undefined : { opacity: 0, y: 12 }}
                  transition={{
                    delay: reduceMotion ? 0 : 0.05 * i,
                    duration: reduceMotion ? 0.15 : 0.35,
                  }}
                >
                  <Link
                    to={link.to}
                    onClick={onClose}
                    onFocus={() => prefetchRoute(link.to)}
                    onMouseEnter={() => prefetchRoute(link.to)}
                    aria-current={active ? 'page' : undefined}
                    className={`type-display text-[clamp(2.75rem,8vw,5rem)] transition-opacity ${
                      active ? 'text-ink' : 'text-ink/35 hover:text-accent'
                    }`}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              )
            })}
          </nav>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

import { Link, useLocation } from 'react-router-dom'
import { useCms } from '@/cms/CmsContext'
import { prefetchRoute } from '@/lib/prefetchRoute'

type MenuOverlayProps = {
  open: boolean
  onClose: () => void
}

export function MenuOverlay({ open, onClose }: MenuOverlayProps) {
  const { pathname } = useLocation()
  const { content } = useCms()
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

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center backdrop-blur-md"
      style={{ backgroundColor: 'var(--menu-bg)' }}
    >
      <nav className="flex flex-col items-center gap-6" aria-label="Primary">
        {links.map((link) => {
          const active = pathname === link.to
          return (
            <Link
              key={link.to}
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
          )
        })}
      </nav>
    </div>
  )
}

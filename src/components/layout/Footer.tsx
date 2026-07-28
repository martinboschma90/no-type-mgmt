import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Logo } from '@/components/ui/Logo'
import { PillButton } from '@/components/ui/PillButton'
import { useCms } from '@/cms/CmsProvider'

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
      <path d="M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9A5.5 5.5 0 0 1 16.5 22h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2Zm0 2A3.5 3.5 0 0 0 4 7.5v9A3.5 3.5 0 0 0 7.5 20h9a3.5 3.5 0 0 0 3.5-3.5v-9A3.5 3.5 0 0 0 16.5 4h-9Zm9.25 1.75a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
    </svg>
  )
}

export function Footer() {
  const { content } = useCms()
  const { site } = content

  const scrollTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer className="relative mt-10 overflow-hidden pt-8">
      {/* Subtle purple atmosphere */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[40%] bg-[radial-gradient(ellipse_at_50%_100%,var(--glow-purple),transparent_65%)]"
        aria-hidden
      />

      <div className="relative mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex justify-center sm:mb-14">
          <motion.button
            type="button"
            onClick={scrollTop}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/40 text-ink transition-colors hover:bg-ink hover:text-ink-inverse"
            aria-label="Back to top"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.button>
        </div>

        <div className="grid grid-cols-1 gap-10 pb-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          <div>
            <Logo variant="auto" height={40} />
          </div>

          <div>
            <h3 className="type-label mb-3 text-ink">Contact us</h3>
            <ul className="type-body space-y-2 text-sm">
              {site.contact.map((item) => (
                <li key={item.email}>
                  <span className="text-ink/65">{item.label}: </span>
                  <a
                    href={`mailto:${item.email}`}
                    className="font-semibold text-ink underline-offset-2 hover:underline"
                  >
                    {item.email}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="type-label mb-3 text-ink">Newsletter</h3>
            <div className="flex flex-col items-start gap-2.5">
              {/* UI-only for now — no form backend */}
              <Link
                to="/contact"
                className="type-ui inline-flex min-w-[9.5rem] items-center justify-center rounded-full bg-ink px-5 py-2.5 text-xs text-ink-inverse transition-colors hover:bg-ink/85"
              >
                Subscribe
              </Link>
              <PillButton href={site.instagram} target="_blank" rel="noreferrer" className="min-w-[9.5rem]">
                <InstagramIcon />
                Instagram
              </PillButton>
            </div>
          </div>

          <div>
            <h3 className="type-label mb-3 text-ink">Legal</h3>
            <div className="type-body space-y-1 text-sm text-ink/80">
              <p>{site.legal.company}</p>
              <p>{site.legal.vat}</p>
              {site.legal.addressLines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-ink/10 py-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="type-label text-ink/40">
            ©{site.year} {site.name}
          </p>
          <nav className="type-label flex flex-wrap gap-x-5 gap-y-2 text-ink">
            {site.legalLinks.map((link) => (
              <a key={link.href} href={link.href} className="hover:opacity-60">
                {link.label}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  )
}

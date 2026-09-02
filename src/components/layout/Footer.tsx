import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '@/components/ui/Logo'
import { OptimizedImg } from '@/components/ui/OptimizedImg'
import { PillButton } from '@/components/ui/PillButton'
import { useCms } from '@/cms/CmsContext'
import { useResolvedMediaUrl } from '@/cms/media/useResolvedMediaUrl'
import {
  buildWhatsAppUrl,
  DEFAULT_WHATSAPP_NUMBER,
  normalizeWhatsAppDigits,
} from '@/data/whatsapp'

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
      <path d="M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9A5.5 5.5 0 0 1 16.5 22h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2Zm0 2A3.5 3.5 0 0 0 4 7.5v9A3.5 3.5 0 0 0 7.5 20h9a3.5 3.5 0 0 0 3.5-3.5v-9A3.5 3.5 0 0 0 16.5 4h-9Zm9.25 1.75a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
    </svg>
  )
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
      <path d="M12.04 2C6.58 2 2.15 6.4 2.15 11.82c0 1.96.52 3.87 1.52 5.55L2 22l4.8-1.55a9.9 9.9 0 0 0 5.24 1.45h.01c5.46 0 9.89-4.4 9.89-9.82C21.94 6.4 17.5 2 12.04 2Zm5.75 13.95c-.24.67-1.4 1.23-1.93 1.31-.49.07-1.12.1-1.81-.11-.42-.13-.95-.31-1.64-.6-2.88-1.25-4.76-4.15-4.9-4.34-.14-.2-1.15-1.53-1.15-2.92 0-1.39.73-2.07.99-2.35.26-.28.56-.35.75-.35h.54c.17 0 .4-.06.63.48.24.56.8 1.94.87 2.08.07.14.12.3.02.49-.1.2-.14.32-.28.49-.14.17-.3.38-.42.51-.14.14-.28.29-.12.57.16.28.72 1.19 1.55 1.93 1.06.95 1.96 1.24 2.24 1.38.28.14.44.12.6-.07.17-.2.7-.81.88-1.09.19-.28.37-.23.63-.14.26.1 1.66.78 1.95.93.28.14.47.21.54.33.07.12.07.69-.17 1.36Z" />
    </svg>
  )
}

function ContactBlock({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <li>
      <p className="type-label text-[0.65rem] tracking-[0.14em] text-ink/45">
        {label}
      </p>
      <div className="mt-1 font-semibold text-ink">{children}</div>
    </li>
  )
}

function ColumnHeading({ children }: { children: ReactNode }) {
  return <h3 className="type-label mb-4 text-ink">{children}</h3>
}

export function Footer() {
  const { content } = useCms()
  const { site } = content
  const customLogoUrl = useResolvedMediaUrl(site.logoUrl)
  const brandName = site.fullName.trim() || site.name.trim() || 'NOTYPE MGMT'
  const copyright =
    site.copyrightText.trim() || `© ${site.year} ${brandName}`
  const phone = site.phoneNumber?.trim() || DEFAULT_WHATSAPP_NUMBER
  const whatsapp = site.whatsappNumber?.trim() || DEFAULT_WHATSAPP_NUMBER
  const phoneDigits = normalizeWhatsAppDigits(phone)
  const whatsappHref = buildWhatsAppUrl(
    whatsapp,
    'Hi NOTYPE MGMT, I would like to know more about booking an artist.',
  )
  const officeLines = site.legal.addressLines.filter((line) => line.trim())
  const privacyLink =
    site.legalLinks.find((link) => /privacy/i.test(link.label)) ??
    site.legalLinks[0]

  return (
    <footer className="mt-10 border-t border-white/10 bg-[#090909] pt-12 text-white [--color-accent:#d8ff3e] [--color-ink:#f5f5f5]">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 pb-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10">
          {/* Brand */}
          <div>
            {customLogoUrl ? (
              <OptimizedImg
                src={customLogoUrl}
                alt={brandName}
                width={86}
                height={40}
                size="thumb"
                className="block h-10 w-auto max-w-full object-contain"
                loading="lazy"
                decoding="async"
                draggable={false}
              />
            ) : (
              <Logo variant="wordmark" height={40} />
            )}
            <p className="type-label mt-5 whitespace-pre-line text-ink/50">
              {site.tagline}
            </p>
          </div>

          {/* Contact */}
          <div>
            <ColumnHeading>Contact</ColumnHeading>
            <ul className="type-body space-y-4 text-sm">
              {site.contact.map((item) => (
                <ContactBlock
                  key={`${item.label}-${item.email}`}
                  label={item.label}
                >
                  <a
                    href={`mailto:${item.email}`}
                    className="underline-offset-2 hover:text-accent hover:underline"
                  >
                    {item.email}
                  </a>
                </ContactBlock>
              ))}

              {phone ? (
                <ContactBlock label="Phone">
                  <a
                    href={phoneDigits ? `tel:+${phoneDigits}` : undefined}
                    className="underline-offset-2 hover:text-accent hover:underline"
                  >
                    {phone}
                  </a>
                </ContactBlock>
              ) : null}
            </ul>
          </div>

          {/* Connect */}
          <div>
            <ColumnHeading>Connect</ColumnHeading>
            <div className="flex flex-col items-start gap-2.5">
              <PillButton
                href={site.instagram}
                variant="ghost"
                target="_blank"
                rel="noreferrer"
                className="min-w-[10.5rem]"
              >
                <InstagramIcon />
                Instagram
              </PillButton>
              <PillButton
                href={whatsappHref}
                variant="ghost"
                target="_blank"
                rel="noreferrer"
                className="min-w-[10.5rem]"
              >
                <WhatsAppIcon />
                WhatsApp
              </PillButton>
            </div>
          </div>

          {/* Office / Legal */}
          <div className="space-y-8">
            {officeLines.length > 0 ? (
              <div>
                <ColumnHeading>Office</ColumnHeading>
                <div className="type-body space-y-0.5 text-sm font-semibold text-ink">
                  {officeLines.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              </div>
            ) : null}

            <div>
              <ColumnHeading>Legal</ColumnHeading>
              <nav className="type-body flex flex-col gap-2 text-sm text-ink/80">
                {site.legalLinks.map((link) => (
                  <a
                    key={`${link.label}-${link.href}`}
                    href={link.href}
                    className="underline-offset-2 hover:text-accent hover:underline"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-ink/10 py-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="type-label text-ink/40">{copyright}</p>
          <nav className="type-label flex flex-wrap gap-x-5 gap-y-2 text-ink">
            {site.faqVisible !== false ? (
              <Link to="/faq" className="transition-colors hover:text-accent">
                FAQ
              </Link>
            ) : null}
            {privacyLink ? (
              <a
                href={privacyLink.href}
                className="transition-colors hover:text-accent"
              >
                Privacy
              </a>
            ) : null}
          </nav>
        </div>
      </div>
    </footer>
  )
}

import { useEffect, useRef, useState } from 'react'
import { useCms } from '@/cms/CmsContext'
import { normalizeWhatsAppDigits } from '@/data/whatsapp'
import { Logo } from '@/components/ui/Logo'

export function StickyContactBar() {
  const { content } = useCms()
  const { site } = content
  const barRef = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(false)
  const bookingContact =
    site.contact.find((item) => /book/i.test(item.label)) ?? site.contact[0]
  const email = bookingContact?.email?.trim() || ''
  const instagram = site.instagram?.trim() || ''
  const phone = site.phoneNumber?.trim() || ''
  const phoneDigits = normalizeWhatsAppDigits(phone)

  useEffect(() => {
    const view = barRef.current?.ownerDocument.defaultView ?? window
    const document = barRef.current?.ownerDocument ?? window.document
    const footer =
      document.querySelector('[data-footer-boundary]') ??
      document.querySelector('footer')
    let previousY = view.scrollY
    let footerInView = false
    const update = () => {
      const currentY = view.scrollY
      footerInView = Boolean(
        footer && footer.getBoundingClientRect().top <= view.innerHeight + 12,
      )
      if (currentY <= 120 || footerInView) {
        setVisible(false)
      } else if (currentY < previousY - 3) {
        setVisible(true)
      } else if (currentY > previousY + 3) {
        setVisible(false)
      }
      previousY = currentY
    }
    const observer =
      footer && view.IntersectionObserver
        ? new view.IntersectionObserver(
            ([entry]) => {
              footerInView = entry.isIntersecting
              if (footerInView) setVisible(false)
            },
            { rootMargin: '0px 0px 96px 0px', threshold: 0 },
          )
        : null
    if (footer && observer) observer.observe(footer)
    view.addEventListener('scroll', update, { passive: true })
    return () => {
      view.removeEventListener('scroll', update)
      observer?.disconnect()
    }
  }, [])

  return (
    <aside
      ref={barRef}
      className={`fixed inset-x-0 bottom-0 z-30 px-2 pb-2 transition-[transform,opacity] duration-500 ease-out sm:px-3 sm:pb-3 ${
        visible
          ? 'translate-y-0 opacity-100'
          : 'pointer-events-none translate-y-[calc(100%+1rem)] opacity-0'
      }`}
    >
      <div className="mx-auto max-w-[1500px] overflow-hidden rounded-[1.5rem] bg-[#090909]/97 text-white shadow-[0_-12px_50px_rgba(0,0,0,0.3)] ring-1 ring-inset ring-white/10 backdrop-blur-xl">
        <div className="grid min-h-16 grid-cols-3 sm:min-h-20">
          <div className="flex items-center gap-3 px-3 sm:px-6">
            <Logo
              variant="wordmark"
              height={18}
              className="hidden shrink-0 sm:block"
            />
            <p className="type-body text-[9px] leading-[1.3] text-white/55 sm:text-[11px]">
              <span className="type-headline text-[10px] text-brand sm:hidden">
                NOTYPE
              </span>
              <br className="sm:hidden" />
              Artist agency
              <br />
              Groningen, Netherlands
            </p>
          </div>

          <div className="flex items-center justify-center px-2 text-center sm:px-6">
            {email ? (
              <div className="type-body text-[9px] leading-[1.3] text-white/55 sm:text-[11px]">
                <span className="type-label text-[9px] tracking-[0.1em] text-white">
                  Contact &amp; bookings
                </span>
                {email ? (
                  <>
                    <br />
                    <a
                      href={`mailto:${email}`}
                      className="break-all transition-colors hover:text-brand sm:break-normal"
                    >
                      {email}
                    </a>
                  </>
                ) : null}
                {phone ? (
                  <>
                    <br />
                    <a
                      href={phoneDigits ? `tel:+${phoneDigits}` : undefined}
                      className="whitespace-nowrap transition-colors hover:text-brand"
                    >
                      {phone}
                    </a>
                  </>
                ) : null}
              </div>
            ) : (
              <span className="text-[9px] text-white/80 sm:text-xs">
                Contact &amp; bookings
              </span>
            )}
          </div>

          <div className="flex items-center justify-center px-3 text-center sm:px-6">
            {instagram ? (
              <a
                href={instagram}
                target="_blank"
                rel="noreferrer"
                className="type-body text-[9px] leading-[1.3] text-white/55 transition-colors hover:text-brand sm:text-[11px]"
              >
                Follow us on
                <br />
                <span className="type-label text-[9px] tracking-[0.1em] text-white">
                  Instagram ↗
                </span>
              </a>
            ) : (
              <span className="text-[9px] leading-[1.18] text-white/80 sm:text-xs">
                Follow us on
                <br />
                Instagram
              </span>
            )}
          </div>
        </div>
      </div>
    </aside>
  )
}

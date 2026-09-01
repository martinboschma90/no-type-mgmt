import { useEffect, useRef, useState } from 'react'
import { useCms } from '@/cms/CmsContext'
import { normalizeWhatsAppDigits } from '@/data/whatsapp'

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
    let previousY = view.scrollY
    const update = () => {
      const currentY = view.scrollY
      if (currentY <= 120) {
        setVisible(false)
      } else if (currentY < previousY - 3) {
        setVisible(true)
      } else if (currentY > previousY + 3) {
        setVisible(false)
      }
      previousY = currentY
    }
    view.addEventListener('scroll', update, { passive: true })
    return () => view.removeEventListener('scroll', update)
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
      <div className="relative mx-auto max-w-[1500px] overflow-hidden rounded-[1.5rem] border border-brand/25 bg-[#090909]/96 text-white shadow-[0_-12px_50px_rgba(0,0,0,0.28)] backdrop-blur-xl">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              'radial-gradient(circle at 7% 15%, rgb(216 255 62 / 0.32), transparent 28%), radial-gradient(circle at 42% 125%, rgb(168 72 122 / 0.35), transparent 32%)',
          }}
          aria-hidden
        />

        <div className="relative grid min-h-16 grid-cols-3 sm:min-h-20">
          <div className="flex items-center border-r border-white/10 px-3 sm:px-6">
            <p className="type-body text-[9px] leading-[1.18] text-white/70 sm:text-xs">
              <span className="type-ui font-semibold tracking-[0.04em] text-brand">
                NOTYPE MGMT
              </span>
              <br />
              Artist agency
              <br className="sm:hidden" /> based in Groningen, Netherlands
            </p>
          </div>

          <div className="flex items-center justify-center border-r border-white/10 px-2 text-center sm:px-6">
            {email ? (
              <div className="type-body text-[9px] leading-[1.25] text-white/75 sm:text-xs">
                <span className="type-ui text-white">Contact &amp; bookings</span>
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
                    <span className="mx-1.5 text-white/25">·</span>
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
                className="type-body text-[9px] leading-[1.18] text-white/75 transition-colors hover:text-brand sm:text-xs"
              >
                Follow us on
                <br />
                <span className="type-ui font-medium text-white">Instagram ↗</span>
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

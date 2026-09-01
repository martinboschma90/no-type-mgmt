import { useCms } from '@/cms/CmsContext'

export function StickyContactBar() {
  const { content } = useCms()
  const { site } = content
  const bookingContact =
    site.contact.find((item) => /book/i.test(item.label)) ?? site.contact[0]
  const email = bookingContact?.email?.trim() || ''
  const instagram = site.instagram?.trim() || ''

  return (
    <aside className="fixed inset-x-0 bottom-0 z-30 px-2 pb-2 sm:px-3 sm:pb-3">
      <div className="relative mx-auto max-w-[1500px] overflow-hidden rounded-[1.25rem] border border-white/10 bg-[#090909]/95 text-white shadow-[0_-12px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              'radial-gradient(circle at 9% 10%, rgb(119 171 116 / 0.65), transparent 27%), radial-gradient(circle at 42% 125%, rgb(168 72 122 / 0.28), transparent 31%)',
          }}
          aria-hidden
        />

        <div className="relative grid min-h-16 grid-cols-3 sm:min-h-20">
          <div className="flex items-center border-r border-white/10 px-3 sm:px-6">
            <p className="text-[9px] leading-[1.18] text-white/75 sm:text-xs">
              <span className="font-semibold text-white">NOTYPE MGMT</span>
              <br />
              Artist agency
              <br className="sm:hidden" /> based in Groningen, Netherlands
            </p>
          </div>

          <div className="flex items-center justify-center border-r border-white/10 px-2 text-center sm:px-6">
            {email ? (
              <a
                href={`mailto:${email}`}
                className="text-[9px] leading-[1.18] text-white/80 transition-colors hover:text-brand sm:text-xs"
              >
                <span className="text-white">Contact &amp; bookings</span>
                <br />
                <span className="break-all sm:break-normal">{email}</span>
              </a>
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
                className="text-[9px] leading-[1.18] text-white/80 transition-colors hover:text-brand sm:text-xs"
              >
                Follow us on
                <br />
                <span className="font-medium text-white">Instagram</span>
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

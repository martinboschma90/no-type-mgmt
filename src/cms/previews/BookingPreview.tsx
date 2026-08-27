import { motion } from 'framer-motion'
import { BookingForm } from '@/components/booking/BookingForm'
import { useCms } from '@/cms/CmsProvider'
import { PreviewFrame } from '@/cms/previews/PreviewFrame'

export function BookingPreview() {
  const { content } = useCms()
  const { site } = content
  const title = site.bookingTitle.trim() || 'Booking Request'
  const intro =
    site.bookingIntro.trim() ||
    "Send us your booking request and we'll get back to you."

  return (
    <PreviewFrame label="Booking">
      <div className="px-4 pb-16 pt-14 sm:px-6">
        <div className="mx-auto max-w-[820px]">
          {!site.bookingVisible ? (
            <p className="type-body mb-4 rounded-xl border border-ink/10 bg-ink/5 px-3 py-2 text-xs text-ink/50">
              Page hidden — /booking redirects home.
            </p>
          ) : null}

          <motion.header className="mb-7 max-w-lg" initial={false}>
            <h1 className="type-display text-[clamp(1.5rem,3.5vw,2.1rem)] text-ink">
              {title}
            </h1>
            <p className="type-body mt-2 text-sm text-ink/60">{intro}</p>
          </motion.header>

          <BookingForm />
        </div>
      </div>
    </PreviewFrame>
  )
}

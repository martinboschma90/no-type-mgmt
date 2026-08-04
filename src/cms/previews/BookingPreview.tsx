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
        <div className="mx-auto max-w-[1200px]">
          {!site.bookingVisible ? (
            <p className="type-body mb-4 rounded-xl border border-ink/10 bg-ink/5 px-3 py-2 text-xs text-ink/50">
              Page hidden — /booking redirects home.
            </p>
          ) : null}

          <motion.header className="mb-10 max-w-xl" initial={false}>
            <h1 className="type-display text-[clamp(1.75rem,4vw,2.5rem)] text-ink">
              {title}
            </h1>
            <p className="type-body mt-3 text-base text-ink/60">{intro}</p>
          </motion.header>

          <BookingForm />
        </div>
      </div>
    </PreviewFrame>
  )
}

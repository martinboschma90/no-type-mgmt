import { Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AppShell } from '@/components/layout/AppShell'
import { BookingForm } from '@/components/booking/BookingForm'
import { useCms } from '@/cms/CmsContext'

export function BookingPage() {
  const { content } = useCms()
  const { site } = content

  if (site.bookingVisible === false) {
    return <Navigate to="/" replace />
  }

  const title = site.bookingTitle.trim() || 'Booking Request'
  const intro =
    site.bookingIntro.trim() ||
    "Send us your booking request and we'll get back to you."

  return (
    <AppShell navVariant="wordmark">
      <div className="booking-page px-4 pb-20 pt-24 sm:px-6 sm:pt-28 lg:px-8">
        <div className="mx-auto max-w-[1200px]">
          <motion.header
            className="mb-10 max-w-xl sm:mb-14"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <h1 className="type-display text-[clamp(2rem,5vw,3.25rem)] text-ink">
              {title}
            </h1>
            <p className="type-body mt-4 text-base text-ink/60">{intro}</p>
          </motion.header>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <BookingForm />
          </motion.div>
        </div>
      </div>
    </AppShell>
  )
}

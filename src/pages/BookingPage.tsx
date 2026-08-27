import { Navigate } from 'react-router-dom'
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
      <div className="booking-page px-4 pb-16 pt-24 sm:px-6 sm:pt-28 lg:px-8">
        <div className="mx-auto max-w-[820px]">
          <header className="mb-7 max-w-lg sm:mb-8">
            <h1 className="type-display text-[clamp(1.75rem,4.2vw,2.6rem)] text-ink">
              {title}
            </h1>
            <p className="type-body mt-2 text-sm text-ink/60 sm:text-[0.95rem]">{intro}</p>
          </header>

          <BookingForm />
        </div>
      </div>
    </AppShell>
  )
}

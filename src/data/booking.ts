import type { BookingRequestPayload } from '@/types/booking'

/** Inbox for completed booking requests. */
export const BOOKING_REQUEST_EMAIL = 'martin@notype-mgmt.com'

export function formatBookingEmailBody(payload: BookingRequestPayload): string {
  const lines: string[] = [
    'NEW BOOKING REQUEST — NOTYPE MGMT',
    `Submitted: ${payload.submittedAt}`,
    '',
    '— SELECTED ARTISTS —',
    ...payload.artists.map((a) => `• ${a.name}`),
    '',
    '— OFFERS —',
    ...payload.offers.map((o) => {
      const notes = o.notes.trim() ? ` | Notes: ${o.notes.trim()}` : ''
      return `• ${o.artistName}: €${o.offer.trim() || '—'}${notes}`
    }),
    '',
    '— COMPANY —',
    `Company / Promoter: ${payload.company.companyName}`,
    `Contact Person: ${payload.company.contactPerson}`,
    `Email: ${payload.company.email}`,
    `Phone: ${payload.company.phone}`,
    `Website: ${payload.company.website || '—'}`,
    `Instagram: ${payload.company.instagram || '—'}`,
    '',
    '— EVENT —',
    `Event Name: ${payload.event.eventName}`,
    `Event Type: ${payload.event.eventType}`,
    `Venue Type: ${payload.event.venueType}`,
    `Country: ${payload.event.country}`,
    `City: ${payload.event.city}`,
    `Venue / Location: ${payload.event.venue}`,
    `Event Date: ${payload.event.eventDate}`,
    `PAX: ${payload.event.pax}`,
    `Additional Information: ${payload.event.additionalInfo || '—'}`,
  ]
  return lines.join('\n')
}

export function formatBookingEmailSubject(payload: BookingRequestPayload): string {
  const artists = payload.artists.map((a) => a.name).join(', ')
  const event = payload.event.eventName.trim() || 'Untitled event'
  return `Booking request: ${artists || 'Artists'} — ${event}`
}

export async function submitBookingRequest(
  payload: BookingRequestPayload,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const res = await fetch('/api/booking-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as {
        error?: string
        emailed?: boolean
      } | null
      return { ok: false, error: data?.error || `Submit failed (${res.status})` }
    }
    const data = (await res.json().catch(() => null)) as { emailed?: boolean } | null
    if (data && data.emailed === false) {
      return { ok: false, error: 'Request was saved, but email could not be sent.' }
    }
    return { ok: true }
  } catch {
    return { ok: false, error: 'Network error while submitting request.' }
  }
}

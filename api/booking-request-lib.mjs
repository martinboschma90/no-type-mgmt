export const BOOKING_REQUEST_EMAIL = 'martin@notype-mgmt.com'

export function formatBookingEmailBody(payload) {
  const lines = [
    'NEW BOOKING REQUEST — NOTYP MGMT',
    `Submitted: ${payload.submittedAt}`,
    '',
    '— SELECTED ARTISTS —',
    ...payload.artists.map((a) => `• ${a.name}`),
    '',
    '— OFFERS —',
    ...payload.offers.map((o) => {
      const notes = o.notes?.trim() ? ` | Notes: ${o.notes.trim()}` : ''
      return `• ${o.artistName}: €${String(o.offer || '').trim() || '—'}${notes}`
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

export function formatBookingEmailSubject(payload) {
  const artists = payload.artists.map((a) => a.name).join(', ')
  const event = String(payload.event.eventName || '').trim() || 'Untitled event'
  return `Booking request: ${artists || 'Artists'} — ${event}`
}

export function isValidBookingPayload(payload) {
  if (!payload || typeof payload !== 'object') return false
  if (!Array.isArray(payload.artists) || payload.artists.length === 0) return false
  if (!Array.isArray(payload.offers) || payload.offers.length === 0) return false
  if (!payload.company || !payload.event) return false

  const c = payload.company
  const e = payload.event
  const requiredCompany = [
    c.companyName,
    c.contactPerson,
    c.email,
    c.phone,
  ].every((v) => String(v || '').trim())
  const requiredEvent = [
    e.eventName,
    e.eventType,
    e.venueType,
    e.country,
    e.city,
    e.venue,
    e.eventDate,
    e.pax,
  ].every((v) => String(v || '').trim())
  const offersOk = payload.offers.every(
    (o) => o && String(o.artistId || '') && String(o.offer || '').trim(),
  )
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(c.email || '').trim())
  const withinLimits = [
    c.companyName,
    c.contactPerson,
    c.email,
    c.phone,
    c.website,
    c.instagram,
    e.eventName,
    e.additionalInfo,
  ].every((value) => String(value || '').length < 2000)

  return requiredCompany && requiredEvent && offersOk && emailOk && withinLimits
}

export async function sendBookingEmail({ subject, text, replyTo }) {
  const inbox = String(
    process.env.BOOKING_TO_EMAIL || BOOKING_REQUEST_EMAIL,
  ).trim()
  const cc = String(replyTo || '').trim()
  const copy =
    cc && cc.toLowerCase() !== inbox.toLowerCase() ? [cc] : []

  const resendKey = process.env.RESEND_API_KEY
  if (resendKey) {
    const from =
      process.env.BOOKING_FROM_EMAIL || 'NOTYPE MGMT <onboarding@resend.dev>'
    const body = {
      from,
      to: [inbox],
      subject,
      text,
    }
    if (copy.length) body.cc = copy
    if (cc) body.reply_to = cc

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    if (!response.ok) {
      const detail = await response.text().catch(() => '')
      return {
        ok: false,
        error: `Email provider error (${response.status})${detail ? `: ${detail}` : ''}`,
      }
    }
    return { ok: true }
  }

  const form = {
    _subject: subject,
    _template: 'table',
    _captcha: 'false',
    _replyto: cc || inbox,
    message: text,
    from_name: 'NOTYPE booking form',
  }
  if (copy.length) form._cc = copy[0]

  const response = await fetch(
    `https://formsubmit.co/ajax/${encodeURIComponent(inbox)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(form),
    },
  )
  const payload = await response.json().catch(() => null)
  const success =
    response.ok &&
    payload &&
    payload.success !== false &&
    payload.success !== 'false'
  if (!success) {
    return {
      ok: false,
      error:
        payload?.message ||
        'Could not deliver booking email. Add RESEND_API_KEY for inbox delivery.',
    }
  }
  return { ok: true }
}

import {
  formatBookingEmailBody,
  formatBookingEmailSubject,
  isValidBookingPayload,
  sendBookingEmail,
} from './booking-request-lib.mjs'
import { recordBookingRequest } from './booking-stats-lib.mjs'
import { json, rateLimit, setCors, allowedOrigin } from './http-security.mjs'

export default async function handler(req, res) {
  const origin = req.headers.origin
  setCors(res, origin)

  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return
  }

  if (req.method !== 'POST') {
    json(res, 405, { error: 'Method not allowed' })
    return
  }

  if (!allowedOrigin(origin)) {
    json(res, 403, { error: 'Forbidden' })
    return
  }

  if (!rateLimit(req)) {
    json(res, 429, { error: 'Too many booking requests. Try again later.' })
    return
  }

  try {
    const payload =
      typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {}

    if (!isValidBookingPayload(payload)) {
      json(res, 400, { error: 'Invalid booking request payload.' })
      return
    }

    const subject = formatBookingEmailSubject(payload)
    const text = formatBookingEmailBody(payload)
    const replyTo = String(payload.company.email).trim()

    const stored = await recordBookingRequest(payload).catch(() => false)
    const sent = await sendBookingEmail({ subject, text, replyTo })
    if (!stored && !sent.ok) {
      json(res, 502, {
        error: sent.error || 'Could not send booking request.',
      })
      return
    }

    json(res, 200, { ok: true, emailed: Boolean(sent.ok) })
  } catch {
    json(res, 500, { error: 'Failed to submit booking request.' })
  }
}

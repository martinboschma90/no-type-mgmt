import {
  BOOKING_REQUEST_EMAIL,
  formatBookingEmailBody,
  formatBookingEmailSubject,
  isValidBookingPayload,
} from './booking-request-lib.mjs'

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    res.end()
    return
  }

  if (req.method !== 'POST') {
    res.statusCode = 405
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Method not allowed' }))
    return
  }

  try {
    const payload =
      typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {}

    if (!isValidBookingPayload(payload)) {
      res.statusCode = 400
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: 'Invalid booking request payload.' }))
      return
    }

    const subject = formatBookingEmailSubject(payload)
    const text = formatBookingEmailBody(payload)
    const replyTo = String(payload.company.email).trim()

    const sent = await sendBookingEmail({ subject, text, replyTo })
    if (!sent.ok) {
      res.statusCode = 502
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: sent.error }))
      return
    }

    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ ok: true }))
  } catch (error) {
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json')
    res.end(
      JSON.stringify({
        error: error?.message || 'Failed to submit booking request.',
      }),
    )
  }
}

async function sendBookingEmail({ subject, text, replyTo }) {
  const resendKey = process.env.RESEND_API_KEY
  if (resendKey) {
    const from =
      process.env.BOOKING_FROM_EMAIL || 'No Type Booking <onboarding@resend.dev>'
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [BOOKING_REQUEST_EMAIL],
        reply_to: replyTo,
        subject,
        text,
      }),
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

  // Fallback without API keys — FormSubmit (requires one-time inbox confirmation).
  const response = await fetch(
    `https://formsubmit.co/ajax/${encodeURIComponent(BOOKING_REQUEST_EMAIL)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        _subject: subject,
        message: text,
        email: replyTo,
        _template: 'table',
      }),
    },
  )

  if (!response.ok) {
    return {
      ok: false,
      error:
        'Could not deliver booking email. Configure RESEND_API_KEY or confirm FormSubmit for the inbox.',
    }
  }

  return { ok: true }
}

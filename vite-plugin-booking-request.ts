import type { Plugin } from 'vite'
import type { IncomingMessage } from 'node:http'
import {
  BOOKING_REQUEST_EMAIL,
  formatBookingEmailBody,
  formatBookingEmailSubject,
  isValidBookingPayload,
} from './api/booking-request-lib.mjs'

async function readJsonBody(req: IncomingMessage) {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw) return {}
  return JSON.parse(raw) as Record<string, unknown>
}

async function sendBookingEmail({
  subject,
  text,
  replyTo,
}: {
  subject: string
  text: string
  replyTo: string
}) {
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
        ok: false as const,
        error: `Email provider error (${response.status})${detail ? `: ${detail}` : ''}`,
      }
    }
    return { ok: true as const }
  }

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
      ok: false as const,
      error:
        'Could not deliver booking email. Configure RESEND_API_KEY or confirm FormSubmit for the inbox.',
    }
  }

  return { ok: true as const }
}

/** Dev middleware mirroring `/api/booking-request` on Vercel. */
export function bookingRequestPlugin(): Plugin {
  return {
    name: 'booking-request-api',
    configureServer(server) {
      server.middlewares.use('/api/booking-request', async (req, res) => {
        if (req.method === 'OPTIONS') {
          res.statusCode = 204
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
          const payload = await readJsonBody(req)
          if (!isValidBookingPayload(payload)) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Invalid booking request payload.' }))
            return
          }

          const subject = formatBookingEmailSubject(payload)
          const text = formatBookingEmailBody(payload)
          const replyTo = String(
            (payload as { company?: { email?: string } }).company?.email || '',
          ).trim()

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
              error:
                error instanceof Error
                  ? error.message
                  : 'Failed to submit booking request.',
            }),
          )
        }
      })
    },
  }
}

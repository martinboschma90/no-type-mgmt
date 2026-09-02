import type { Plugin } from 'vite'
import type { IncomingMessage } from 'node:http'
import {
  formatBookingEmailBody,
  formatBookingEmailSubject,
  isValidBookingPayload,
  sendBookingEmail,
} from './api/booking-request-lib.mjs'
import { recordBookingRequest } from './api/booking-stats-lib.mjs'

async function readJsonBody(req: IncomingMessage) {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw) return {}
  return JSON.parse(raw) as Record<string, unknown>
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

          const stored = await recordBookingRequest(payload).catch(() => false)
          const sent = await sendBookingEmail({ subject, text, replyTo })
          if (!sent.ok) {
            res.statusCode = 502
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: sent.error, stored: Boolean(stored) }))
            return
          }

          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ ok: true, emailed: true }))
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

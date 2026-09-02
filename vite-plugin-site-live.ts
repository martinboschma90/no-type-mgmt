import type { Plugin } from 'vite'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { applyServerEnv } from './api/cms-session.mjs'
import { handleRum } from './api/rum-lib.mjs'
import { handleSiteLive } from './api/site-live.js'
import { handleSiteSpeed } from './api/site-speed.js'

async function readJsonBody(req: IncomingMessage) {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw) return {}
  return JSON.parse(raw) as Record<string, unknown>
}

function attachQuery(
  req: IncomingMessage & { body?: unknown; query?: Record<string, string> },
) {
  const url = new URL(req.url || '/', 'http://localhost')
  req.query = Object.fromEntries(url.searchParams)
}

export function siteLivePlugin(env?: Record<string, string>): Plugin {
  if (env) applyServerEnv(env)
  return {
    name: 'site-live-api',
    configureServer(server) {
      if (env) applyServerEnv(env)
      server.middlewares.use('/api/rum', async (req, res) => {
        if (env) applyServerEnv(env)
        const nodeReq = req as IncomingMessage & {
          body?: unknown
          query?: Record<string, string>
        }
        attachQuery(nodeReq)
        if (req.method === 'POST') {
          nodeReq.body = await readJsonBody(req as IncomingMessage)
        }
        await handleRum(nodeReq, res as ServerResponse)
      })
      server.middlewares.use('/api/site-speed', async (req, res) => {
        if (env) applyServerEnv(env)
        const nodeReq = req as IncomingMessage & {
          body?: unknown
          query?: Record<string, string>
        }
        attachQuery(nodeReq)
        if (req.method === 'POST') {
          nodeReq.body = await readJsonBody(req as IncomingMessage)
        }
        await handleSiteSpeed(
          nodeReq,
          res as ServerResponse & { statusCode: number },
        )
      })
      server.middlewares.use('/api/site-live', async (req, res) => {
        if (env) applyServerEnv(env)
        const nodeReq = req as IncomingMessage & {
          body?: unknown
          query?: Record<string, string>
        }
        attachQuery(nodeReq)
        await handleSiteLive(
          nodeReq,
          res as ServerResponse & { statusCode: number },
        )
      })
    },
  }
}

import type { Plugin } from 'vite'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { applyServerEnv } from './api/cms-session.mjs'
import { handleCmsUsers } from './api/cms-users-lib.mjs'

async function readJsonBody(req: IncomingMessage) {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw) return {}
  return JSON.parse(raw) as Record<string, unknown>
}

export function cmsUsersPlugin(env?: Record<string, string>): Plugin {
  if (env) applyServerEnv(env)
  return {
    name: 'cms-users-api',
    configureServer(server) {
      if (env) applyServerEnv(env)
      server.middlewares.use('/api/cms-users', async (req, res) => {
        if (env) applyServerEnv(env)
        const nodeReq = req as IncomingMessage & { body?: unknown; query?: Record<string, string> }
        const url = new URL(req.url || '/', 'http://localhost')
        nodeReq.query = Object.fromEntries(url.searchParams)
        if (req.method !== 'GET' && req.method !== 'OPTIONS') {
          nodeReq.body = await readJsonBody(req as IncomingMessage)
        }
        await handleCmsUsers(
          nodeReq,
          res as ServerResponse & { statusCode: number },
        )
      })
    },
  }
}

import { handleCmsUsers } from './cms-users-lib.mjs'

export default async function handler(req, res) {
  try {
    await handleCmsUsers(req, res)
  } catch {
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(JSON.stringify({ error: 'Gebruikersbeheer is mislukt.' }))
  }
}

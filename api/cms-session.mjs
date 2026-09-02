export function applyServerEnv(env) {
  if (!env) return
  for (const [key, value] of Object.entries(env)) {
    if (value == null || value === '') continue
    if (process.env[key] == null || process.env[key] === '') {
      process.env[key] = String(value)
    }
  }
}

export async function verifyCmsUser(req) {
  const headers = req.headers || {}
  const authorization = headers.authorization || headers.Authorization
  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const supabaseAnonKey =
    process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

  if (!authorization?.startsWith('Bearer ')) {
    return null
  }
  if (!supabaseUrl || !supabaseAnonKey) {
    return null
  }

  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: authorization,
        apikey: supabaseAnonKey,
      },
    })
    if (!response.ok) return null
    const user = await response.json()
    if (!user?.id) return null
    return {
      id: String(user.id),
      email: String(user.email || ''),
      token: authorization.slice('Bearer '.length),
    }
  } catch {
    return null
  }
}

export function json(res, status, payload) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(payload))
}

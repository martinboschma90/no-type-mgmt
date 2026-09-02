import { json, verifyCmsUser } from './cms-session.mjs'

const ROLES = new Set(['admin', 'editor', 'viewer'])
const OWNER_EMAIL = 'martin@viraal.media'

function isOwnerEmail(email) {
  return String(email || '').trim().toLowerCase() === OWNER_EMAIL
}

function supabaseEnv() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  return { url, anonKey, serviceKey }
}

function restHeaders() {
  const { anonKey, serviceKey } = supabaseEnv()
  const key = serviceKey || anonKey
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  }
}

async function fetchRole(userId) {
  const { url } = supabaseEnv()
  const response = await fetch(
    `${url}/rest/v1/user_roles?user_id=eq.${encodeURIComponent(userId)}&select=role,status,display_name,email`,
    { headers: restHeaders() },
  )
  if (!response.ok) return null
  const rows = await response.json().catch(() => [])
  return Array.isArray(rows) ? rows[0] : null
}

async function requireAdmin(req, res) {
  const user = await verifyCmsUser(req)
  if (!user) {
    const hasAuth = Boolean(
      req.headers?.authorization || req.headers?.Authorization,
    )
    const { url, anonKey } = supabaseEnv()
    if (!url || !anonKey) {
      json(res, 503, {
        error: 'Supabase-env ontbreekt op de server. Herstart npm run dev.',
      })
      return null
    }
    json(res, 401, {
      error: hasAuth
        ? 'Sessie ongeldig. Log opnieuw in.'
        : 'Niet ingelogd of sessie verlopen.',
    })
    return null
  }
  const { serviceKey } = supabaseEnv()
  if (!serviceKey) {
    json(res, 503, { error: 'SUPABASE_SERVICE_ROLE_KEY ontbreekt op de server.' })
    return null
  }
  if (isOwnerEmail(user.email)) {
    await upsertRole({
      userId: user.id,
      email: OWNER_EMAIL,
      name: user.email,
      role: 'admin',
      status: 'active',
    })
    return user
  }
  const roleRow = await fetchRole(user.id)
  if (roleRow?.role !== 'admin') {
    json(res, 403, { error: 'Alleen admins kunnen gebruikers beheren.' })
    return null
  }
  return user
}

async function listAuthUsers() {
  const { url, serviceKey } = supabaseEnv()
  const users = []
  let page = 1
  while (page <= 10) {
    const response = await fetch(
      `${url}/auth/v1/admin/users?page=${page}&per_page=200`,
      {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
      },
    )
    if (!response.ok) break
    const payload = await response.json().catch(() => null)
    const batch = payload?.users || payload || []
    if (!Array.isArray(batch) || batch.length === 0) break
    users.push(...batch)
    if (batch.length < 200) break
    page += 1
  }
  return users
}

async function listRoleRows() {
  const { url } = supabaseEnv()
  const response = await fetch(
    `${url}/rest/v1/user_roles?select=user_id,email,display_name,role,status,created_at,updated_at`,
    { headers: restHeaders() },
  )
  if (!response.ok) return []
  const rows = await response.json().catch(() => [])
  return Array.isArray(rows) ? rows : []
}

function mapUsers(authUsers, roles) {
  const byId = new Map(roles.map((row) => [row.user_id, row]))
  return authUsers.map((user) => {
    const role = byId.get(user.id)
    const last = user.last_sign_in_at || null
    const email = user.email || role?.email || ''
    const owner = isOwnerEmail(email)
    return {
      id: user.id,
      email,
      name:
        role?.display_name ||
        user.user_metadata?.display_name ||
        user.email ||
        '',
      role: owner ? 'admin' : role?.role || 'viewer',
      status: last ? 'active' : role?.status || 'invited',
      lastLogin: last,
      createdAt: user.created_at || role?.created_at || null,
    }
  })
}

async function upsertRole({ userId, email, name, role, status }) {
  const { url } = supabaseEnv()
  await fetch(`${url}/rest/v1/user_roles`, {
    method: 'POST',
    headers: {
      ...restHeaders(),
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify({
      user_id: userId,
      email,
      display_name: name,
      role,
      status,
    }),
  })
}

async function adminCount() {
  const { url } = supabaseEnv()
  const response = await fetch(
    `${url}/rest/v1/user_roles?role=eq.admin&select=user_id`,
    { headers: restHeaders() },
  )
  const rows = await response.json().catch(() => [])
  return Array.isArray(rows) ? rows.length : 0
}

function adminAuthHeaders() {
  const { serviceKey } = supabaseEnv()
  return {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
  }
}

function looksLikeEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function inviteErrorMessage(email, raw) {
  const text = String(raw || '')
  if (/invalid/i.test(text)) {
    const domain = email.split('@')[1] || ''
    const hint = /markting/i.test(domain)
      ? ' Bedoel je marketing in plaats van markting?'
      : ' Controleer de spelling. Supabase weigert adressen zonder geldig e-maildomein (MX).'
    return `E-mailadres ${email} wordt geweigerd.${hint}`
  }
  return text || 'Uitnodiging mislukt.'
}

async function inviteAuthUser({ email, name, role, redirectTo }) {
  const { url } = supabaseEnv()
  const linkResponse = await fetch(`${url}/auth/v1/admin/generate_link`, {
    method: 'POST',
    headers: adminAuthHeaders(),
    body: JSON.stringify({
      type: 'invite',
      email,
      options: {
        redirectTo,
        redirect_to: redirectTo,
        data: { display_name: name, cms_role: role },
      },
    }),
  })
  const linkPayload = await linkResponse.json().catch(() => null)
  if (linkResponse.ok) {
    const user = linkPayload?.user || linkPayload
    return {
      ok: true,
      userId: user?.id || linkPayload?.id,
      inviteLink: linkPayload?.properties?.action_link || linkPayload?.action_link || null,
    }
  }

  const inviteResponse = await fetch(
    `${url}/auth/v1/invite?redirect_to=${encodeURIComponent(redirectTo)}`,
    {
      method: 'POST',
      headers: adminAuthHeaders(),
      body: JSON.stringify({
        email,
        data: { display_name: name, cms_role: role },
      }),
    },
  )
  const invitePayload = await inviteResponse.json().catch(() => null)
  if (inviteResponse.ok) {
    const invited = invitePayload?.id ? invitePayload : invitePayload?.user
    return { ok: true, userId: invited?.id, inviteLink: null }
  }

  const createResponse = await fetch(`${url}/auth/v1/admin/users`, {
    method: 'POST',
    headers: adminAuthHeaders(),
    body: JSON.stringify({
      email,
      email_confirm: false,
      user_metadata: { display_name: name, cms_role: role },
    }),
  })
  const created = await createResponse.json().catch(() => null)
  if (createResponse.ok && created?.id) {
    return { ok: true, userId: created.id, inviteLink: null }
  }

  return {
    ok: false,
    error: inviteErrorMessage(
      email,
      linkPayload?.msg ||
        linkPayload?.error_description ||
        invitePayload?.msg ||
        created?.msg ||
        created?.error_description,
    ),
  }
}

export async function handleCmsUsers(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return
  }

  const admin = await requireAdmin(req, res)
  if (!admin) return

  if (req.method === 'GET') {
    const [authUsers, roles] = await Promise.all([listAuthUsers(), listRoleRows()])
    const users = mapUsers(authUsers, roles)
    if (!users.some((row) => row.id === admin.id)) {
      users.unshift({
        id: admin.id,
        email: admin.email,
        name: admin.email,
        role: 'admin',
        status: 'active',
        lastLogin: new Date().toISOString(),
        createdAt: null,
      })
    }
    json(res, 200, { users })
    return
  }

  const body =
    typeof req.body === 'string'
      ? JSON.parse(req.body || '{}')
      : req.body || {}

  if (req.method === 'POST') {
    const email = String(body.email || '').trim().toLowerCase()
    const name = String(body.name || '').trim() || email
    const role = String(body.role || 'editor')
    if (!looksLikeEmail(email) || !ROLES.has(role)) {
      json(res, 400, { error: 'Ongeldige naam, e-mail of rol.' })
      return
    }
    const publicSite = String(
      process.env.PUBLIC_SITE_URL ||
        process.env.VITE_SITE_URL ||
        'https://www.notype-mgmt.com',
    ).replace(/\/$/, '')
    const redirectTo = `${publicSite}/cms/login`
    const invited = await inviteAuthUser({ email, name, role, redirectTo })
    if (!invited.ok) {
      json(res, 502, { error: invited.error })
      return
    }
    if (invited.userId) {
      await upsertRole({
        userId: invited.userId,
        email,
        name,
        role,
        status: 'invited',
      })
    }
    json(res, 200, {
      ok: true,
      id: invited.userId,
      inviteLink: invited.inviteLink,
    })
    return
  }

  if (req.method === 'PATCH') {
    const userId = String(body.userId || '')
    const role = String(body.role || '')
    if (!userId || !ROLES.has(role)) {
      json(res, 400, { error: 'Ongeldige gebruiker of rol.' })
      return
    }
    const current = await fetchRole(userId)
    if (isOwnerEmail(current?.email) && role !== 'admin') {
      json(res, 400, { error: 'martin@viraal.media blijft admin.' })
      return
    }
    if (current?.role === 'admin' && role !== 'admin') {
      const count = await adminCount()
      if (count <= 1) {
        json(res, 400, { error: 'Er moet minstens één admin blijven.' })
        return
      }
    }
    const { url } = supabaseEnv()
    const response = await fetch(
      `${url}/rest/v1/user_roles?user_id=eq.${encodeURIComponent(userId)}`,
      {
        method: 'PATCH',
        headers: restHeaders(),
        body: JSON.stringify({ role }),
      },
    )
    if (!response.ok) {
      json(res, 502, { error: 'Rol bijwerken mislukt.' })
      return
    }
    json(res, 200, { ok: true })
    return
  }

  if (req.method === 'DELETE') {
    const userId = String(body.userId || req.query?.userId || '')
    if (!userId) {
      json(res, 400, { error: 'Geen gebruiker opgegeven.' })
      return
    }
    if (userId === admin.id) {
      json(res, 400, { error: 'Je kunt jezelf niet verwijderen.' })
      return
    }
    const current = await fetchRole(userId)
    if (isOwnerEmail(current?.email)) {
      json(res, 400, { error: 'martin@viraal.media kan niet verwijderd worden.' })
      return
    }
    if (current?.role === 'admin') {
      const count = await adminCount()
      if (count <= 1) {
        json(res, 400, { error: 'Er moet minstens één admin blijven.' })
        return
      }
    }
    const { url, serviceKey } = supabaseEnv()
    const response = await fetch(`${url}/auth/v1/admin/users/${userId}`, {
      method: 'DELETE',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    })
    if (!response.ok && response.status !== 404) {
      json(res, 502, { error: 'Verwijderen mislukt.' })
      return
    }
    json(res, 200, { ok: true })
    return
  }

  json(res, 405, { error: 'Method not allowed' })
}

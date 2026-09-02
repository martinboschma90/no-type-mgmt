import { supabase } from '@/lib/supabase'

export type ManagedUser = {
  id: string
  email: string
  name: string
  role: 'admin' | 'editor' | 'viewer'
  status: 'active' | 'invited'
  lastLogin: string | null
  createdAt: string | null
}

async function authHeader() {
  if (!supabase) return {}
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function listManagedUsers(): Promise<{
  users: ManagedUser[]
  error: string | null
}> {
  const response = await fetch('/api/cms-users', { headers: await authHeader() })
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    return { users: [], error: payload?.error || 'Gebruikers laden mislukt.' }
  }
  return { users: Array.isArray(payload?.users) ? payload.users : [], error: null }
}

export async function inviteManagedUser(input: {
  name: string
  email: string
  role: ManagedUser['role']
}) {
  const response = await fetch('/api/cms-users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
    body: JSON.stringify(input),
  })
  const payload = await response.json().catch(() => null)
  return {
    error: response.ok ? null : payload?.error || 'Uitnodigen mislukt.',
    inviteLink: typeof payload?.inviteLink === 'string' ? payload.inviteLink : null,
  }
}

export async function updateManagedUserRole(userId: string, role: ManagedUser['role']) {
  const response = await fetch('/api/cms-users', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
    body: JSON.stringify({ userId, role }),
  })
  const payload = await response.json().catch(() => null)
  return { error: response.ok ? null : payload?.error || 'Rol bijwerken mislukt.' }
}

export async function deleteManagedUser(userId: string) {
  const response = await fetch('/api/cms-users', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
    body: JSON.stringify({ userId }),
  })
  const payload = await response.json().catch(() => null)
  return { error: response.ok ? null : payload?.error || 'Verwijderen mislukt.' }
}

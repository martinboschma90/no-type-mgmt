import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { Session, User } from '@supabase/supabase-js'

/**
 * Auth helpers for future CMS login (Phase 5).
 * No UI wiring in Phase 1 — local CMS stays open and local.
 */

export async function getSession(): Promise<Session | null> {
  if (!supabase) return null
  const { data, error } = await supabase.auth.getSession()
  if (error) {
    console.warn('[supabase auth] getSession:', error.message)
    return null
  }
  return data.session
}

export async function getUser(): Promise<User | null> {
  const session = await getSession()
  return session?.user ?? null
}

export async function signInWithPassword(email: string, password: string) {
  if (!supabase) {
    return {
      data: { user: null, session: null },
      error: new Error('Supabase is not configured'),
    }
  }
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signOut() {
  if (!supabase) {
    return { error: new Error('Supabase is not configured') }
  }
  return supabase.auth.signOut()
}

export function onAuthStateChange(
  callback: (event: string, session: Session | null) => void,
) {
  if (!supabase) {
    return { data: { subscription: { unsubscribe: () => undefined } } }
  }
  return supabase.auth.onAuthStateChange(callback)
}

export { isSupabaseConfigured }

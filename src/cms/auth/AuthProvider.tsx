import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import {
  getSession,
  isSupabaseConfigured,
  onAuthStateChange,
  signInWithPassword,
  signOut as authSignOut,
} from '@/lib/auth'

type AuthContextValue = {
  /** True after first session resolution. */
  ready: boolean
  session: Session | null
  user: User | null
  /** Supabase env present — auth is required for CMS when true. */
  authRequired: boolean
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null }>
  signOut: () => Promise<{ error: string | null }>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(!isSupabaseConfigured)
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setReady(true)
      setSession(null)
      return
    }

    let cancelled = false
    const timer = window.setTimeout(() => {
      if (!cancelled) setReady(true)
    }, 2500)

    void getSession()
      .then((next) => {
        if (cancelled) return
        setSession(next)
        setReady(true)
      })
      .catch(() => {
        if (!cancelled) setReady(true)
      })
      .finally(() => {
        window.clearTimeout(timer)
      })

    const { data } = onAuthStateChange((_event, next) => {
      setSession(next)
      setReady(true)
    })

    return () => {
      cancelled = true
      window.clearTimeout(timer)
      data.subscription.unsubscribe()
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await signInWithPassword(email.trim(), password)
    if (error) {
      return { error: error.message }
    }
    return { error: null }
  }, [])

  const signOut = useCallback(async () => {
    const { error } = await authSignOut()
    if (error) {
      return { error: error.message }
    }
    setSession(null)
    return { error: null }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      ready,
      session,
      user: session?.user ?? null,
      authRequired: isSupabaseConfigured,
      signIn,
      signOut,
    }),
    [ready, session, signIn, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}

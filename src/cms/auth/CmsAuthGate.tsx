import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/cms/auth/AuthProvider'
import type { ReactNode } from 'react'

/**
 * Protects CMS shell routes. Login page is outside this gate.
 * When Supabase is not configured, CMS stays open (local-only fallback).
 */
export function CmsAuthGate({ children }: { children: ReactNode }) {
  const { ready, session, authRequired } = useAuth()
  const location = useLocation()

  if (!authRequired) {
    return children
  }

  if (!ready) {
    return (
      <div className="flex h-svh items-center justify-center bg-[#ebe8e2] text-ink dark:bg-[#0c0b0d]">
        <p className="type-label text-[0.7rem] tracking-[0.14em] text-ink/40 uppercase">
          Checking session…
        </p>
      </div>
    )
  }

  if (!session) {
    return (
      <Navigate
        to="/cms/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    )
  }

  return children
}

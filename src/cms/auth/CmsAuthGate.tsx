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
      <div
        data-cms
        className="flex h-svh items-center justify-center bg-neutral-50"
        style={{ fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif" }}
      >
        <p className="text-sm text-neutral-500">Flow Mates CMS laden…</p>
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

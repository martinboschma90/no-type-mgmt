import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/cms/auth/AuthProvider'
import { Logo } from '@/components/ui/Logo'

const controlClass =
  'w-full rounded-xl border border-white/12 bg-[#151217] px-3.5 py-3 type-body text-sm text-[#F5F5F5] outline-none transition-colors placeholder:text-white/30 focus:border-accent/60'

/**
 * Admin login — Supabase Auth email/password.
 * UI only; auth logic lives in AuthProvider / lib/auth.
 */
export function CmsLoginPage() {
  const { ready, session, authRequired, signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from =
    (location.state as { from?: string } | null)?.from &&
    !(location.state as { from?: string }).from?.startsWith('/cms/login')
      ? (location.state as { from: string }).from
      : '/cms/home'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (authRequired && ready && session) {
    return <Navigate to={from} replace />
  }

  if (!authRequired) {
    return <Navigate to="/cms/home" replace />
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const result = await signIn(email, password)
    setLoading(false)
    if (result.error) {
      setError(result.error)
      return
    }
    navigate(from, { replace: true })
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-[#0c0b0d] px-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#151217] p-7 sm:p-9">
        <div className="flex justify-center">
          <Logo
            variant="wordmark"
            className="h-9 w-auto sm:h-10"
            title="No Type"
          />
        </div>

        <form className="mt-10 space-y-4" onSubmit={onSubmit}>
          <label className="block">
            <span className="type-label mb-1.5 block text-[0.65rem] tracking-[0.14em] text-white/45 uppercase">
              Email
            </span>
            <input
              type="email"
              autoComplete="username"
              required
              className={controlClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </label>

          <label className="block">
            <span className="type-label mb-1.5 block text-[0.65rem] tracking-[0.14em] text-white/45 uppercase">
              Password
            </span>
            <input
              type="password"
              autoComplete="current-password"
              required
              className={controlClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </label>

          {error ? (
            <p className="type-body text-xs text-red-400" role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading || !email.trim() || !password}
            className="type-label mt-1 w-full rounded-full bg-brand px-4 py-3 text-[0.7rem] tracking-[0.14em] text-[#111111] uppercase transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {loading ? 'Signing in…' : 'Log in'}
          </button>
        </form>

        <a
          href="/"
          className="type-label mt-6 block text-center text-[0.65rem] tracking-[0.12em] text-white/40 uppercase transition-colors hover:text-white/70"
        >
          ← Back to site
        </a>
      </div>
    </div>
  )
}

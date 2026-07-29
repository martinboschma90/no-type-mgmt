import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/cms/auth/AuthProvider'

const controlClass =
  'w-full rounded-lg border border-ink/12 bg-[var(--body-bg)] px-3 py-2.5 type-body text-sm text-ink outline-none transition-colors placeholder:text-ink/30 focus:border-brand/60'

/**
 * Admin login — Supabase Auth email/password.
 * Styled to match the existing CMS shell (no redesign).
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
    <div className="flex min-h-svh items-center justify-center bg-[#ebe8e2] px-4 text-ink dark:bg-[#0c0b0d]">
      <div className="w-full max-w-sm rounded-2xl border border-ink/10 bg-[var(--body-bg)] p-6 shadow-sm sm:p-8">
        <p className="type-label text-[0.6rem] tracking-[0.18em] text-brand uppercase">
          No Type
        </p>
        <h1 className="type-display m-0 mt-2 text-[1.85rem] leading-none text-ink">
          CMS login
        </h1>
        <p className="type-body mt-3 text-xs text-ink/45">
          Admin access only. Create the user in Supabase Dashboard → Authentication
          → Users.
        </p>

        <form className="mt-6 space-y-3.5" onSubmit={onSubmit}>
          <label className="block">
            <span className="type-label mb-1.5 block text-[0.65rem] tracking-[0.14em] text-ink/45 uppercase">
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
            <span className="type-label mb-1.5 block text-[0.65rem] tracking-[0.14em] text-ink/45 uppercase">
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
            <p className="type-body text-xs text-red-500" role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading || !email.trim() || !password}
            className="type-label w-full rounded-full bg-ink px-4 py-3 text-[0.7rem] tracking-[0.14em] text-ink-inverse uppercase transition-opacity disabled:opacity-40"
          >
            {loading ? 'Signing in…' : 'Log in'}
          </button>
        </form>

        <a
          href="/"
          className="type-label mt-5 block text-center text-[0.65rem] tracking-[0.12em] text-ink/40 uppercase transition-colors hover:text-ink"
        >
          ← Back to site
        </a>
      </div>
    </div>
  )
}

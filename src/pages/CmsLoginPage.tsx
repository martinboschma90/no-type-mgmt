import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/cms/auth/AuthProvider'

const controlClass =
  'w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-emerald-500'

export function CmsLoginPage() {
  const { ready, session, authRequired, signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from =
    (location.state as { from?: string } | null)?.from &&
    !(location.state as { from?: string }).from?.startsWith('/cms/login')
      ? (location.state as { from: string }).from
      : '/cms/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (authRequired && ready && session) {
    return <Navigate to={from} replace />
  }

  if (!authRequired) {
    return <Navigate to="/cms/dashboard" replace />
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
    <div
      data-cms
      data-cms-theme="dark"
      className="relative flex min-h-svh items-center justify-center bg-[#090909] px-4"
      style={{ fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif" }}
    >
      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/40">
            Flow Mates
          </p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-white">CMS</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#111] p-6 shadow-2xl shadow-black/40">
          <h1 className="mb-1 text-lg font-semibold text-white">Welkom terug</h1>
          <p className="mb-5 text-sm text-white/45">Log in met e-mail en wachtwoord · Notype</p>

          <form className="space-y-3" onSubmit={onSubmit}>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-white/50">E-mail</span>
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
              <span className="mb-1 block text-xs font-medium text-white/50">Wachtwoord</span>
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
              <p className="text-xs text-red-400" role="alert">
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={loading || !email.trim() || !password}
              className="mt-1 w-full rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-medium text-neutral-950 hover:bg-emerald-400 disabled:opacity-40"
            >
              {loading ? 'Bezig…' : 'Inloggen'}
            </button>
          </form>
        </div>

        <a href="/" className="mt-6 block text-center text-xs text-white/35 hover:text-white/70">
          ← Terug naar de site
        </a>
      </div>
    </div>
  )
}

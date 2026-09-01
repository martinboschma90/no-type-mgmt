import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/cms/auth/AuthProvider'

const controlClass =
  'w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-900 outline-none transition hover:border-neutral-300 focus:border-neutral-900 focus:ring-4 focus:ring-neutral-900/5'

/**
 * Flow Mates CMS login — Supabase Auth. Isolated from the public Notype theme.
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
    <div
      data-cms
      className="relative flex min-h-svh items-center justify-center overflow-hidden bg-[#071315] px-4"
      style={{ fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif" }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-[-12%] opacity-78 blur-[78px]"
        style={{
          background:
            'radial-gradient(circle at 50% 5%, rgb(7 171 166 / 0.95) 0, transparent 39%), radial-gradient(circle at 72% 66%, rgb(100 161 118 / 0.55) 0, transparent 30%), radial-gradient(circle at 40% 64%, rgb(244 183 153 / 0.76) 0, transparent 28%), radial-gradient(circle at 50% 51%, rgb(255 239 211 / 0.64) 0, transparent 31%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 28%, rgb(2 14 14 / 0.58) 100%), linear-gradient(180deg, rgb(1 13 16 / 0.15), transparent 48%, rgb(2 16 13 / 0.48))',
        }}
      />

      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-400">
            Flow Mates
          </p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900">CMS</p>
        </div>

        <div className="rounded-2xl border border-white/12 bg-[#111718]/85 p-6 shadow-2xl shadow-black/35 backdrop-blur-xl">
          <h1 className="mb-1 text-lg font-semibold text-neutral-900">
            Welkom in Flow Mates CMS
          </h1>
          <p className="mb-5 text-sm text-neutral-500">Log in om verder te gaan · Notype</p>

          <form className="space-y-3" onSubmit={onSubmit}>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-neutral-700">E-mail</span>
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
              <span className="mb-1 block text-xs font-medium text-neutral-700">Wachtwoord</span>
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
              <p className="text-xs text-rose-600" role="alert">
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={loading || !email.trim() || !password}
              className="mt-1 w-full rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-40"
            >
              {loading ? 'Bezig…' : 'Inloggen'}
            </button>
          </form>
        </div>

        <a
          href="/"
          className="mt-6 block text-center text-xs text-neutral-400 hover:text-neutral-700"
        >
          ← Terug naar de site
        </a>
      </div>
    </div>
  )
}

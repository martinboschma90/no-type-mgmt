import { useEffect, useState, type FormEvent } from 'react'
import {
  deleteManagedUser,
  inviteManagedUser,
  listManagedUsers,
  updateManagedUserRole,
  type ManagedUser,
} from '@/cms/api/cmsUsers'
import { useAuth } from '@/cms/auth/AuthProvider'

const inputCls =
  'w-full rounded-lg border border-neutral-700 bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-emerald-500'

export function UsersAdmin() {
  const { canManageUsers } = useAuth()
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<ManagedUser['role']>('editor')
  const [busy, setBusy] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [inviteLink, setInviteLink] = useState<string | null>(null)

  async function reload() {
    setLoading(true)
    const result = await listManagedUsers()
    setUsers(result.users)
    setError(result.error)
    setLoading(false)
  }

  useEffect(() => {
    if (!canManageUsers) return
    void reload()
  }, [canManageUsers])

  if (!canManageUsers) {
    return <p className="text-sm text-neutral-500">Alleen admins kunnen gebruikers beheren.</p>
  }

  async function onInvite(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    const result = await inviteManagedUser({ name, email, role })
    setBusy(false)
    if (result.error) {
      setError(result.error)
      return
    }
    setInviteLink(result.inviteLink)
    setInviteOpen(false)
    setName('')
    setEmail('')
    setRole('editor')
    await reload()
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">Gebruikers</h2>
          <p className="text-xs text-neutral-500">
            Rollen, uitnodigingen en toegang tot het CMS.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setInviteOpen(true)}
          className="rounded-lg bg-emerald-500 px-3.5 py-2 text-sm font-medium text-neutral-950 hover:bg-emerald-400"
        >
          Gebruiker uitnodigen
        </button>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      {inviteLink ? (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
          <p className="font-medium text-emerald-100">Uitnodiging klaar</p>
          <p className="mt-1 text-emerald-200/80">
            Steven (of wie je uitnodigde) krijgt een mail. Komt die niet aan, stuur dan deze
            link. Daarmee zet hij een wachtwoord en komt hij in het CMS.
          </p>
          <p className="mt-2 break-all text-[11px] text-white/70">{inviteLink}</p>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-[#111] text-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-white/10 text-[10px] font-semibold tracking-wider text-white/40 uppercase">
            <tr>
              <th className="px-4 py-3">Naam</th>
              <th className="px-4 py-3">E-mail</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Laatste login</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-6 text-white/40" colSpan={6}>
                  Laden…
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-white/40" colSpan={6}>
                  Nog geen gebruikers.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-t border-white/5">
                  <td className="px-4 py-3 font-medium">{user.name || '—'}</td>
                  <td className="px-4 py-3 text-white/70">{user.email}</td>
                  <td className="px-4 py-3">
                    <select
                      className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs"
                      value={user.role}
                      onChange={(event) => {
                        const next = event.target.value as ManagedUser['role']
                        void updateManagedUserRole(user.id, next).then((result) => {
                          if (result.error) setError(result.error)
                          else void reload()
                        })
                      }}
                    >
                      <option value="admin">admin</option>
                      <option value="editor">editor</option>
                      <option value="viewer">viewer</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                        user.status === 'active'
                          ? 'bg-emerald-500/15 text-emerald-300'
                          : 'bg-white/10 text-white/50'
                      }`}
                    >
                      {user.status === 'active' ? 'Actief' : 'Uitgenodigd'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-white/45">
                    {user.lastLogin
                      ? new Date(user.lastLogin).toLocaleString('nl-BE')
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {deleteId === user.id ? (
                      <span className="inline-flex items-center gap-2 text-xs">
                        <button
                          type="button"
                          className="text-red-400 hover:text-red-300"
                          onClick={() => {
                            void deleteManagedUser(user.id).then((result) => {
                              if (result.error) setError(result.error)
                              setDeleteId(null)
                              void reload()
                            })
                          }}
                        >
                          Bevestigen
                        </button>
                        <button type="button" onClick={() => setDeleteId(null)}>
                          Annuleren
                        </button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="text-xs text-white/40 hover:text-red-400"
                        onClick={() => setDeleteId(user.id)}
                      >
                        Verwijderen
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {inviteOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <form
            onSubmit={onInvite}
            className="w-full max-w-md rounded-2xl border border-neutral-800 bg-[#151515] p-5 text-white"
          >
            <h3 className="text-base font-semibold">Gebruiker uitnodigen</h3>
            <p className="mt-1 text-xs text-white/45">
              Er gaat een e-mail uit om een wachtwoord in te stellen.
            </p>
            <label className="mt-4 block text-xs text-white/50">
              Naam
              <input
                className={`${inputCls} mt-1`}
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </label>
            <label className="mt-3 block text-xs text-white/50">
              E-mail
              <input
                type="text"
                inputMode="email"
                autoComplete="email"
                className={`${inputCls} mt-1`}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
            <label className="mt-3 block text-xs text-white/50">
              Rol
              <select
                className={`${inputCls} mt-1`}
                value={role}
                onChange={(event) => setRole(event.target.value as ManagedUser['role'])}
              >
                <option value="admin">admin</option>
                <option value="editor">editor</option>
                <option value="viewer">viewer</option>
              </select>
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg px-3 py-2 text-sm text-white/60"
                onClick={() => setInviteOpen(false)}
              >
                Annuleren
              </button>
              <button
                type="submit"
                disabled={busy}
                className="rounded-lg bg-emerald-500 px-3 py-2 text-sm font-medium text-neutral-950 disabled:opacity-40"
              >
                {busy ? 'Versturen…' : 'Uitnodiging sturen'}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  )
}

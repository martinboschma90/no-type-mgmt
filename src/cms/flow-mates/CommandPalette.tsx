import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const COMMANDS: { to: string; label: string; group: string }[] = [
  { to: '/cms/dashboard', label: 'Dashboard', group: 'Systeem' },
  { to: '/cms/home', label: 'Home', group: "Pagina's" },
  { to: '/cms/about', label: 'About', group: "Pagina's" },
  { to: '/cms/contact', label: 'Contact', group: "Pagina's" },
  { to: '/cms/booking', label: 'Booking', group: "Pagina's" },
  { to: '/cms/faq', label: 'FAQ', group: "Pagina's" },
  { to: '/cms/footer', label: 'Footer', group: "Pagina's" },
  { to: '/cms/roster', label: 'Roster', group: "Pagina's" },
  { to: '/cms/artists', label: 'Artiesten', group: 'Inhoud' },
  { to: '/cms/media', label: 'Mediabibliotheek', group: 'Inhoud' },
  { to: '/cms/settings', label: 'Instellingen', group: 'Systeem' },
  { to: '/cms/settings/users', label: 'Team en rollen', group: 'Systeem' },
  { to: '/', label: 'Publieke site', group: 'Systeem' },
]

export function useFlowMatesSearchHotkey(onOpen: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        onOpen()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onOpen])
}

export function FlowMatesCommandPalette({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const navigate = useNavigate()
  const [q, setQ] = useState('')

  useEffect(() => {
    if (!open) setQ('')
  }, [open])

  const hits = useMemo(() => {
    const n = q.trim().toLowerCase()
    if (!n) return COMMANDS
    return COMMANDS.filter(
      (c) => c.label.toLowerCase().includes(n) || c.to.toLowerCase().includes(n),
    )
  }, [q])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[80]">
      <button
        type="button"
        className="absolute inset-0 bg-neutral-900/40"
        aria-label="Sluiten"
        onClick={onClose}
      />
      <div className="absolute left-1/2 top-[18vh] w-[min(32rem,calc(100%-2rem))] -translate-x-1/2 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl">
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek pagina's, media, instellingen…"
          className="w-full border-b border-neutral-200 px-4 py-3 text-sm outline-none"
        />
        <ul className="max-h-80 overflow-y-auto p-2">
          {hits.length === 0 ? (
            <li className="px-3 py-4 text-sm text-neutral-500">Niets gevonden</li>
          ) : (
            hits.map((c) => (
              <li key={c.to}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-neutral-100"
                  onClick={() => {
                    if (c.to === '/') {
                      window.location.href = '/'
                    } else {
                      navigate(c.to)
                    }
                    onClose()
                  }}
                >
                  <span className="font-medium text-neutral-900">{c.label}</span>
                  <span className="text-[11px] uppercase tracking-wide text-neutral-400">
                    {c.group}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  )
}

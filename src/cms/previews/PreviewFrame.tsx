import { useState, type ReactNode } from 'react'

export type PreviewDevice = 'desktop' | 'tablet' | 'mobile'

type PreviewFrameProps = {
  label: string
  children: ReactNode
}

const devices: { id: PreviewDevice; label: string; width: number; scale: number }[] = [
  { id: 'desktop', label: 'Desktop', width: 1280, scale: 0.48 },
  { id: 'tablet', label: 'Tablet', width: 834, scale: 0.55 },
  { id: 'mobile', label: 'Mobile', width: 390, scale: 0.72 },
]

/**
 * Live preview with Frame-style desktop / tablet / mobile switcher.
 */
export function PreviewFrame({ label, children }: PreviewFrameProps) {
  const [device, setDevice] = useState<PreviewDevice>('desktop')
  const [nonce, setNonce] = useState(0)
  const active = devices.find((d) => d.id === device) ?? devices[0]

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="type-label text-[0.65rem] tracking-[0.16em] text-ink/70 uppercase">
            Live preview
          </p>
          <p className="type-body mt-0.5 text-xs text-ink/70">
            {label} · {active.label}
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <div
            className="inline-flex rounded-full border border-ink/10 bg-[var(--body-bg)] p-0.5"
            role="group"
            aria-label="Preview device"
          >
            {devices.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setDevice(d.id)}
                className={[
                  'type-label rounded-full px-2.5 py-1.5 text-[0.55rem] tracking-[0.1em] uppercase transition-colors',
                  d.id === device
                    ? 'bg-brand text-[#111111]'
                    : 'text-ink/70 hover:text-ink',
                ].join(' ')}
                aria-pressed={d.id === device}
              >
                {d.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setNonce((n) => n + 1)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-ink/20 text-ink/70 transition-colors hover:border-ink/40 hover:text-ink"
            aria-label="Refresh preview"
            title="Refresh"
          >
            <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path
                d="M4 10a6 6 0 0 1 10.4-3.6M16 10a6 6 0 0 1-10.4 3.6"
                strokeLinecap="round"
              />
              <path d="M14 3.5v3h3M6 16.5v-3H3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-ink/20 text-ink/70 transition-colors hover:border-ink/40 hover:text-ink"
            aria-label="Open site"
            title="Open site"
          >
            <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M8 4H4v12h12v-4M10 10l6-6M12 4h4v4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl border border-ink/10 bg-ink/[0.04]">
        <div className="absolute inset-0 overflow-auto p-4 sm:p-5">
          <div
            key={nonce}
            className="mx-auto overflow-hidden rounded-xl border border-ink/10 bg-[var(--body-bg)] shadow-[0_20px_60px_rgb(0_0_0/0.14)] transition-[width] duration-300"
            style={{
              width: `min(100%, ${active.width * active.scale}px)`,
            }}
          >
            <div
              className="pointer-events-none origin-top-left"
              style={{
                width: active.width,
                transform: `scale(${active.scale})`,
              }}
            >
              <div className="min-h-[900px] bg-[var(--body-bg)] text-ink">{children}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

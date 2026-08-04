import { useId, useState, type ChangeEvent, type ReactNode } from 'react'

type FieldProps = {
  label: string
  hint?: string
  children: ReactNode
}

export function Field({ label, hint, children }: FieldProps) {
  return (
    <label className="block">
      <span className="type-label mb-1.5 block text-[0.65rem] tracking-[0.14em] text-ink/45 uppercase">
        {label}
      </span>
      {children}
      {hint ? <span className="mt-1.5 block text-xs text-ink/35">{hint}</span> : null}
    </label>
  )
}

const controlClass =
  'w-full rounded-lg border border-ink/12 bg-[var(--body-bg)] px-3 py-2.5 type-body text-sm text-ink outline-none transition-colors placeholder:text-ink/30 focus:border-accent/60'

type TextInputProps = {
  label: string
  value: string
  onChange: (value: string) => void
  hint?: string
  placeholder?: string
}

export function TextInput({ label, value, onChange, hint, placeholder }: TextInputProps) {
  return (
    <Field label={label} hint={hint}>
      <input
        type="text"
        className={controlClass}
        value={value}
        placeholder={placeholder}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
      />
    </Field>
  )
}

type TextAreaProps = {
  label: string
  value: string
  onChange: (value: string) => void
  hint?: string
  rows?: number
}

export function TextArea({ label, value, onChange, hint, rows = 4 }: TextAreaProps) {
  return (
    <Field label={label} hint={hint}>
      <textarea
        className={`${controlClass} min-h-[6rem] resize-y`}
        value={value}
        rows={rows}
        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
      />
    </Field>
  )
}

type SectionTab = {
  id: string
  label: string
  children: ReactNode
}

type EditorSectionProps = {
  title: string
  description?: string
  children?: ReactNode
  /** Frame-style Content / Media tabs */
  tabs?: SectionTab[]
  defaultOpen?: boolean
  defaultTabId?: string
  badge?: string
}

/** Accordion block inspired by Frame CMS section cards. */
export function EditorSection({
  title,
  description,
  children,
  tabs,
  defaultOpen = false,
  defaultTabId,
  badge,
}: EditorSectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  const [tabId, setTabId] = useState(defaultTabId ?? tabs?.[0]?.id ?? 'content')
  const panelId = useId()

  const activeTab = tabs?.find((t) => t.id === tabId) ?? tabs?.[0]
  const body = tabs ? activeTab?.children : children

  return (
    <section className="overflow-hidden rounded-2xl border border-ink/10 bg-[var(--body-bg)]">
      <button
        type="button"
        className="flex w-full items-start justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-ink/[0.03]"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="type-headline m-0 text-[0.95rem] text-ink">{title}</h2>
            {badge ? (
              <span className="type-label rounded-full bg-ink/6 px-2 py-0.5 text-[0.55rem] tracking-[0.12em] text-ink/45 uppercase">
                {badge}
              </span>
            ) : null}
          </div>
          {description ? (
            <p className="type-body mt-1 text-xs text-ink/40">{description}</p>
          ) : null}
        </div>
        <span
          className={`mt-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-ink/10 text-ink/50 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
          aria-hidden
        >
          <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="m5 8 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>

      {open ? (
        <div id={panelId} className="border-t border-ink/8 px-4 pt-3 pb-4">
          {tabs && tabs.length > 1 ? (
            <div className="mb-4 flex gap-1 border-b border-ink/8 pb-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTabId(tab.id)}
                  className={[
                    'type-label rounded-full px-3 py-1.5 text-[0.6rem] tracking-[0.12em] uppercase transition-colors',
                    tab.id === (activeTab?.id ?? tabId)
                      ? 'bg-ink text-ink-inverse'
                      : 'text-ink/45 hover:bg-accent/10 hover:text-ink',
                  ].join(' ')}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          ) : null}
          <div className="space-y-3.5">{body}</div>
        </div>
      ) : null}
    </section>
  )
}

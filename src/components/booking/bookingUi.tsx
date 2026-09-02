import {
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { Calendar } from 'lucide-react'

export function BookingField({
  label,
  optional,
  children,
}: {
  label: string
  optional?: boolean
  children: ReactNode
}) {
  return (
    <div className="block min-w-0">
      <span className="type-label mb-1 block text-[0.58rem] tracking-[0.14em] text-ink/45">
        {label}
        {optional ? (
          <span className="normal-case tracking-normal text-ink/28">
            {' '}
            (optional)
          </span>
        ) : null}
      </span>
      {children}
    </div>
  )
}

const inputClass =
  'w-full rounded-full border border-ink/12 bg-transparent px-3 py-2 type-body text-[0.8125rem] leading-snug text-ink outline-none transition-colors placeholder:text-ink/30 focus:border-accent/70'

export function BookingInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputClass} ${props.className ?? ''}`} />
}

export function BookingTextarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`${inputClass} min-h-[4.5rem] resize-none rounded-2xl ${props.className ?? ''}`}
    />
  )
}

export function BookingSelect(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <span className="relative block">
      <select
        {...props}
        className={`${inputClass} appearance-none pr-9 ${props.className ?? ''}`}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-[0.65rem] text-ink/40"
      >
        ▾
      </span>
    </span>
  )
}

/** Button twin of homepage `PillButton` (solid / ghost). */
type BookingButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'solid' | 'ghost'
}

export function BookingButton({
  variant = 'solid',
  className = '',
  children,
  ...props
}: BookingButtonProps) {
  const base =
    'type-ui inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-[0.65rem] transition-colors disabled:opacity-40'

  const styles =
    variant === 'solid'
      ? 'bg-ink text-ink-inverse hover:bg-accent hover:text-[#f5f5f5]'
      : 'border border-ink/80 bg-transparent text-ink hover:border-accent hover:bg-accent/15 hover:text-ink'

  return (
    <button type="button" className={`${base} ${styles} ${className}`} {...props}>
      {children}
    </button>
  )
}

export function ArtistSelectChip({
  active,
  children,
  onClick,
}: {
  active: boolean
  children: ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`type-ui rounded-full px-3 py-1.5 text-[0.65rem] transition-colors ${
        active
          ? 'border border-accent bg-accent text-[#f5f5f5]'
          : 'border border-ink/80 bg-transparent text-ink hover:border-accent hover:bg-accent/15 hover:text-ink'
      }`}
    >
      {children}
    </button>
  )
}

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function toIso(year: number, month: number, day: number) {
  return `${year}-${pad(month + 1)}-${pad(day)}`
}

function parseIso(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return null
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
}

function todayIso() {
  const now = new Date()
  return toIso(now.getFullYear(), now.getMonth(), now.getDate())
}

function formatPicked(value: string) {
  const date = parseIso(value)
  if (!date) return 'Choose date'
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function monthCells(year: number, month: number) {
  const first = new Date(year, month, 1)
  const startOffset = (first.getDay() + 6) % 7
  const days = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = []
  for (let i = 0; i < startOffset; i += 1) cells.push(null)
  for (let day = 1; day <= days; day += 1) cells.push(day)
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

export function BookingDatePicker({
  value,
  onChange,
  min,
}: {
  value: string
  onChange: (next: string) => void
  min?: string
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const selected = parseIso(value)
  const [cursor, setCursor] = useState(() => selected || new Date())
  const minDate = parseIso(min || todayIso()) || new Date()

  useEffect(() => {
    if (!open) return
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const title = cursor.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
  const minIso = toIso(minDate.getFullYear(), minDate.getMonth(), minDate.getDate())

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setCursor(selected || new Date())
          setOpen((current) => !current)
        }}
        className={`${inputClass} flex items-center justify-between gap-2 text-left`}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className={value ? '' : 'text-ink/30'}>{formatPicked(value)}</span>
        <Calendar className="h-3.5 w-3.5 shrink-0 text-ink/40" strokeWidth={1.75} />
      </button>
      {open ? (
        <div
          role="dialog"
          aria-label="Choose event date"
          className="absolute top-[calc(100%+0.4rem)] left-0 z-30 w-[min(100%,19rem)] rounded-2xl border border-ink/12 bg-[var(--body-bg)] p-3 shadow-[0_12px_40px_rgb(0_0_0/0.18)]"
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-full text-ink/60 hover:bg-ink/8 hover:text-ink"
              aria-label="Previous month"
              onClick={() => setCursor(new Date(year, month - 1, 1))}
            >
              ‹
            </button>
            <p className="type-ui text-[0.68rem] tracking-[0.08em] text-ink uppercase">
              {title}
            </p>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-full text-ink/60 hover:bg-ink/8 hover:text-ink"
              aria-label="Next month"
              onClick={() => setCursor(new Date(year, month + 1, 1))}
            >
              ›
            </button>
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {WEEKDAYS.map((day) => (
              <span
                key={day}
                className="py-1 text-center text-[0.58rem] tracking-[0.08em] text-ink/35 uppercase"
              >
                {day}
              </span>
            ))}
            {monthCells(year, month).map((day, index) => {
              if (day == null) {
                return <span key={`empty-${index}`} />
              }
              const iso = toIso(year, month, day)
              const disabled = iso < minIso
              const active = iso === value
              return (
                <button
                  key={iso}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    onChange(iso)
                    setOpen(false)
                  }}
                  className={`h-8 rounded-full text-[0.75rem] tabular-nums ${
                    active
                      ? 'bg-accent text-[#f5f5f5]'
                      : disabled
                        ? 'text-ink/20'
                        : 'text-ink hover:bg-ink/8'
                  }`}
                >
                  {day}
                </button>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}

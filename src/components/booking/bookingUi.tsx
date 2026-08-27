import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'

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
    <label className="block min-w-0">
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
    </label>
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

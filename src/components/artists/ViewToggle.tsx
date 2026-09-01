import type { ViewMode } from '@/types/artist'

type ViewToggleProps = {
  value: ViewMode
  onChange: (mode: ViewMode) => void
}

const options: { id: ViewMode; label: string }[] = [
  { id: 'grid', label: 'Grid' },
  { id: 'list', label: 'List' },
]

/** Brand-matched view switcher — solid active, ghost inactive. */
export function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <div
      className="inline-flex items-center gap-2"
      role="group"
      aria-label="View mode"
    >
      {options.map((option) => {
        const active = value === option.id
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            aria-pressed={active}
            className={[
              'type-ui relative min-w-[5.5rem] rounded-full px-5 py-2.5 text-[0.7rem] tracking-[0.08em] transition-colors active:scale-[0.97]',
              active
                ? 'bg-accent text-[#f5f5f5]'
                : 'border border-ink/70 bg-transparent text-ink hover:border-accent hover:bg-accent/15 hover:text-ink',
            ].join(' ')}
          >
            <span className="relative z-10">{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}

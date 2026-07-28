import { motion } from 'framer-motion'
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
          <motion.button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            aria-pressed={active}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className={[
              'type-ui relative min-w-[5.5rem] rounded-full px-5 py-2.5 text-[0.7rem] tracking-[0.08em] transition-colors',
              active
                ? 'bg-ink text-ink-inverse'
                : 'border border-ink/70 bg-transparent text-ink hover:bg-ink hover:text-ink-inverse',
            ].join(' ')}
          >
            {active ? (
              <motion.span
                layoutId="view-toggle-fill"
                className="absolute inset-0 rounded-full bg-ink"
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            ) : null}
            <span className="relative z-10">{option.label}</span>
            {active ? (
              <span
                className="absolute inset-x-3 -bottom-px z-10 h-0.5 rounded-full bg-brand"
                aria-hidden
              />
            ) : null}
          </motion.button>
        )
      })}
    </div>
  )
}

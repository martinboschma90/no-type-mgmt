import { motion } from 'framer-motion'
import { useTheme } from '@/theme/ThemeProvider'

/** Light / dark switch — sits in the navbar. */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <div
      className="pointer-events-auto inline-flex items-center rounded-full border border-ink/25 bg-ink/5 p-0.5 backdrop-blur-sm"
      role="group"
      aria-label="Theme"
    >
      <button
        type="button"
        onClick={() => setTheme('light')}
        className="type-ui relative rounded-full px-3 py-1.5 text-[0.65rem]"
        aria-pressed={!isDark}
      >
        {!isDark && (
          <motion.span
            layoutId="theme-toggle-pill"
            className="absolute inset-0 rounded-full bg-accent"
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
          />
        )}
        <span
          className={`relative z-10 ${!isDark ? 'text-[#f5f5f5]' : 'text-ink/55'}`}
        >
          Light
        </span>
      </button>
      <button
        type="button"
        onClick={() => setTheme('dark')}
        className="type-ui relative rounded-full px-3 py-1.5 text-[0.65rem]"
        aria-pressed={isDark}
      >
        {isDark && (
          <motion.span
            layoutId="theme-toggle-pill"
            className="absolute inset-0 rounded-full bg-accent"
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
          />
        )}
        <span
          className={`relative z-10 ${isDark ? 'text-[#f5f5f5]' : 'text-ink/55'}`}
        >
          Dark
        </span>
      </button>
    </div>
  )
}

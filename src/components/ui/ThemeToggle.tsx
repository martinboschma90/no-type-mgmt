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
        className={`type-ui relative rounded-full px-2 py-1 text-[0.6rem] sm:px-3 sm:py-1.5 sm:text-[0.65rem] ${
          !isDark ? 'bg-accent text-[#f5f5f5]' : 'text-ink/55'
        }`}
        aria-pressed={!isDark}
      >
        Light
      </button>
      <button
        type="button"
        onClick={() => setTheme('dark')}
        className={`type-ui relative rounded-full px-2 py-1 text-[0.6rem] sm:px-3 sm:py-1.5 sm:text-[0.65rem] ${
          isDark ? 'bg-accent text-[#f5f5f5]' : 'text-ink/55'
        }`}
        aria-pressed={isDark}
      >
        Dark
      </button>
    </div>
  )
}

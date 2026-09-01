import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type CmsTheme = 'light' | 'dark'

type CmsThemeContextValue = {
  theme: CmsTheme
  toggleTheme: () => void
}

const CmsThemeContext = createContext<CmsThemeContextValue | null>(null)
const STORAGE_KEY = 'flow-mates-cms-theme-v2'

export function CmsThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<CmsTheme>(() => {
    if (typeof window === 'undefined') return 'dark'
    return window.localStorage.getItem(STORAGE_KEY) === 'light' ? 'light' : 'dark'
  })

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.add('cms-compact-root')
    return () => root.classList.remove('cms-compact-root')
  }, [])

  const value = useMemo(
    () => ({
      theme,
      toggleTheme: () => setTheme((current) => (current === 'light' ? 'dark' : 'light')),
    }),
    [theme],
  )

  return (
    <CmsThemeContext.Provider value={value}>
      <div
        data-cms
        data-cms-theme={theme}
        data-theme="light"
        className="cms-theme-root min-h-svh"
      >
        {children}
      </div>
    </CmsThemeContext.Provider>
  )
}

export function useCmsTheme() {
  const context = useContext(CmsThemeContext)
  if (!context) throw new Error('useCmsTheme must be used within CmsThemeProvider')
  return context
}

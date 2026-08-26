import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ThemeProvider } from '@/theme/ThemeProvider'
import { prefetchPublicArtists } from '@/cms/api/artistsCache'
import { isSupabaseConfigured } from '@/lib/supabase'

// Warm DNS/TLS + start roster fetch before React commits.
if (isSupabaseConfigured) {
  const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim()
  if (url) {
    const preconnect = document.createElement('link')
    preconnect.rel = 'preconnect'
    preconnect.href = url
    preconnect.crossOrigin = 'anonymous'
    document.head.appendChild(preconnect)
  }
  prefetchPublicArtists()
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
)

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ThemeProvider } from '@/theme/ThemeProvider'

function loadFonts() {
  const href =
    'https://fonts.googleapis.com/css2?family=Archivo+Black&family=Inter:wght@400;600&display=swap'
  if (document.querySelector(`link[href="${href}"]`)) return
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = href
  document.head.appendChild(link)
}

const root = document.getElementById('root')
if (root) {
  createRoot(root).render(
    <StrictMode>
      <ErrorBoundary>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </ErrorBoundary>
    </StrictMode>,
  )
}

requestAnimationFrame(() => {
  loadFonts()
  void import('@/cms/api/publicArtistsCache').then((m) => {
    m.prefetchPublicArtists()
  })
})

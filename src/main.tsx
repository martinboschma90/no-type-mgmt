import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { migrateArtistsV1toV2 } from '@/cms/api/publicArtistsFormat'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ThemeProvider } from '@/theme/ThemeProvider'

migrateArtistsV1toV2()

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

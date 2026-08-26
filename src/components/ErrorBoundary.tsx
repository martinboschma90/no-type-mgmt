import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { hasError: boolean }

/**
 * Keeps a white-screen crash from becoming a permanent black body.
 * Mobile Safari private mode / storage quirks are the usual trigger.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('App render error', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'grid',
            placeItems: 'center',
            padding: '2rem',
            background: '#f5f3ef',
            color: '#111111',
            fontFamily: 'system-ui, sans-serif',
            textAlign: 'center',
          }}
        >
          <div>
            <p style={{ margin: 0, fontSize: '1.125rem', letterSpacing: '0.04em' }}>
              NOTYP MGMT
            </p>
            <p style={{ margin: '0.75rem 0 1.25rem', opacity: 0.7, fontSize: '0.95rem' }}>
              Something went wrong loading the site.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                appearance: 'none',
                border: '1px solid #111111',
                background: 'transparent',
                color: '#111111',
                padding: '0.65rem 1.1rem',
                fontSize: '0.85rem',
                letterSpacing: '0.06em',
                cursor: 'pointer',
              }}
            >
              Reload
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

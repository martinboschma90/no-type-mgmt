import { Component, type ErrorInfo, type ReactNode } from 'react'
import { reportRumError } from '@/lib/siteRum'

type Props = {
  children: ReactNode
  /** Isolate this subtree so a crash here does not blank the rest of the app. */
  label?: string
  compact?: boolean
  /** Change this (e.g. pathname) to recover after navigation. */
  resetKey?: string
}

type State = { hasError: boolean }

/**
 * Keeps a render crash from taking down the rest of the tree.
 * Use nested boundaries around CMS vs public vs widgets.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props.resetKey !== prevProps.resetKey && this.state.hasError) {
      this.setState({ hasError: false })
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(this.props.label || 'App render error', error, info.componentStack)
    if (this.props.label !== 'cms' && this.props.label !== 'traffic') {
      reportRumError(error)
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.compact) {
        return (
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-6 text-center text-sm text-neutral-600">
            <p>Dit blok kon niet geladen worden.</p>
            <button
              type="button"
              className="mt-3 text-xs font-semibold text-neutral-900 underline"
              onClick={() => this.setState({ hasError: false })}
            >
              Opnieuw
            </button>
          </div>
        )
      }
      return (
        <div
          style={{
            minHeight: this.props.label ? '40vh' : '100vh',
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
              NOTYPE
            </p>
            <p style={{ margin: '0.75rem 0 1.25rem', opacity: 0.7, fontSize: '0.95rem' }}>
              {this.props.label
                ? 'Dit deel kon niet geladen worden. De rest van de site blijft beschikbaar.'
                : 'Something went wrong loading the site.'}
            </p>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false })}
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
              Opnieuw
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

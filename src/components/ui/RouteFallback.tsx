type RouteFallbackProps = {
  /** Compact fill for CMS editor/preview columns. */
  compact?: boolean
}

/** Dark-UI loading state for lazy routes. */
export function RouteFallback({ compact = false }: RouteFallbackProps) {
  return (
    <div
      className={
        compact
          ? 'flex h-full min-h-[12rem] items-center justify-center'
          : 'flex min-h-[100vh] items-center justify-center bg-[var(--body-bg,#090909)]'
      }
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <span
        className="h-6 w-6 animate-spin rounded-full border-2 border-ink/15 border-t-accent"
        aria-hidden
      />
      <span className="sr-only">Loading</span>
    </div>
  )
}

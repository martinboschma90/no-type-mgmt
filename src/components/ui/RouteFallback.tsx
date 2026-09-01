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
          : 'min-h-[100vh] bg-[var(--body-bg,#090909)]'
      }
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      {compact ? (
        <span
          className="h-6 w-6 animate-spin rounded-full border-2 border-ink/15 border-t-accent"
          aria-hidden
        />
      ) : null}
      <span className="sr-only">Loading</span>
    </div>
  )
}

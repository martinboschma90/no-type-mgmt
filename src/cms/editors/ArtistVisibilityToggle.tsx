type ArtistVisibilityToggleProps = {
  visible: boolean
  onChange: (visible: boolean) => void
  compact?: boolean
  onLabel?: string
  offLabel?: string
}

/** Toggle public visibility of an artist on roster + artist page. */
export function ArtistVisibilityToggle({
  visible,
  onChange,
  compact = false,
  onLabel = 'Live',
  offLabel = 'Verborgen',
}: ArtistVisibilityToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={visible}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onChange(!visible)
      }}
      className={[
        'inline-flex items-center gap-1.5 rounded-full border font-medium transition-colors',
        compact ? 'px-2 py-1 text-[10px]' : 'px-2.5 py-1.5 text-xs',
        visible
          ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-600'
          : 'border-neutral-200 bg-neutral-100 text-neutral-500',
      ].join(' ')}
    >
      <span
        className={[
          'relative inline-flex h-4 w-7 shrink-0 rounded-full transition-colors',
          visible ? 'bg-emerald-500' : 'bg-neutral-400',
        ].join(' ')}
        aria-hidden
      >
        <span
          className={[
            'absolute top-0.5 h-3 w-3 rounded-full bg-white shadow-sm transition-transform',
            visible ? 'left-3.5' : 'left-0.5',
          ].join(' ')}
        />
      </span>
      <span>
        {visible ? onLabel : offLabel}
      </span>
    </button>
  )
}

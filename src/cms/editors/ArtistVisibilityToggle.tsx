type ArtistVisibilityToggleProps = {
  visible: boolean
  onChange: (visible: boolean) => void
  compact?: boolean
}

/** Toggle public visibility of an artist on roster + artist page. */
export function ArtistVisibilityToggle({
  visible,
  onChange,
  compact = false,
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
        'inline-flex items-center gap-2 rounded-full border transition-colors',
        compact ? 'px-2.5 py-1.5' : 'px-3 py-2',
        visible
          ? 'border-brand/40 bg-brand/15 text-ink'
          : 'border-ink/15 bg-ink/5 text-ink/45',
      ].join(' ')}
    >
      <span
        className={[
          'relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors',
          visible ? 'bg-brand' : 'bg-ink/20',
        ].join(' ')}
        aria-hidden
      >
        <span
          className={[
            'absolute top-0.5 h-4 w-4 rounded-full bg-[#111111] transition-transform',
            visible ? 'left-4' : 'left-0.5',
          ].join(' ')}
        />
      </span>
      <span className="type-label text-[0.55rem] tracking-[0.12em] uppercase">
        {visible ? 'Zichtbaar' : 'Verborgen'}
      </span>
    </button>
  )
}

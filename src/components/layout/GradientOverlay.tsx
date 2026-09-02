/**
 * Subtle purple atmosphere only — no full-bleed color wash.
 * Premium / underground, not festival.
 */
export function GradientOverlay() {
  return (
    <div
      id="gradient-overlay"
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      <div
        className="absolute -left-[20%] top-[-10%] h-[55vmax] w-[55vmax] rounded-full opacity-100 blur-[64px] sm:blur-[120px]"
        style={{ background: 'var(--glow-purple)' }}
      />
      <div
        className="absolute -right-[15%] bottom-[-20%] h-[45vmax] w-[45vmax] rounded-full blur-[72px] sm:blur-[140px]"
        style={{ background: 'var(--glow-purple-strong)' }}
      />
    </div>
  )
}

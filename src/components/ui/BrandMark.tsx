import { Logo } from '@/components/ui/Logo'

type BrandMarkProps = {
  className?: string
  /** Seconds for one full rotation — luxury pace (45–60). */
  duration?: number
}

/** Circular No Type seal — CSS spin only (no Framer on first paint). */
export function BrandMark({ className = '', duration = 52 }: BrandMarkProps) {
  return (
    <div className="relative" aria-hidden>
      <div
        className="brand-mark-spin origin-center cursor-default"
        style={{ animationDuration: `${duration}s` }}
      >
        <Logo variant="seal" className={className} title="" fetchPriority="low" />
      </div>
    </div>
  )
}

import { motion, useReducedMotion } from 'framer-motion'
import { Logo } from '@/components/ui/Logo'

type BrandMarkProps = {
  className?: string
  /** Seconds for one full rotation — luxury pace (45–60). */
  duration?: number
}

/**
 * Circular No Type seal — signature brand mark.
 * Slow linear spin only (no scroll-linked motion — that hangs iOS Safari).
 */
export function BrandMark({ className = '', duration = 52 }: BrandMarkProps) {
  const reduceMotion = useReducedMotion()

  return (
    <div className="relative" aria-hidden>
      <motion.div
        className="origin-center cursor-default"
        animate={reduceMotion ? undefined : { rotate: 360 }}
        transition={
          reduceMotion
            ? undefined
            : {
                duration,
                ease: 'linear',
                repeat: Infinity,
              }
        }
      >
        <Logo variant="seal" className={className} title="" />
      </motion.div>
    </div>
  )
}

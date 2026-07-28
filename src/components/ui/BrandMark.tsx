import { useRef } from 'react'
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'framer-motion'
import { Logo } from '@/components/ui/Logo'

type BrandMarkProps = {
  className?: string
  /** Seconds for one full rotation — luxury pace (45–60). */
  duration?: number
}

/**
 * Circular No Type seal — signature brand mark.
 * Slow linear spin, subtle hover, light scroll drift. Not decorative noise.
 */
export function BrandMark({ className = '', duration = 52 }: BrandMarkProps) {
  const reduceMotion = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })

  const y = useTransform(scrollYProgress, [0, 0.5, 1], [18, 0, -22])
  const scrollTilt = useTransform(scrollYProgress, [0, 1], [-6, 8])

  return (
    <motion.div
      ref={ref}
      className="relative will-change-transform"
      style={reduceMotion ? undefined : { y }}
      aria-hidden
    >
      <motion.div
        className="origin-center will-change-transform"
        style={reduceMotion ? undefined : { rotate: scrollTilt }}
      >
        <motion.div
          className="origin-center cursor-default will-change-transform"
          whileHover={
            reduceMotion
              ? undefined
              : {
                  scale: 1.035,
                  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
                }
          }
          whileTap={reduceMotion ? undefined : { scale: 0.99 }}
        >
          <motion.div
            className="origin-center"
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
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

import { motion } from 'framer-motion'
import { Logo } from '@/components/ui/Logo'

type BrandLoaderProps = {
  label?: string
}

/** Full-viewport loading state with spinning seal. */
export function BrandLoader({ label = 'Loading' }: BrandLoaderProps) {
  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-5 bg-[#090909]"
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(88,40,120,0.2),transparent_55%)]"
        aria-hidden
      />
      <motion.div
        className="relative"
        animate={{ rotate: 360 }}
        transition={{ duration: 52, ease: 'linear', repeat: Infinity }}
      >
        <Logo variant="seal" height={160} title="" />
      </motion.div>
      <span className="sr-only">{label}</span>
    </div>
  )
}

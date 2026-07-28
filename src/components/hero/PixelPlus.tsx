import { motion } from 'framer-motion'

type PixelPlusProps = {
  color: string
  size?: number
  className?: string
  delay?: number
}

/** Decorative pixel-art plus / star used around the hero. */
export function PixelPlus({
  color,
  size = 16,
  className = '',
  delay = 0,
}: PixelPlusProps) {
  return (
    <motion.span
      className={`absolute block ${className}`}
      style={{ width: size, height: size, color }}
      initial={{ opacity: 0, scale: 0.4 }}
      animate={{
        opacity: [0.55, 1, 0.55],
        scale: [0.9, 1.08, 0.9],
        y: [0, -6, 0],
      }}
      transition={{
        duration: 3.6 + delay,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      aria-hidden
    >
      <svg viewBox="0 0 16 16" fill="currentColor" className="h-full w-full">
        <path d="M6 0h4v6h6v4h-6v6H6v-6H0V6h6V0z" />
      </svg>
    </motion.span>
  )
}

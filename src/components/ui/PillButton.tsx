import { motion, type HTMLMotionProps } from 'framer-motion'

type PillButtonProps = HTMLMotionProps<'a'> & {
  variant?: 'solid' | 'ghost'
}

export function PillButton({
  variant = 'solid',
  className = '',
  children,
  ...props
}: PillButtonProps) {
  const base =
    'type-ui inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-xs transition-colors'

  const styles =
    variant === 'solid'
      ? 'bg-ink text-ink-inverse hover:bg-accent hover:text-[#f5f5f5]'
      : 'border border-ink/80 bg-transparent text-ink hover:border-accent hover:bg-accent/15 hover:text-ink'

  return (
    <motion.a
      className={`${base} ${styles} ${className}`}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      {...props}
    >
      {children}
    </motion.a>
  )
}

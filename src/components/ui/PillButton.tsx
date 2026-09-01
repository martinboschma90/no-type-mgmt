import type { AnchorHTMLAttributes, ReactNode } from 'react'

type PillButtonProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: 'solid' | 'ghost'
  children?: ReactNode
}

export function PillButton({
  variant = 'solid',
  className = '',
  children,
  ...props
}: PillButtonProps) {
  const base =
    'type-ui inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-xs transition-transform transition-colors hover:scale-[1.03] active:scale-[0.97]'

  const styles =
    variant === 'solid'
      ? 'bg-ink text-ink-inverse hover:bg-accent hover:text-[#f5f5f5]'
      : 'border border-ink/80 bg-transparent text-ink hover:border-accent hover:bg-accent/15 hover:text-ink'

  return (
    <a className={`${base} ${styles} ${className}`} {...props}>
      {children}
    </a>
  )
}

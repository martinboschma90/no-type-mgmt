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
      <div className="brand-mark-spin origin-center">
        <Logo variant="seal" height={160} title="" />
      </div>
      <span className="sr-only">{label}</span>
    </div>
  )
}

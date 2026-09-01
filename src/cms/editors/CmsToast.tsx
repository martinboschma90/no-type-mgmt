import { useEffect } from 'react'

type CmsToastProps = {
  message: string
  detail?: string
  onDismiss: () => void
}

/** Short-lived save confirmation — sits above the editor chrome. */
export function CmsToast({ message, detail, onDismiss }: CmsToastProps) {
  useEffect(() => {
    const t = window.setTimeout(onDismiss, 3800)
    return () => window.clearTimeout(t)
  }, [onDismiss, message, detail])

  return (
    <div
      role="status"
      className="pointer-events-none fixed right-4 bottom-4 z-[90] max-w-[min(20rem,calc(100vw-2rem))] rounded-2xl border px-4 py-3 shadow-[0_12px_40px_rgba(0,0,0,0.18)] sm:right-6 sm:bottom-6"
      style={{
        background: 'var(--cms-surface)',
        borderColor: 'var(--cms-border)',
      }}
    >
      <p className="m-0 text-sm font-semibold text-neutral-900">{message}</p>
      {detail ? (
        <p className="mt-1 text-[11px] text-neutral-500">
          {detail}
        </p>
      ) : null}
    </div>
  )
}

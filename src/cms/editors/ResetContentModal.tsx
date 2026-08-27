import { useEffect, useId, useRef, useState } from 'react'
import { downloadCmsBackup } from '@/cms/cmsBackup'
import type { CmsContent } from '@/cms/content'

const CONFIRM_WORD = 'RESET'

type ResetContentModalProps = {
  open: boolean
  content: CmsContent
  onClose: () => void
  onConfirm: () => void
}

export function ResetContentModal({
  open,
  content,
  onClose,
  onConfirm,
}: ResetContentModalProps) {
  const titleId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [typed, setTyped] = useState('')
  const canReset = typed === CONFIRM_WORD

  useEffect(() => {
    if (!open) {
      setTyped('')
      return
    }
    const t = window.setTimeout(() => inputRef.current?.focus(), 40)
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(t)
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md rounded-2xl border border-ink/12 bg-[var(--body-bg)] p-5 text-ink shadow-xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={titleId} className="type-headline m-0 text-lg text-ink">
          Reset all CMS content?
        </h2>
        <p className="type-body mt-2 text-sm text-ink/55">
          This restores the defaults shipped with the site and cannot be undone.
          Download a backup first if you might need this data again.
        </p>

        <label className="mt-5 block">
          <span className="type-label mb-1.5 block text-[0.65rem] tracking-[0.14em] text-ink/45 uppercase">
            Type {CONFIRM_WORD} to confirm
          </span>
          <input
            ref={inputRef}
            type="text"
            autoComplete="off"
            spellCheck={false}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            className="w-full rounded-lg border border-ink/12 bg-[var(--body-bg)] px-3 py-2.5 type-body text-sm text-ink outline-none focus:border-red-500/70"
            placeholder={CONFIRM_WORD}
          />
        </label>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={() => downloadCmsBackup(content)}
            className="type-label rounded-xl border border-ink/15 px-3.5 py-2.5 text-[0.65rem] tracking-[0.12em] text-ink uppercase transition-colors hover:border-ink/30"
          >
            Download backup
          </button>
          <button
            type="button"
            onClick={onClose}
            className="type-label rounded-xl border border-ink/12 px-3.5 py-2.5 text-[0.65rem] tracking-[0.12em] text-ink/50 uppercase transition-colors hover:text-ink sm:ml-auto"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canReset}
            onClick={() => {
              onConfirm()
              onClose()
            }}
            className="type-label rounded-xl bg-red-600 px-3.5 py-2.5 text-[0.65rem] tracking-[0.12em] text-white uppercase transition-opacity disabled:cursor-not-allowed disabled:opacity-35"
          >
            Reset content
          </button>
        </div>
      </div>
    </div>
  )
}

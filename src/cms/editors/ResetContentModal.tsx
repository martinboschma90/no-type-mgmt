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
        className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-5 text-neutral-900 shadow-xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={titleId} className="m-0 text-lg font-semibold text-neutral-900">
          Reset all CMS content?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-neutral-500">
          This restores the defaults shipped with the site and cannot be undone.
          Download a backup first if you might need this data again.
        </p>

        <label className="mt-5 block">
          <span className="mb-1.5 block text-[11px] font-semibold text-neutral-700">
            Type {CONFIRM_WORD} to confirm
          </span>
          <input
            ref={inputRef}
            type="text"
            autoComplete="off"
            spellCheck={false}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            className="w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-900 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
            placeholder={CONFIRM_WORD}
          />
        </label>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={() => downloadCmsBackup(content)}
            className="cms-secondary-action rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Download backup
          </button>
          <button
            type="button"
            onClick={onClose}
            className="cms-secondary-action rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 sm:ml-auto"
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
            className="rounded-lg bg-red-600 px-3.5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-35"
          >
            Reset content
          </button>
        </div>
      </div>
    </div>
  )
}

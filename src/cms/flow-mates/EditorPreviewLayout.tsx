import {
  Children,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'
import { ChevronLeft, ChevronRight, GripVertical, Monitor, X } from 'lucide-react'

const STORAGE_KEY = 'flow-mates-cms-editor-width'
const DEFAULT_EDITOR_WIDTH = 48

export function EditorPreviewLayout({ children }: { children: ReactNode }) {
  const parts = Children.toArray(children)
  const editor = parts[0] ?? null
  const preview = parts[1] ?? null
  const rootRef = useRef<HTMLDivElement>(null)
  const [previewCollapsed, setPreviewCollapsed] = useState(false)
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false)
  const [isXl, setIsXl] = useState(false)
  const [editorWidth, setEditorWidth] = useState(DEFAULT_EDITOR_WIDTH)

  useEffect(() => {
    const saved = Number(window.localStorage.getItem(STORAGE_KEY))
    if (Number.isFinite(saved) && saved >= 35 && saved <= 72) setEditorWidth(saved)
  }, [])

  useEffect(() => {
    const query = window.matchMedia('(min-width: 1280px)')
    const sync = () => {
      setIsXl(query.matches)
      if (query.matches) setMobilePreviewOpen(false)
    }
    sync()
    query.addEventListener('change', sync)
    return () => query.removeEventListener('change', sync)
  }, [])

  const startResize = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault()
    const root = rootRef.current
    if (!root) return
    const rect = root.getBoundingClientRect()

    const onMove = (moveEvent: PointerEvent) => {
      const next = ((moveEvent.clientX - rect.left) / rect.width) * 100
      setEditorWidth(Math.min(72, Math.max(35, next)))
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      setEditorWidth((current) => {
        window.localStorage.setItem(STORAGE_KEY, String(current))
        return current
      })
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp, { once: true })
  }

  return (
    <div ref={rootRef} className="relative flex min-w-0 gap-0">
      <div
        className={previewCollapsed ? 'min-w-0 flex-1' : 'min-w-0 flex-1 xl:flex-none'}
        style={!isXl || previewCollapsed ? undefined : { width: `${editorWidth}%` }}
      >
        {editor}
      </div>

      {isXl && !previewCollapsed ? (
        <>
          <button
            type="button"
            onPointerDown={startResize}
            className="group/resize hidden w-6 shrink-0 cursor-col-resize touch-none items-center justify-center xl:flex"
            aria-label="Breedte van editor aanpassen"
          >
            <span className="flex h-20 w-2 items-center justify-center rounded-full bg-neutral-200 text-neutral-400 group-hover/resize:bg-neutral-300 group-hover/resize:text-neutral-700">
              <GripVertical className="h-4 w-4" />
            </span>
          </button>
          <div className="relative hidden min-w-0 flex-1 self-start xl:sticky xl:top-[var(--cms-editor-sticky-top,0px)] xl:block xl:h-[calc(100vh-3.5rem)]">
            <button
              type="button"
              onClick={() => setPreviewCollapsed(true)}
              className="absolute right-2 top-2 z-20 inline-flex h-7 w-7 items-center justify-center rounded-md border border-neutral-200 bg-white text-neutral-600 shadow-sm hover:bg-neutral-50"
              aria-label="Preview inklappen"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
            <div className="h-full overflow-hidden rounded-xl border border-neutral-200 bg-white [&>*]:h-full">
              {preview}
            </div>
          </div>
        </>
      ) : null}

      {isXl && previewCollapsed ? (
        <button
          type="button"
          onClick={() => setPreviewCollapsed(false)}
          className="sticky top-3 ml-3 hidden h-9 shrink-0 items-center gap-1 rounded-lg border border-neutral-200 bg-white px-3 text-xs font-medium text-neutral-600 shadow-sm hover:bg-neutral-50 xl:inline-flex"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Preview tonen
        </button>
      ) : null}

      {!isXl ? (
        <>
          <button
            type="button"
            onClick={() => setMobilePreviewOpen(true)}
            className="fixed bottom-5 right-5 z-30 inline-flex items-center gap-2 rounded-full bg-neutral-900 px-4 py-3 text-sm font-semibold text-white shadow-xl hover:bg-neutral-800 xl:hidden"
          >
            <Monitor className="h-4 w-4" />
            Live preview
          </button>
          {mobilePreviewOpen ? (
            <div className="fixed inset-0 z-40 flex flex-col bg-white xl:hidden">
              <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
                <p className="text-sm font-medium text-neutral-900">Live preview</p>
                <button
                  type="button"
                  onClick={() => setMobilePreviewOpen(false)}
                  className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100"
                  aria-label="Sluiten"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="min-h-0 flex-1 [&>*]:h-full">{preview}</div>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  )
}

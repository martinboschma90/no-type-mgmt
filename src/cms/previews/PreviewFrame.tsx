import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { ExternalLink, Maximize2, Minimize2, Monitor, RefreshCw, Smartphone, Tablet } from 'lucide-react'
import { useTheme } from '@/theme/ThemeProvider'

export type PreviewDevice = 'desktop' | 'tablet' | 'mobile'

type PreviewFrameProps = {
  label: string
  children: ReactNode
  /** Scroll the preview iframe to this element id after mount. */
  scrollToId?: string
}

const devices: {
  id: PreviewDevice
  label: string
  width: number | null
  icon: typeof Monitor
}[] = [
  { id: 'desktop', label: 'Desktop · 1280px', width: 1280, icon: Monitor },
  { id: 'tablet', label: 'Tablet · 820px', width: 820, icon: Tablet },
  { id: 'mobile', label: 'Mobile · 390px', width: 390, icon: Smartphone },
]

/**
 * Frame CMS preview chrome. Inner island is Notype content only.
 */
export function PreviewFrame({ label, children, scrollToId }: PreviewFrameProps) {
  const { theme } = useTheme()
  const [device, setDevice] = useState<PreviewDevice>('desktop')
  const [nonce, setNonce] = useState(0)
  const [maximized, setMaximized] = useState(false)
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null)
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 })
  const stageRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const active = devices.find((d) => d.id === device) ?? devices[0]
  const logicalWidth = active.width ?? 1280
  const scale = stageSize.width
    ? Math.min(1, stageSize.width / logicalWidth)
    : 1
  const logicalHeight = Math.max(720, stageSize.height / Math.max(scale, 0.01))

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const observer = new ResizeObserver(([entry]) => {
      setStageSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      })
    })
    observer.observe(stage)
    return () => observer.disconnect()
  }, [maximized])

  useEffect(() => {
    const doc = iframeRef.current?.contentDocument
    if (!doc) return
    doc.documentElement.dataset.theme = theme
    const root = doc.getElementById('preview-root')
    if (root) root.dataset.theme = theme
  }, [theme, mountNode])

  useEffect(() => {
    if (!mountNode) return
    let attempts = 0
    let timer = 0

    const tick = () => {
      attempts += 1
      if (!scrollToId) {
        mountNode.scrollTo({ top: 0 })
        return
      }
      const target = mountNode.ownerDocument.getElementById(scrollToId)
      if (!target) {
        if (attempts < 15) timer = window.setTimeout(tick, 120)
        return
      }
      const top =
        target.getBoundingClientRect().top -
        mountNode.getBoundingClientRect().top +
        mountNode.scrollTop
      mountNode.scrollTo({ top: Math.max(0, top - 16), behavior: 'smooth' })
    }

    timer = window.setTimeout(tick, 80)
    return () => window.clearTimeout(timer)
  }, [mountNode, scrollToId])

  const initializeFrame = useCallback(() => {
    const iframe = iframeRef.current
    const doc = iframe?.contentDocument
    if (!doc) return

    doc.head.replaceChildren()
    for (const node of document.querySelectorAll('style, link[rel="stylesheet"]')) {
      doc.head.appendChild(node.cloneNode(true))
    }
    const base = doc.createElement('base')
    base.href = window.location.origin
    doc.head.prepend(base)

    const style = doc.createElement('style')
    style.textContent = `
      html, body { margin: 0; height: 100%; overflow: hidden !important; }
      #preview-root { height: 100%; overflow: auto !important; overflow-x: hidden; }
    `
    doc.head.appendChild(style)
    doc.documentElement.dataset.theme = theme
    setMountNode(doc.getElementById('preview-root'))
  }, [theme])

  return (
    <div
      className={`flex min-h-0 flex-col overflow-hidden bg-white ${
        maximized ? 'fixed inset-0 z-50' : 'h-full'
      }`}
    >
      <div className="sticky top-0 z-20 flex shrink-0 items-center justify-between gap-3 border-b border-neutral-200 bg-white px-3 py-2">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-500">
            Live preview
          </p>
          <p className="truncate text-xs text-neutral-400">
            {label} · {active.label}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <div className="inline-flex items-center gap-0.5 rounded-md bg-white p-0.5 ring-1 ring-neutral-200">
            {devices.map(({ id, icon: Icon, label: title }) => (
              <button
                key={id}
                type="button"
                title={title}
                onClick={() => {
                  setMountNode(null)
                  setDevice(id)
                }}
                className={`rounded-[5px] p-1.5 transition-all ${
                  id === device
                    ? 'bg-neutral-900 text-white'
                    : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            ))}
          </div>
          <div className="mx-1 h-5 w-px bg-neutral-200" />
          <button
            type="button"
            title="Refresh preview"
            onClick={() => {
              setMountNode(null)
              setNonce((n) => n + 1)
            }}
            className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            title={maximized ? 'Exit fullscreen' : 'Maximize preview'}
            onClick={() => setMaximized((m) => !m)}
            className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
          >
            {maximized ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            title="Open live website"
            className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden bg-[#ece8e1] p-4">
        <div ref={stageRef} className="flex h-full min-h-0 justify-center overflow-hidden">
          <div
            className="relative overflow-hidden rounded-lg bg-white shadow-md"
            style={{
              width: `${logicalWidth * scale}px`,
              height: `${stageSize.height || 720}px`,
            }}
          >
            <iframe
              key={`${device}-${nonce}`}
              ref={iframeRef}
              title={`${label} ${active.label} preview`}
              srcDoc='<!doctype html><html><head></head><body><div id="preview-root"></div></body></html>'
              onLoad={initializeFrame}
              className="absolute left-0 top-0 border-0 bg-white"
              style={{
                width: `${logicalWidth}px`,
                height: `${logicalHeight}px`,
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
              }}
            />
            {mountNode &&
              createPortal(
                <div
                  data-cms-preview
                  data-theme={theme}
                  className="min-h-full text-ink"
                  onClickCapture={(event) => {
                    if ((event.target as Element).closest('a')) {
                      event.preventDefault()
                      event.stopPropagation()
                    }
                  }}
                >
                  {children}
                </div>,
                mountNode,
              )}
          </div>
        </div>
      </div>
    </div>
  )
}

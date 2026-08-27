import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { Field } from '@/cms/fields'
import {
  IMAGE_FOCUS_MAX,
  IMAGE_FOCUS_MIN,
  IMAGE_SCALE_DEFAULT,
  IMAGE_SCALE_MAX,
  IMAGE_SCALE_MIN,
  formatFocus,
  portraitImageStyle,
} from '@/cms/imageFocus'
import { useResolvedMediaUrl } from '@/cms/media/useResolvedMediaUrl'

type ImageFocusFieldProps = {
  imageUrl?: string
  imageAlt?: string
  x: number
  y: number
  scale: number
  onChange: (next: { x: number; y: number; scale: number }) => void
}

const NUDGE = 4

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

/**
 * Interactive 3:4 card cropper — drag / sliders to move up·down·left·right, zoom in/out.
 */
export function ImageFocusField({
  imageUrl,
  imageAlt = '',
  x,
  y,
  scale,
  onChange,
}: ImageFocusFieldProps) {
  const resolved = useResolvedMediaUrl(imageUrl)
  const frame = portraitImageStyle(formatFocus(x, y), scale)
  const stageRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{
    pointerId: number
    startX: number
    startY: number
    originX: number
    originY: number
    width: number
    height: number
  } | null>(null)
  const [dragging, setDragging] = useState(false)

  const patch = useCallback(
    (partial: Partial<{ x: number; y: number; scale: number }>) => {
      onChange({
        x: clamp(partial.x ?? x, IMAGE_FOCUS_MIN, IMAGE_FOCUS_MAX),
        y: clamp(partial.y ?? y, IMAGE_FOCUS_MIN, IMAGE_FOCUS_MAX),
        scale: clamp(
          Math.round((partial.scale ?? scale) * 100) / 100,
          IMAGE_SCALE_MIN,
          IMAGE_SCALE_MAX,
        ),
      })
    },
    [onChange, scale, x, y],
  )

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!resolved || e.button !== 0) return
    const rect = stageRef.current?.getBoundingClientRect()
    if (!rect) return
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: x,
      originY: y,
      width: rect.width,
      height: rect.height,
    }
    setDragging(true)
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== e.pointerId) return
    const dx = e.clientX - drag.startX
    const dy = e.clientY - drag.startY
    // Photo follows the pointer (Instagram-style)
    patch({
      x: drag.originX - (dx / drag.width) * (100 / scale),
      y: drag.originY - (dy / drag.height) * (100 / scale),
    })
  }

  const endDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === e.pointerId) {
      dragRef.current = null
      setDragging(false)
      try {
        e.currentTarget.releasePointerCapture(e.pointerId)
      } catch {
        // already released
      }
    }
  }

  useEffect(() => {
    const el = stageRef.current
    if (!el || !resolved) return

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const delta = e.deltaY > 0 ? -0.06 : 0.06
      patch({ scale: scale + delta })
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [patch, resolved, scale])

  /**
   * Vertical slider: left = artiest omhoog op de card, right = omlaag.
   * Matches drag: dragging the photo down lowers the subject (lower Y).
   */
  const verticalSlider = 100 - y
  const setVerticalSlider = (value: number) => {
    patch({ y: 100 - value })
  }

  const onThumbPointer = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!resolved || (e.buttons === 0 && e.type !== 'pointerdown')) return
    const rect = e.currentTarget.getBoundingClientRect()
    if (rect.width < 2 || rect.height < 2) return
    patch({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    })
  }

  return (
    <Field
      label="Focal point"
      hint="Click the thumbnail to set the focus. The large preview shows the card crop."
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-start gap-4">
          <div>
            <p className="type-label mb-2 text-[0.55rem] tracking-[0.14em] text-ink/40 uppercase">
              Focus
            </p>
            <div
              role="slider"
              aria-label="Image focal point"
              aria-valuemin={IMAGE_FOCUS_MIN}
              aria-valuemax={IMAGE_FOCUS_MAX}
              aria-valuenow={Math.round(x)}
              tabIndex={resolved ? 0 : -1}
              onPointerDown={(e) => {
                if (!resolved || e.button !== 0) return
                e.currentTarget.setPointerCapture(e.pointerId)
                onThumbPointer(e)
              }}
              onPointerMove={(e) => {
                if (!e.currentTarget.hasPointerCapture(e.pointerId)) return
                onThumbPointer(e)
              }}
              className={[
                'relative h-28 w-24 shrink-0 overflow-hidden rounded-xl bg-ink/10 ring-1 ring-ink/10',
                resolved ? 'cursor-crosshair touch-none' : '',
              ].join(' ')}
            >
              {resolved ? (
                <img
                  src={resolved}
                  alt=""
                  className="pointer-events-none absolute inset-0 h-full w-full object-cover"
                  draggable={false}
                />
              ) : (
                <div className="flex h-full items-center justify-center px-2 text-center type-label text-[0.5rem] tracking-[0.1em] text-ink/35 uppercase">
                  No image
                </div>
              )}
              {resolved ? (
                <span
                  className="pointer-events-none absolute z-[1] h-5 w-5 -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${x}%`, top: `${y}%` }}
                  aria-hidden
                >
                  <span className="absolute inset-0 rounded-full border-2 border-brand shadow-[0_0_0_1px_rgba(0,0,0,0.45)]" />
                  <span className="absolute top-1/2 left-0 h-px w-full -translate-y-1/2 bg-brand" />
                  <span className="absolute top-0 left-1/2 h-full w-px -translate-x-1/2 bg-brand" />
                </span>
              ) : null}
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <p className="type-label mb-2 text-[0.55rem] tracking-[0.14em] text-ink/40 uppercase">
              Card preview
            </p>
        <div
          ref={stageRef}
          role="presentation"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          className={[
            'relative mx-auto w-full max-w-[220px] select-none overflow-hidden rounded-[1.75rem] bg-[#151217] shadow-[0_12px_40px_rgba(0,0,0,0.18)] ring-1 ring-ink/10 touch-none',
            resolved ? (dragging ? 'cursor-grabbing' : 'cursor-grab') : '',
          ].join(' ')}
          style={{ aspectRatio: '3 / 4' }}
        >
          {resolved ? (
            <img
              src={resolved}
              alt={imageAlt}
              className="artist-card__img pointer-events-none absolute"
              style={frame}
              draggable={false}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center type-label text-[0.55rem] text-white/35 uppercase">
              Upload eerst een foto
            </div>
          )}

          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[48%]"
            style={{
              background:
                'linear-gradient(to top, rgba(9,9,9,0.82) 0%, rgba(9,9,9,0.45) 42%, rgba(9,9,9,0) 100%)',
            }}
            aria-hidden
          />

          <div
            className="pointer-events-none absolute inset-0 z-[2]"
            aria-hidden
          >
            <span
              className="absolute h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/85 shadow-[0_0_0_1px_rgba(0,0,0,0.35)]"
              style={{ left: `${x}%`, top: `${y}%` }}
            />
            <span
              className="absolute h-px w-8 -translate-x-1/2 -translate-y-1/2 bg-white/90"
              style={{ left: `${x}%`, top: `${y}%` }}
            />
            <span
              className="absolute h-8 w-px -translate-x-1/2 -translate-y-1/2 bg-white/90"
              style={{ left: `${x}%`, top: `${y}%` }}
            />
          </div>

          <p className="pointer-events-none absolute inset-x-0 bottom-3 z-[3] text-center type-label text-[0.55rem] tracking-[0.14em] text-white/70 uppercase">
            {dragging ? 'Loslaten om te bevestigen' : 'Sleep om te verplaatsen'}
          </p>
        </div>
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-ink/10 bg-[var(--body-bg)] p-3">
          {/* Vertical: up / down */}
          <div>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className="type-label text-[0.6rem] tracking-[0.14em] text-ink/45 uppercase">
                Omhoog / omlaag
              </span>
              <span className="type-label text-[0.65rem] text-ink/55 tabular-nums">
                {Math.round(y)}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Artiest omhoog"
                title="Omhoog"
                disabled={!resolved || y >= IMAGE_FOCUS_MAX}
                onClick={() => patch({ y: y + NUDGE })}
                className="type-ui flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ink/15 text-sm text-ink disabled:opacity-30"
              >
                ↑
              </button>
              <input
                type="range"
                min={IMAGE_FOCUS_MIN}
                max={IMAGE_FOCUS_MAX}
                step={1}
                value={verticalSlider}
                disabled={!resolved}
                onChange={(e) => setVerticalSlider(Number(e.target.value))}
                className="h-1.5 w-full accent-accent disabled:opacity-40"
                aria-label="Positie omhoog of omlaag"
              />
              <button
                type="button"
                aria-label="Artiest omlaag"
                title="Omlaag"
                disabled={!resolved || y <= IMAGE_FOCUS_MIN}
                onClick={() => patch({ y: y - NUDGE })}
                className="type-ui flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ink/15 text-sm text-ink disabled:opacity-30"
              >
                ↓
              </button>
            </div>
            <div className="mt-1 flex justify-between type-label text-[0.5rem] tracking-[0.1em] text-ink/30 uppercase">
              <span>Omhoog</span>
              <span>Omlaag</span>
            </div>
          </div>

          {/* Horizontal: left / right */}
          <div>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className="type-label text-[0.6rem] tracking-[0.14em] text-ink/45 uppercase">
                Links / rechts
              </span>
              <span className="type-label text-[0.65rem] text-ink/55 tabular-nums">
                {Math.round(x)}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Artiest naar links"
                title="Links"
                disabled={!resolved || x >= IMAGE_FOCUS_MAX}
                onClick={() => patch({ x: x + NUDGE })}
                className="type-ui flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ink/15 text-sm text-ink disabled:opacity-30"
              >
                ←
              </button>
              <input
                type="range"
                min={IMAGE_FOCUS_MIN}
                max={IMAGE_FOCUS_MAX}
                step={1}
                value={100 - x}
                disabled={!resolved}
                onChange={(e) => patch({ x: 100 - Number(e.target.value) })}
                className="h-1.5 w-full accent-accent disabled:opacity-40"
                aria-label="Positie links of rechts"
              />
              <button
                type="button"
                aria-label="Artiest naar rechts"
                title="Rechts"
                disabled={!resolved || x <= IMAGE_FOCUS_MIN}
                onClick={() => patch({ x: x - NUDGE })}
                className="type-ui flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ink/15 text-sm text-ink disabled:opacity-30"
              >
                →
              </button>
            </div>
            <div className="mt-1 flex justify-between type-label text-[0.5rem] tracking-[0.1em] text-ink/30 uppercase">
              <span>Links</span>
              <span>Rechts</span>
            </div>
          </div>

          {/* Zoom */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Uitzoomen"
              disabled={!resolved || scale <= IMAGE_SCALE_MIN}
              onClick={() => patch({ scale: scale - 0.1 })}
              className="type-ui flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ink/15 text-sm text-ink disabled:opacity-30"
            >
              −
            </button>
            <label className="min-w-0 flex-1">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="type-label text-[0.6rem] tracking-[0.14em] text-ink/45 uppercase">
                  Zoom
                </span>
                <span className="type-label text-[0.65rem] text-ink/55 tabular-nums">
                  {Math.round(scale * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={IMAGE_SCALE_MIN}
                max={IMAGE_SCALE_MAX}
                step={0.05}
                value={scale}
                disabled={!resolved}
                onChange={(e) => patch({ scale: Number(e.target.value) })}
                className="h-1.5 w-full accent-accent disabled:opacity-40"
              />
            </label>
            <button
              type="button"
              aria-label="Inzoomen"
              disabled={!resolved || scale >= IMAGE_SCALE_MAX}
              onClick={() => patch({ scale: scale + 0.1 })}
              className="type-ui flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ink/15 text-sm text-ink disabled:opacity-30"
            >
              +
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={!resolved}
              onClick={() => patch({ x: 50, y: 50 })}
              className="type-label rounded-full border border-ink/15 px-3 py-1.5 text-[0.6rem] tracking-[0.1em] text-ink/60 uppercase transition-colors hover:border-ink/30 hover:text-ink disabled:opacity-30"
            >
              Centreer
            </button>
            <button
              type="button"
              disabled={!resolved}
              onClick={() =>
                onChange({
                  x: 50,
                  y: 28,
                  scale: IMAGE_SCALE_DEFAULT,
                })
              }
              className="type-label rounded-full border border-ink/15 px-3 py-1.5 text-[0.6rem] tracking-[0.1em] text-ink/60 uppercase transition-colors hover:border-ink/30 hover:text-ink disabled:opacity-30"
            >
              Reset
            </button>
            <span className="type-label ml-auto text-[0.55rem] tracking-[0.08em] text-ink/30 uppercase tabular-nums">
              {formatFocus(x, y)} · {Math.round(scale * 100)}%
            </span>
          </div>
        </div>
      </div>
    </Field>
  )
}

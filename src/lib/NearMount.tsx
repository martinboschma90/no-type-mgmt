import { useEffect, useRef, useState, type ReactNode } from 'react'

export function useNearViewport(rootMargin = '280px') {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node || shown) return
    if (!window.IntersectionObserver) {
      setShown(true)
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        setShown(true)
        observer.disconnect()
      },
      { rootMargin, threshold: 0.01 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [rootMargin, shown])

  return { ref, shown }
}

export function NearMount({
  children,
  rootMargin,
  minHeight,
}: {
  children: ReactNode
  rootMargin?: string
  minHeight?: number
}) {
  const { ref, shown } = useNearViewport(rootMargin)
  return (
    <div
      ref={ref}
      style={!shown && minHeight ? { minHeight } : undefined}
    >
      {shown ? children : null}
    </div>
  )
}

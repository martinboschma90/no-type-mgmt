import { useEffect, useState } from 'react'
import { useTheme } from '@/theme/ThemeProvider'

type LogoVariant = 'wordmark' | 'wordmark-ink' | 'seal' | 'stacked' | 'auto'

type LogoProps = {
  /** `auto` picks ink wordmark in light mode, yellow in dark mode */
  variant?: LogoVariant
  className?: string
  height?: number
  title?: string
}

const ASSETS = {
  wordmark: {
    svg: '/brand/notype-wordmark.svg',
    webp: '/brand/notype-wordmark.webp',
    png: '/brand/notype-wordmark.png',
    ratio: 2.14,
  },
  'wordmark-ink': {
    svg: '/brand/notype-wordmark-ink.svg',
    webp: '/brand/notype-wordmark-ink.webp',
    png: '/brand/notype-wordmark-ink.png',
    ratio: 2.14,
  },
  seal: {
    svg: '/brand/notype-seal.svg',
    webp: '/brand/notype-seal.webp',
    png: '/brand/notype-seal.png',
    ratio: 1,
  },
  stacked: {
    svg: '/brand/notype-stacked.svg',
    webp: '/brand/notype-stacked.webp',
    png: '/brand/notype-stacked.png',
    ratio: 0.68,
  },
} as const

type FallbackKind = 'svg' | 'webp' | 'png'

/** Official No Type logo — preserves source proportions, no distortion. */
export function Logo({
  variant = 'auto',
  className = '',
  height,
  title = 'No Type',
}: LogoProps) {
  const { theme } = useTheme()
  const resolved =
    variant === 'auto'
      ? theme === 'dark'
        ? 'wordmark'
        : 'wordmark-ink'
      : variant
  const asset = ASSETS[resolved]
  const [fallback, setFallback] = useState<FallbackKind>('svg')
  const width = height != null ? Math.round(height * asset.ratio) : undefined
  const src =
    fallback === 'svg' ? asset.svg : fallback === 'webp' ? asset.webp : asset.png

  useEffect(() => {
    setFallback('svg')
  }, [resolved])

  return (
    <img
      src={src}
      alt={title}
      width={width}
      height={height}
      className={`block max-w-full object-contain ${height == null ? 'h-auto w-auto' : ''} ${className}`}
      style={
        height != null
          ? { height, width, objectFit: 'contain' }
          : { objectFit: 'contain' }
      }
      draggable={false}
      decoding="async"
      onError={() =>
        setFallback((current) =>
          current === 'svg' ? 'webp' : current === 'webp' ? 'png' : 'png',
        )
      }
    />
  )
}

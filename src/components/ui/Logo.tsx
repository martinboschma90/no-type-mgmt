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
    png: '/brand/notype-wordmark.png',
    ratio: 2.14,
  },
  'wordmark-ink': {
    svg: '/brand/notype-wordmark-ink.svg',
    png: '/brand/notype-wordmark-ink.png',
    ratio: 2.14,
  },
  seal: {
    svg: '/brand/notype-seal.svg',
    png: '/brand/notype-seal.png',
    ratio: 1,
  },
  stacked: {
    svg: '/brand/notype-stacked.svg',
    png: '/brand/notype-stacked.png',
    ratio: 0.68,
  },
} as const

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
  const [usePng, setUsePng] = useState(false)
  const width = height != null ? Math.round(height * asset.ratio) : undefined

  useEffect(() => {
    setUsePng(false)
  }, [resolved])

  return (
    <img
      src={usePng ? asset.png : asset.svg}
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
      onError={() => setUsePng(true)}
    />
  )
}

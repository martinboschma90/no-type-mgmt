import { type CSSProperties } from 'react'
import { useResolvedMediaUrl } from '@/cms/media/useResolvedMediaUrl'
import { OptimizedImg } from '@/components/ui/OptimizedImg'
import type { ImageDeliverySize } from '@/cms/media/optimizeImageUrl'

type ResolvedImgProps = {
  src: string
  alt: string
  className?: string
  style?: CSSProperties
  loading?: 'lazy' | 'eager'
  fetchPriority?: 'high' | 'low' | 'auto'
  size?: ImageDeliverySize
  sizes?: string
  srcSetSizes?: ImageDeliverySize[]
}

/** Image that resolves `media://` CMS refs to live object URLs. */
export function ResolvedImg({
  src,
  alt,
  className,
  style,
  loading = 'lazy',
  fetchPriority,
  size = 'team',
  sizes,
  srcSetSizes,
}: ResolvedImgProps) {
  const url = useResolvedMediaUrl(src)
  if (!url) {
    return <div className={className} style={style} aria-hidden />
  }
  return (
    <OptimizedImg
      src={url}
      alt={alt}
      className={className}
      style={style}
      loading={loading}
      fetchPriority={fetchPriority}
      size={size}
      sizes={sizes}
      srcSetSizes={srcSetSizes}
      decoding="async"
    />
  )
}

type ResolvedVideoProps = {
  src: string
  className?: string
  controls?: boolean
  autoPlay?: boolean
  muted?: boolean
  loop?: boolean
}

export function ResolvedVideo({
  src,
  className,
  controls = true,
  autoPlay,
  muted = true,
  loop,
}: ResolvedVideoProps) {
  const url = useResolvedMediaUrl(src)
  if (!url) return null
  return (
    <video
      src={url}
      className={className}
      controls={controls}
      autoPlay={autoPlay}
      muted={muted}
      loop={loop}
      playsInline
      preload="metadata"
    />
  )
}

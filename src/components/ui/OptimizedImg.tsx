import { useState, type CSSProperties, type ImgHTMLAttributes } from 'react'
import {
  imageDeliveryDimensions,
  optimizeImageUrl,
  optimizedImageSrcSet,
  originalStorageUrl,
  type ImageDeliverySize,
} from '@/cms/media/optimizeImageUrl'

type OptimizedImgProps = Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  'src' | 'srcSet' | 'loading' | 'fetchPriority'
> & {
  src: string
  size?: ImageDeliverySize
  /** Extra widths for srcSet (in addition to `size`). */
  srcSetSizes?: ImageDeliverySize[]
  sizes?: string
  loading?: 'lazy' | 'eager'
  fetchPriority?: 'high' | 'low' | 'auto'
  style?: CSSProperties
}

/**
 * Drop-in `<img>` that serves resized/WebP URLs when the source supports it.
 * Falls back to the original URL if a transform request fails.
 * Layout/crop stay controlled by className + style (e.g. portraitImageStyle).
 */
export function OptimizedImg({
  src,
  size = 'card',
  srcSetSizes,
  sizes,
  alt,
  loading = 'lazy',
  fetchPriority,
  decoding = 'async',
  width,
  height,
  onError,
  ...rest
}: OptimizedImgProps) {
  const optimized = optimizeImageUrl(src, size)
  const fallback = originalStorageUrl(src)
  const [failed, setFailed] = useState(false)
  const deliverySrc = failed ? fallback : optimized
  const srcSet =
    !failed && srcSetSizes?.length
      ? optimizedImageSrcSet(src, srcSetSizes)
      : undefined
  const intrinsic = imageDeliveryDimensions(size)

  return (
    <img
      {...rest}
      src={deliverySrc}
      srcSet={srcSet}
      sizes={srcSet ? sizes : undefined}
      alt={alt}
      width={width ?? intrinsic.width}
      height={height ?? intrinsic.height}
      loading={loading}
      decoding={decoding}
      fetchPriority={fetchPriority}
      onError={(e) => {
        if (!failed && deliverySrc !== fallback) {
          setFailed(true)
          return
        }
        onError?.(e)
      }}
    />
  )
}

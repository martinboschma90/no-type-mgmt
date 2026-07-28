import { useResolvedMediaUrl } from '@/cms/media/useResolvedMediaUrl'

type ResolvedImgProps = {
  src: string
  alt: string
  className?: string
  loading?: 'lazy' | 'eager'
}

/** Image that resolves `media://` CMS refs to live object URLs. */
export function ResolvedImg({ src, alt, className, loading }: ResolvedImgProps) {
  const url = useResolvedMediaUrl(src)
  if (!url) {
    return <div className={className} aria-hidden />
  }
  return <img src={url} alt={alt} className={className} loading={loading} />
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
    />
  )
}

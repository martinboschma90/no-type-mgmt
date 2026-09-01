/**
 * Delivery-only image URL optimization.
 * Geometry / crop stay client-side (CSS object-fit + object-position).
 * Server transforms must not re-crop the source frame.
 */

export type ImageDeliverySize =
  | 'thumb'
  | 'card'
  | 'team'
  | 'hero'
  | 'poster'
  | 'full'

const WIDTH: Record<ImageDeliverySize, number> = {
  thumb: 96,
  card: 560,
  team: 400,
  hero: 1100,
  poster: 640,
  full: 1440,
}

const QUALITY: Record<ImageDeliverySize, number> = {
  thumb: 76,
  card: 80,
  team: 80,
  hero: 84,
  poster: 78,
  full: 84,
}

const OBJECT_PUBLIC =
  /^(https?:\/\/[^/?#]+)\/storage\/v1\/object\/public\/(.+?)(?:\?.*)?$/i
const RENDER_PUBLIC =
  /^(https?:\/\/[^/?#]+)\/storage\/v1\/render\/image\/public\/(.+?)(?:\?.*)?$/i

function isPassthrough(url: string): boolean {
  return (
    !url ||
    url.startsWith('blob:') ||
    url.startsWith('data:') ||
    url.startsWith('media://') ||
    url.startsWith('/')
  )
}

/** Strip Supabase render params back to the raw object URL (fallback). */
export function originalStorageUrl(url: string): string {
  const render = url.match(RENDER_PUBLIC)
  if (!render) return url
  return `${render[1]}/storage/v1/object/public/${render[2]}`
}

function supabaseRenderUrl(
  origin: string,
  path: string,
  size: ImageDeliverySize,
): string {
  const width = WIDTH[size]
  const quality = QUALITY[size]
  // `resize=contain` scales the full frame — no server-side crop.
  // CSS object-fit/object-position remain the only framing controls.
  // WebP keeps bytes down without changing framing.
  return `${origin}/storage/v1/render/image/public/${path}?width=${width}&quality=${quality}&resize=contain&format=webp`
}

/** Intrinsic pixel size for CLS hints (3:4 portrait delivery). */
export function imageDeliveryDimensions(size: ImageDeliverySize): {
  width: number
  height: number
} {
  const width = WIDTH[size]
  return { width, height: Math.round((width * 4) / 3) }
}

/**
 * Optimize delivery without changing crop/framing.
 * - Supabase Storage → `/render/image` with contain + WebP
 * - Unsplash → WebP only (keeps original w/h crop params)
 */
export function optimizeImageUrl(
  url: string,
  size: ImageDeliverySize = 'card',
): string {
  if (isPassthrough(url)) return url

  const object = url.match(OBJECT_PUBLIC)
  if (object) {
    return supabaseRenderUrl(object[1], object[2], size)
  }

  const render = url.match(RENDER_PUBLIC)
  if (render) {
    return supabaseRenderUrl(render[1], render[2], size)
  }

  if (/images\.unsplash\.com/i.test(url)) {
    try {
      const u = new URL(url)
      // Keep original w/h/fit/crop — only switch format for faster delivery.
      u.searchParams.set('auto', 'format')
      u.searchParams.set('fm', 'webp')
      return u.toString()
    } catch {
      return url
    }
  }

  return url
}

/** Responsive srcset for roster / hero slots (same frame, multiple widths). */
export function optimizedImageSrcSet(
  url: string,
  sizes: ImageDeliverySize[],
): string | undefined {
  if (isPassthrough(url)) return undefined
  // Unsplash srcSet with different widths would change fit=crop framing — skip.
  if (/images\.unsplash\.com/i.test(url)) return undefined
  const parts = sizes.map(
    (size) => `${optimizeImageUrl(url, size)} ${WIDTH[size]}w`,
  )
  return parts.length ? parts.join(', ') : undefined
}

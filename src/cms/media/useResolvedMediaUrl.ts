import { useMedia } from '@/cms/media/MediaProvider'
import { parseMediaRef } from '@/cms/media/refs'

/** Resolve `media://id` refs to live object URLs; pass through http(s)/blob otherwise. */
export function useResolvedMediaUrl(value: string | undefined | null): string {
  const { getAssetUrl } = useMedia()
  if (!value) return ''
  const id = parseMediaRef(value)
  if (id) return getAssetUrl(id) ?? ''
  return value
}

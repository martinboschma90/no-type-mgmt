import { getRosterImageUrl } from '@/data/artists'
import { parseMediaRef } from '@/cms/media/refs'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'

/** Seed / catalog http(s) portrait for a slug — used when `media://` cannot resolve. */
export function getSeedImageUrl(slug: string): string | undefined {
  return getRosterImageUrl(slug)
}

export function isHttpUrl(value: string | undefined | null): boolean {
  return Boolean(value && /^https?:\/\//i.test(value.trim()))
}

/** True when value is a CMS media library ref (needs IndexedDB or Storage). */
export function isMediaLibraryRef(value: string | undefined | null): boolean {
  return Boolean(parseMediaRef(value))
}

/**
 * Resolve a media:// id via Supabase Storage public URL when metadata exists.
 * Returns null when not configured / missing (common for IndexedDB-only uploads).
 */
export async function resolveMediaFromSupabase(
  mediaId: string,
): Promise<string | null> {
  if (!isSupabaseConfigured || !supabase || !mediaId) return null

  const { data, error } = await supabase
    .from('media_assets')
    .select('storage_path')
    .eq('id', mediaId)
    .maybeSingle()

  if (error || !data?.storage_path) return null

  const { data: pub } = supabase.storage
    .from('media')
    .getPublicUrl(data.storage_path)

  return pub.publicUrl || null
}

/** Upload a local library blob to the public `media` bucket + media_assets row. */
export async function publishMediaAssetToSupabase(input: {
  id: string
  name: string
  kind: 'image' | 'video'
  mimeType: string
  size: number
  width?: number
  height?: number
  duration?: number
  blob: Blob
}): Promise<string | null> {
  if (!isSupabaseConfigured || !supabase) return null

  const storagePath = `library/${input.id}/${input.name}`

  const { error: uploadError } = await supabase.storage
    .from('media')
    .upload(storagePath, input.blob, {
      upsert: true,
      contentType: input.mimeType,
      cacheControl: '31536000',
    })

  if (uploadError) {
    console.warn('[media] storage upload:', uploadError.message)
    return null
  }

  const { error: rowError } = await supabase.from('media_assets').upsert(
    {
      id: input.id,
      name: input.name,
      kind: input.kind,
      mime_type: input.mimeType,
      storage_path: storagePath,
      size: input.size,
      width: input.width ?? null,
      height: input.height ?? null,
      duration: input.duration ?? null,
    },
    { onConflict: 'id' },
  )

  if (rowError) {
    console.warn('[media] media_assets upsert:', rowError.message)
  }

  const { data: pub } = supabase.storage.from('media').getPublicUrl(storagePath)
  return pub.publicUrl || null
}

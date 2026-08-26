import { isSupabaseConfigured, supabase } from '@/lib/supabase'

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

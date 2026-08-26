import { isMediaLibraryRef } from '@/cms/media/refs'
import type { Artist } from '@/types/artist'

/** Shown in CMS when publish is blocked due to local-only media refs. */
export const LOCAL_MEDIA_PUBLISH_WARNING =
  'Media must be uploaded to Supabase Storage before publishing.'

/** Collect every `media://` field that is not yet a permanent HTTPS URL. */
export function listLocalMediaFields(artist: Artist): string[] {
  const fields: string[] = []

  if (isMediaLibraryRef(artist.imageUrl)) {
    fields.push('portrait image')
  }
  if (isMediaLibraryRef(artist.videoUrl)) {
    fields.push('legacy video')
  }

  ;(artist.videos ?? []).forEach((video, index) => {
    const n = index + 1
    if (isMediaLibraryRef(video.videoUrl)) {
      fields.push(`visual ${n} video`)
    }
    if (isMediaLibraryRef(video.posterUrl)) {
      fields.push(`visual ${n} poster`)
    }
  })

  return fields
}

/** True when any image/video URL is still a browser-local `media://` ref. */
export function artistHasLocalMediaRefs(artist: Artist): boolean {
  return listLocalMediaFields(artist).length > 0
}

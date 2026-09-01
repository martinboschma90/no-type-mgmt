import type { CmsContent } from '@/cms/content'
import type { Artist } from '@/types/artist'
import { isMediaLibraryRef } from '@/cms/media/publicMedia'
import { publishMediaAssetToSupabase } from '@/cms/media/publishMedia'
import { resolveMediaFromSupabase } from '@/cms/media/publicMedia'
import { parseMediaRef } from '@/cms/media/refs'
import { idbGetAsset } from '@/cms/media/idb'
import type { MediaAsset } from '@/cms/media/types'

export type LocalMediaRefHit = {
  artistSlug: string
  artistName: string
  field: string
  mediaId: string
  ref: string
}

export type MigrateLocalMediaFailure = {
  mediaId: string
  reason: string
  fields: string[]
}

export type MigrateLocalMediaResult = {
  /** Unique media IDs successfully mapped to HTTPS Storage URLs */
  migrated: number
  failed: MigrateLocalMediaFailure[]
  /** Remaining unique media:// IDs in CMS content after rewrite */
  remaining: number
  urlById: Record<string, string>
  artistsUpdated: string[]
}

/** Scan artists for local-only `media://` references. */
export function scanLocalMediaRefs(artists: Artist[]): LocalMediaRefHit[] {
  const hits: LocalMediaRefHit[] = []

  for (const artist of artists) {
    const push = (field: string, value: string | undefined) => {
      if (!isMediaLibraryRef(value)) return
      const mediaId = parseMediaRef(value)
      if (!mediaId || !value) return
      hits.push({
        artistSlug: artist.slug,
        artistName: artist.name,
        field,
        mediaId,
        ref: value,
      })
    }

    push('image_url', artist.imageUrl)
    push('video_url', artist.videoUrl)
    ;(artist.videos ?? []).forEach((video, index) => {
      const n = index + 1
      push(`videos[${n}].videoUrl`, video.videoUrl)
      push(`videos[${n}].clipUrl`, video.clipUrl)
      // Accept legacy `url` key if ever present on loose JSON
      const legacyUrl = (video as { url?: string }).url
      push(`videos[${n}].url`, legacyUrl)
      push(`videos[${n}].posterUrl`, video.posterUrl)
    })
  }

  return hits
}

export function countLocalMediaRefs(artists: Artist[]): number {
  return collectMediaRefIds(artists).size
}

/** Unique media:// IDs anywhere in CMS JSON (artists, team, site, …). */
export function collectMediaRefIds(
  value: unknown,
  ids: Set<string> = new Set(),
): Set<string> {
  if (typeof value === 'string') {
    const id = parseMediaRef(value)
    if (id) ids.add(id)
    return ids
  }
  if (Array.isArray(value)) {
    for (const item of value) collectMediaRefIds(item, ids)
    return ids
  }
  if (value && typeof value === 'object') {
    for (const item of Object.values(value as Record<string, unknown>)) {
      collectMediaRefIds(item, ids)
    }
  }
  return ids
}

export function countUnsyncedMediaUrls(content: CmsContent): number {
  return collectMediaRefIds(content).size
}

export function rewriteMediaRefStrings<T>(
  value: T,
  urlById: Record<string, string>,
): T {
  if (typeof value === 'string') {
    const id = parseMediaRef(value)
    if (id && urlById[id]) return urlById[id] as T
    return value
  }
  if (Array.isArray(value)) {
    return value.map((item) => rewriteMediaRefStrings(item, urlById)) as T
  }
  if (value && typeof value === 'object') {
    const next: Record<string, unknown> = {}
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      next[key] = rewriteMediaRefStrings(item, urlById)
    }
    return next as T
  }
  return value
}

function rewriteValue(
  value: string | undefined,
  urlById: Record<string, string>,
): string | undefined {
  if (!value) return value
  const id = parseMediaRef(value)
  if (!id) return value
  return urlById[id] ?? value
}

/** Apply a mediaId → HTTPS map onto one artist. */
export function applyMediaUrlMap(
  artist: Artist,
  urlById: Record<string, string>,
): Artist {
  const imageUrl = rewriteValue(artist.imageUrl, urlById) || artist.imageUrl
  const videoUrl = rewriteValue(artist.videoUrl, urlById)
  const videos = (artist.videos ?? []).map((video) => {
    const legacy = video as { url?: string }
    const fromLegacy = rewriteValue(legacy.url, urlById)
    const videoUrlNext =
      rewriteValue(video.videoUrl, urlById) ||
      fromLegacy ||
      video.videoUrl
    return {
      ...video,
      videoUrl: videoUrlNext,
      clipUrl: rewriteValue(video.clipUrl, urlById),
      posterUrl: rewriteValue(video.posterUrl, urlById),
    }
  })

  return {
    ...artist,
    imageUrl,
    videoUrl,
    videos: videos.length ? videos : artist.videos,
  }
}

async function resolveOrUploadMediaId(
  mediaId: string,
  localAssets: MediaAsset[],
): Promise<{ url: string | null; error?: string }> {
  // 1. Already in Supabase Storage?
  const existing = await resolveMediaFromSupabase(mediaId)
  if (existing) return { url: existing }

  // 2. In-memory library (IndexedDB hydrated)
  let asset = localAssets.find((a) => a.id === mediaId)

  // 3. Direct IndexedDB read (in case provider list is stale)
  if (!asset) {
    const row = await idbGetAsset(mediaId)
    if (row) {
      asset = {
        ...row,
        url: '',
      }
    }
  }

  if (!asset?.blob) {
    return {
      url: null,
      error: 'File not found in this browser library (IndexedDB)',
    }
  }

  const publicUrl = await publishMediaAssetToSupabase({
    id: asset.id,
    name: asset.name || `${mediaId}.bin`,
    kind: asset.kind,
    mimeType: asset.mimeType || asset.blob.type || 'application/octet-stream',
    size: asset.size || asset.blob.size,
    width: asset.width,
    height: asset.height,
    duration: asset.duration,
    blob: asset.blob,
  })

  if (!publicUrl) {
    return {
      url: null,
      error: 'Supabase Storage upload failed (check auth / RLS)',
    }
  }

  return { url: publicUrl }
}

/**
 * Migrate all `media://` refs on artists → permanent Supabase Storage HTTPS URLs
 * when the underlying file can be resolved locally or is already in Storage.
 */
export async function migrateLocalMediaRefs(options: {
  content: CmsContent
  localAssets: MediaAsset[]
}): Promise<{ content: CmsContent; result: MigrateLocalMediaResult }> {
  const artistHits = scanLocalMediaRefs(options.content.artists)
  const hitsById = new Map<string, LocalMediaRefHit[]>()
  for (const hit of artistHits) {
    const list = hitsById.get(hit.mediaId) ?? []
    list.push(hit)
    hitsById.set(hit.mediaId, list)
  }

  const urlById: Record<string, string> = {}
  const failed: MigrateLocalMediaFailure[] = []

  for (const mediaId of collectMediaRefIds(options.content)) {
    const { url, error } = await resolveOrUploadMediaId(
      mediaId,
      options.localAssets,
    )
    if (url) {
      urlById[mediaId] = url
    } else {
      const idHits = hitsById.get(mediaId) ?? []
      failed.push({
        mediaId,
        reason: error ?? 'Unknown error',
        fields:
          idHits.length > 0
            ? idHits.map((h) => `${h.artistSlug}:${h.field}`)
            : [mediaId],
      })
    }
  }

  const nextContent = rewriteMediaRefStrings(options.content, urlById)
  const artistsUpdated: string[] = []
  for (let i = 0; i < options.content.artists.length; i += 1) {
    const before = options.content.artists[i]
    const after = nextContent.artists[i]
    if (!before || !after) continue
    if (
      before.imageUrl !== after.imageUrl ||
      before.videoUrl !== after.videoUrl ||
      JSON.stringify(before.videos) !== JSON.stringify(after.videos)
    ) {
      artistsUpdated.push(after.slug)
    }
  }

  return {
    content: nextContent,
    result: {
      migrated: Object.keys(urlById).length,
      failed,
      remaining: countUnsyncedMediaUrls(nextContent),
      urlById,
      artistsUpdated,
    },
  }
}

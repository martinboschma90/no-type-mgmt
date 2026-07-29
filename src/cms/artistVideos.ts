import type { Artist, ArtistVideo } from '@/types/artist'

export const MAX_ARTIST_VIDEOS = 5

export function createBlankArtistVideo(
  partial?: Partial<ArtistVideo>,
): ArtistVideo {
  return {
    id: crypto.randomUUID(),
    videoUrl: '',
    posterUrl: '',
    title: '',
    ...partial,
  }
}

/** Prefer `videos[]`; fall back to legacy `videoUrl` so existing artists keep working. */
export function normalizeArtistVideos(
  artist: Pick<Artist, 'videos' | 'videoUrl' | 'imageUrl'>,
): ArtistVideo[] {
  const fromCollection = (artist.videos ?? [])
    .filter((v) => Boolean(v?.videoUrl?.trim()))
    .slice(0, MAX_ARTIST_VIDEOS)
    .map((v) => ({
      id: v.id || crypto.randomUUID(),
      videoUrl: v.videoUrl.trim(),
      posterUrl: v.posterUrl?.trim() || undefined,
      title: v.title?.trim() || undefined,
    }))

  if (fromCollection.length > 0) return fromCollection

  const legacy = artist.videoUrl?.trim()
  if (!legacy) return []

  return [
    {
      id: 'legacy-video',
      videoUrl: legacy,
      posterUrl: artist.imageUrl?.trim() || undefined,
    },
  ]
}

export function artistHasVideos(
  artist: Pick<Artist, 'videos' | 'videoUrl'>,
): boolean {
  if ((artist.videos ?? []).some((v) => Boolean(v?.videoUrl?.trim()))) {
    return true
  }
  return Boolean(artist.videoUrl?.trim())
}

/** Keep legacy `videoUrl` aligned with the first reel for older readers. */
export function syncLegacyVideoUrl(videos: ArtistVideo[] | undefined): string | undefined {
  const first = (videos ?? []).find((v) => v.videoUrl?.trim())
  return first?.videoUrl.trim() || undefined
}

export function reorderArtistVideos(
  videos: ArtistVideo[],
  fromIndex: number,
  toIndex: number,
): ArtistVideo[] {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= videos.length ||
    toIndex >= videos.length
  ) {
    return videos
  }
  const next = [...videos]
  const [item] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, item)
  return next
}

export function parseVideosColumn(value: unknown): ArtistVideo[] {
  if (!Array.isArray(value)) return []
  const out: ArtistVideo[] = []
  for (let index = 0; index < value.length; index++) {
    const raw = value[index]
    if (!raw || typeof raw !== 'object') continue
    const row = raw as Record<string, unknown>
    const videoUrl =
      typeof row.videoUrl === 'string'
        ? row.videoUrl
        : typeof row.video_url === 'string'
          ? row.video_url
          : ''
    if (!videoUrl.trim()) continue
    const posterRaw =
      typeof row.posterUrl === 'string'
        ? row.posterUrl
        : typeof row.poster_url === 'string'
          ? row.poster_url
          : ''
    const titleRaw = typeof row.title === 'string' ? row.title : ''
    const id =
      typeof row.id === 'string' && row.id ? row.id : `video-${index}`
    out.push({
      id,
      videoUrl: videoUrl.trim(),
      ...(posterRaw.trim() ? { posterUrl: posterRaw.trim() } : {}),
      ...(titleRaw.trim() ? { title: titleRaw.trim() } : {}),
    })
    if (out.length >= MAX_ARTIST_VIDEOS) break
  }
  return out
}

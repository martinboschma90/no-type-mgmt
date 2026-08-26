import type { ArtistInstagramFeed, ArtistMusic, MusicPlatform, Track } from '@/types/artist'
import { parseInstagramFeed } from '@/cms/artistInstagram'

export const MUSIC_PLATFORMS: {
  id: MusicPlatform
  label: string
  hint: string
}[] = [
  {
    id: 'soundcloud',
    label: 'SoundCloud',
    hint: 'Paste a track/set URL or widget embed URL.',
  },
  {
    id: 'spotify',
    label: 'Spotify',
    hint: 'Paste a Spotify track, album, or playlist URL.',
  },
  {
    id: 'custom',
    label: 'Custom',
    hint: 'Paste a full iframe src / embed URL.',
  },
]

export const DEFAULT_ARTIST_MUSIC: ArtistMusic = {
  platform: 'soundcloud',
  embedUrl: '',
  title: 'Latest Mix',
  visible: false,
}

function asTrackArray(value: unknown): Track[] {
  return Array.isArray(value) ? (value as Track[]) : []
}

function parseMusic(value: unknown): ArtistMusic | undefined {
  if (!value || typeof value !== 'object') return undefined
  const raw = value as Record<string, unknown>
  const platform = raw.platform
  if (
    platform !== 'soundcloud' &&
    platform !== 'spotify' &&
    platform !== 'custom'
  ) {
    return undefined
  }

  const embedUrl =
    typeof raw.embedUrl === 'string'
      ? raw.embedUrl
      : typeof raw.embed_url === 'string'
        ? raw.embed_url
        : ''

  return {
    platform,
    embedUrl,
    title: typeof raw.title === 'string' ? raw.title : DEFAULT_ARTIST_MUSIC.title,
    visible: raw.visible !== false,
  }
}

/**
 * Migration-safe read of the `artists.tracks` jsonb column.
 * Legacy: Track[]
 * New: { tracks: Track[], music?: ArtistMusic, instagramFeed?: ArtistInstagramFeed }
 */
export function parseTracksColumn(value: unknown): {
  tracks: Track[]
  music?: ArtistMusic
  instagramFeed?: ArtistInstagramFeed
} {
  if (Array.isArray(value)) {
    return { tracks: asTrackArray(value) }
  }

  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>
    return {
      tracks: asTrackArray(obj.tracks ?? obj.items),
      music: parseMusic(obj.music),
      instagramFeed: parseInstagramFeed(obj.instagramFeed ?? obj.instagram_feed),
    }
  }

  return { tracks: [] }
}

function hasInstagramFeedPayload(feed: ArtistInstagramFeed | undefined) {
  if (!feed) return false
  return Boolean(
    feed.profileUrl.trim() || feed.posts.some((post) => post.trim()),
  )
}

/**
 * Write `tracks` jsonb. Keeps a plain Track[] when no extra config
 * so legacy rows stay compatible until music / Instagram feed is set.
 */
export function serializeTracksColumn(
  tracks: Track[] | undefined,
  music: ArtistMusic | undefined,
  instagramFeed?: ArtistInstagramFeed,
):
  | Track[]
  | {
      tracks: Track[]
      music?: ArtistMusic
      instagramFeed?: ArtistInstagramFeed
    } {
  const list = tracks ?? []
  const feed = hasInstagramFeedPayload(instagramFeed) ? instagramFeed : undefined
  if (!music && !feed) return list
  return {
    tracks: list,
    ...(music ? { music } : {}),
    ...(feed ? { instagramFeed: feed } : {}),
  }
}

/** Build an iframe-ready embed src from platform + URL. */
export function resolveMusicEmbedSrc(music: ArtistMusic): string | null {
  const raw = music.embedUrl.trim()
  if (!raw) return null

  if (music.platform === 'custom') {
    return raw
  }

  if (music.platform === 'spotify') {
    if (raw.includes('/embed/')) return raw
    try {
      const url = new URL(raw)
      if (url.hostname.includes('spotify.com')) {
        // /track/x → /embed/track/x
        if (!url.pathname.startsWith('/embed/')) {
          url.pathname = `/embed${url.pathname}`
        }
        return url.toString()
      }
    } catch {
      /* fall through */
    }
    return raw.replace('open.spotify.com/', 'open.spotify.com/embed/')
  }

  // SoundCloud
  if (raw.includes('w.soundcloud.com/player')) return raw
  return `https://w.soundcloud.com/player/?url=${encodeURIComponent(raw)}&color=%23D8FF3E&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false`
}

export function isMusicEmbedActive(music: ArtistMusic | undefined): boolean {
  if (!music || music.visible === false) return false
  return Boolean(resolveMusicEmbedSrc(music))
}

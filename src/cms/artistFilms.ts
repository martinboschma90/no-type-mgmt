import type { Artist, ArtistFilm } from '@/types/artist'

export const MAX_ARTIST_FILMS = 3

export function createBlankArtistFilm(
  partial?: Partial<ArtistFilm>,
): ArtistFilm {
  return {
    id: crypto.randomUUID(),
    videoUrl: '',
    posterUrl: '',
    title: '',
    label: '',
    ...partial,
  }
}

export function normalizeArtistFilms(
  artist: Pick<Artist, 'films'>,
): ArtistFilm[] {
  return (artist.films ?? [])
    .filter((f) => Boolean(f?.videoUrl?.trim()))
    .slice(0, MAX_ARTIST_FILMS)
    .map((f) => ({
      id: f.id || crypto.randomUUID(),
      videoUrl: f.videoUrl.trim(),
      posterUrl: f.posterUrl?.trim() || undefined,
      title: f.title?.trim() || undefined,
      label: f.label?.trim() || undefined,
    }))
}

export function artistHasFilms(artist: Pick<Artist, 'films'>): boolean {
  return (artist.films ?? []).some((f) => Boolean(f?.videoUrl?.trim()))
}

export function parseFilmsColumn(value: unknown): ArtistFilm[] {
  if (!Array.isArray(value)) return []
  const out: ArtistFilm[] = []
  for (let index = 0; index < value.length; index++) {
    const raw = value[index]
    if (!raw || typeof raw !== 'object') continue
    const row = raw as Record<string, unknown>
    if (row.kind !== 'film') continue
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
    const labelRaw = typeof row.label === 'string' ? row.label : ''
    const id =
      typeof row.id === 'string' && row.id ? row.id : `film-${index}`
    out.push({
      id,
      videoUrl: videoUrl.trim(),
      ...(posterRaw.trim() ? { posterUrl: posterRaw.trim() } : {}),
      ...(titleRaw.trim() ? { title: titleRaw.trim() } : {}),
      ...(labelRaw.trim() ? { label: labelRaw.trim() } : {}),
    })
    if (out.length >= MAX_ARTIST_FILMS) break
  }
  return out
}

export function youtubeVideoId(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname === 'youtu.be') {
      const id = u.pathname.replace(/^\//, '').split('/')[0]
      return id || null
    }
    if (u.hostname.includes('youtube.com')) {
      if (u.searchParams.get('v')) return u.searchParams.get('v')
      const parts = u.pathname.split('/').filter(Boolean)
      const shorts = parts[0] === 'shorts' || parts[0] === 'embed'
      if (shorts && parts[1]) return parts[1]
    }
  } catch {
    return null
  }
  return null
}

export function vimeoVideoId(url: string): string | null {
  try {
    const u = new URL(url)
    if (!u.hostname.includes('vimeo.com')) return null
    const id = u.pathname.split('/').filter(Boolean)[0]
    return id && /^\d+$/.test(id) ? id : null
  } catch {
    return null
  }
}

export function youtubePosterUrl(url: string): string | null {
  const id = youtubeVideoId(url)
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null
}

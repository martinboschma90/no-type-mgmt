import type { Artist, ArtistInstagramFeed, SocialLink } from '@/types/artist'

export const INSTAGRAM_FEED_COUNT = 6

export const DEFAULT_INSTAGRAM_FEED: ArtistInstagramFeed = {
  profileUrl: '',
  posts: Array.from({ length: INSTAGRAM_FEED_COUNT }, () => ''),
  visible: true,
}

const POST_PATH =
  /^\/(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/i

export type InstagramEmbed = {
  permalink: string
  embedSrc: string
  kind: 'post' | 'reel'
}

function asInstagramHost(hostname: string) {
  return (
    hostname === 'instagram.com' ||
    hostname === 'www.instagram.com' ||
    hostname === 'm.instagram.com'
  )
}

/** Extract a post/reel embed from a pasted Instagram permalink. */
export function parseInstagramPostUrl(raw: string): InstagramEmbed | null {
  const trimmed = raw.trim()
  if (!trimmed) return null

  try {
    const url = new URL(trimmed)
    if (!asInstagramHost(url.hostname)) return null
    const match = POST_PATH.exec(url.pathname)
    if (!match) return null
    const code = match[1]
    const kind = /\/reel/i.test(url.pathname) ? 'reel' : 'post'
    const path = kind === 'reel' ? 'reel' : 'p'
    const permalink = `https://www.instagram.com/${path}/${code}/`
    return {
      permalink,
      embedSrc: `${permalink}embed/`,
      kind,
    }
  } catch {
    return null
  }
}

/** Normalize a profile URL to `https://www.instagram.com/{handle}/`. */
export function parseInstagramProfileUrl(raw: string): string | null {
  const trimmed = raw.trim().replace(/^@/, '')
  if (!trimmed) return null

  try {
    const url = new URL(
      trimmed.startsWith('http') ? trimmed : `https://instagram.com/${trimmed}`,
    )
    if (!asInstagramHost(url.hostname)) return null
    const handle = url.pathname.split('/').filter(Boolean)[0]
    if (!handle || POST_PATH.test(`/${handle}`) || handle === 'p' || handle === 'reel' || handle === 'reels' || handle === 'tv' || handle === 'stories') {
      return null
    }
    if (!/^[A-Za-z0-9._]+$/.test(handle)) return null
    return `https://www.instagram.com/${handle}/`
  } catch {
    return null
  }
}

export function parseInstagramFeed(value: unknown): ArtistInstagramFeed | undefined {
  if (!value || typeof value !== 'object') return undefined
  const raw = value as Record<string, unknown>
  const postsSource = Array.isArray(raw.posts)
    ? raw.posts
    : typeof raw.posts === 'string'
      ? raw.posts.split(/\n+/)
      : []

  const posts = postsSource
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .slice(0, INSTAGRAM_FEED_COUNT)

  while (posts.length < INSTAGRAM_FEED_COUNT) posts.push('')

  return {
    profileUrl:
      typeof raw.profileUrl === 'string'
        ? raw.profileUrl
        : typeof raw.profile_url === 'string'
          ? raw.profile_url
          : '',
    posts,
    visible: raw.visible !== false,
  }
}

export function padInstagramPosts(posts: string[] | undefined): string[] {
  const next = (posts ?? []).slice(0, INSTAGRAM_FEED_COUNT)
  while (next.length < INSTAGRAM_FEED_COUNT) next.push('')
  return next
}

export function instagramPostsFromArtist(
  feed: ArtistInstagramFeed | undefined,
): InstagramEmbed[] {
  if (!feed) return []
  const seen = new Set<string>()
  const embeds: InstagramEmbed[] = []
  for (const raw of feed.posts) {
    const parsed = parseInstagramPostUrl(raw)
    if (!parsed || seen.has(parsed.permalink)) continue
    seen.add(parsed.permalink)
    embeds.push(parsed)
    if (embeds.length >= INSTAGRAM_FEED_COUNT) break
  }
  return embeds
}

export function resolveInstagramProfileUrl(
  artist: Pick<Artist, 'instagramFeed' | 'socials'>,
): string | null {
  const fromFeed = parseInstagramProfileUrl(artist.instagramFeed?.profileUrl ?? '')
  if (fromFeed) return fromFeed
  const social = (artist.socials ?? []).find(
    (link: SocialLink) => link.platform === 'instagram' && link.url.trim(),
  )
  return social ? parseInstagramProfileUrl(social.url) : null
}

export function isInstagramFeedActive(
  artist: Pick<Artist, 'instagramFeed' | 'socials' | 'sections'>,
): boolean {
  if (artist.instagramFeed?.visible === false) return false
  return instagramPostsFromArtist(artist.instagramFeed).length > 0
}

/** Keep Instagram social URL in sync when the feed profile is set. */
export function withSyncedInstagramSocial(
  socials: SocialLink[] | undefined,
  profileUrl: string,
): SocialLink[] {
  const normalized = parseInstagramProfileUrl(profileUrl)
  const list = [...(socials ?? [])]
  const index = list.findIndex((s) => s.platform === 'instagram')
  if (!normalized) return list
  if (index === -1) {
    return [
      ...list,
      { platform: 'instagram', label: 'Instagram', url: normalized },
    ]
  }
  const current = list[index]
  if (current.url.trim() && parseInstagramProfileUrl(current.url) === normalized) {
    return list
  }
  list[index] = { ...current, url: normalized }
  return list
}

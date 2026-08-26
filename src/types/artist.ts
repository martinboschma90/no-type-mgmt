export type ViewMode = 'grid' | 'list'

export type SocialPlatform =
  | 'website'
  | 'instagram'
  | 'tiktok'
  | 'facebook'
  | 'soundcloud'
  | 'spotify'
  | 'youtube'

export type SocialLink = {
  platform: SocialPlatform
  url: string
  label: string
}

export type Track = {
  id: string
  title: string
  credit?: string
  duration: string
}

/** Per-artist music embed (stored inside tracks jsonb, migration-safe). */
export type MusicPlatform = 'soundcloud' | 'spotify' | 'custom'

export type ArtistMusic = {
  platform: MusicPlatform
  /** Track/playlist URL or ready-made embed src. */
  embedUrl: string
  title: string
  visible: boolean
}

export type ArtistSectionId = 'hero' | 'video' | 'instagram' | 'tracks'

/** Instagram profile + up to 6 post/reel permalinks for the artist-page carousel. */
export type ArtistInstagramFeed = {
  /** Profile URL (`instagram.com/handle`). Falls back to socials Instagram. */
  profileUrl: string
  /** Post or reel permalinks — empty slots are ignored on the public page. */
  posts: string[]
  visible: boolean
}

export type ArtistSectionConfig = {
  id: ArtistSectionId
  visible: boolean
}

/** Vertical reel clip (9:16) on the artist page carousel. */
export type ArtistVideo = {
  id: string
  /** Media ref (`media://…`) or absolute URL. */
  videoUrl: string
  /** Optional poster / thumbnail before playback. */
  posterUrl?: string
  title?: string
}

/** CMS publish workflow — public site only shows `published`. */
export type ArtistStatus = 'draft' | 'published'

export type Artist = {
  id: string
  name: string
  slug: string
  genre?: string
  imageUrl: string
  imageAlt: string
  /**
   * Legacy / serialized object-position (`50% 32%` or old preset id).
   * Prefer `imageFocusX` / `imageFocusY` for art direction.
   */
  imageFocus?: string
  /** object-position X percent (0–100) — per-artist art direction. */
  imageFocusX?: number
  /** object-position Y percent (0–100) — per-artist art direction. */
  imageFocusY?: number
  /** Zoom factor for portrait crop (1 = cover, >1 = tighter editorial crop). */
  imageScale?: number
  /** Bumps with campaign seed revisions — triggers re-apply of hand-tuned framing. */
  artDirectionVersion?: number
  /** Optional centered video slide (WebM via CMS media library). */
  videoUrl?: string
  /**
   * Vertical reels (9:16) — 1–5 videos.
   * Prefer this over legacy `videoUrl`. Empty → fall back to `videoUrl`.
   */
  videos?: ArtistVideo[]
  bio?: string
  socials?: SocialLink[]
  /** Legacy playlist rows — kept for compatibility. */
  tracks?: Track[]
  /**
   * Flexible music embed (SoundCloud / Spotify / custom).
   * Persisted inside the `tracks` jsonb column alongside the track list.
   */
  music?: ArtistMusic
  instagramFeed?: ArtistInstagramFeed
  presskitUrl?: string
  /** Page layout order + visibility — editable via CMS drag & drop. */
  sections?: ArtistSectionConfig[]
  /**
   * Publish status. Prefer this over `visible`.
   * Missing → inferred from `visible` for legacy content.
   */
  status?: ArtistStatus
  /** First (or last) publish time — ISO string. */
  publishedAt?: string
  /**
   * Legacy public visibility — kept in sync with `status` for RLS.
   * `undefined` / missing = treated as published when status is also missing.
   */
  visible?: boolean
}

export type TeamMember = {
  id: string
  name: string
  role: string
  imageUrl: string
}

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

export type ArtistSectionId = 'hero' | 'video' | 'tracks'

export type ArtistSectionConfig = {
  id: ArtistSectionId
  visible: boolean
}

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
  bio?: string
  socials?: SocialLink[]
  tracks?: Track[]
  presskitUrl?: string
  /** Page layout order + visibility — editable via CMS drag & drop. */
  sections?: ArtistSectionConfig[]
  /**
   * Public visibility on roster + artist page.
   * `undefined` / missing = visible (legacy). `false` = hidden from public site.
   */
  visible?: boolean
}

export type TeamMember = {
  id: string
  name: string
  role: string
  imageUrl: string
}

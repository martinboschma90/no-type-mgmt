import type { Artist, SocialLink } from '@/types/artist'
import { DEFAULT_ARTIST_SECTIONS } from '@/cms/artistSections'
import {
  ART_DIRECTION_VERSION,
  DEFAULT_ART_DIRECTION,
  formatFocus,
} from '@/cms/imageFocus'

export function slugifyArtistName(name: string) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function uniqueArtistSlug(base: string, existing: string[]) {
  const root = base || 'artist'
  if (!existing.includes(root)) return root
  let n = 2
  while (existing.includes(`${root}-${n}`)) n += 1
  return `${root}-${n}`
}

/** Full social set for new / incomplete artist profiles. */
export function defaultArtistSocials(slug: string): SocialLink[] {
  return [
    { platform: 'website', label: 'Website', url: '' },
    { platform: 'instagram', label: 'Instagram', url: `https://instagram.com/${slug}` },
    { platform: 'tiktok', label: 'TikTok', url: `https://tiktok.com/@${slug}` },
    { platform: 'facebook', label: 'Facebook', url: `https://facebook.com/${slug}` },
    { platform: 'soundcloud', label: 'SoundCloud', url: `https://soundcloud.com/${slug}` },
    { platform: 'spotify', label: 'Spotify', url: `https://open.spotify.com/search/${encodeURIComponent(slug)}` },
    { platform: 'youtube', label: 'YouTube', url: `https://youtube.com/@${slug}` },
  ]
}

/** Blank artist ready for CMS editing — includes all social link fields. */
export function createBlankArtist(
  name: string,
  existingSlugs: string[],
): Artist {
  const trimmed = name.trim() || 'New artist'
  const slug = uniqueArtistSlug(slugifyArtistName(trimmed), existingSlugs)

  return {
    id: crypto.randomUUID(),
    name: trimmed,
    slug,
    genre: '',
    imageUrl: '',
    imageAlt: `${trimmed} portrait`,
    imageFocusX: DEFAULT_ART_DIRECTION.x,
    imageFocusY: DEFAULT_ART_DIRECTION.y,
    imageScale: DEFAULT_ART_DIRECTION.scale,
    imageFocus: formatFocus(DEFAULT_ART_DIRECTION.x, DEFAULT_ART_DIRECTION.y),
    artDirectionVersion: ART_DIRECTION_VERSION,
    bio: '',
    presskitUrl: '',
    socials: defaultArtistSocials(slug),
    tracks: [],
    music: {
      platform: 'soundcloud',
      embedUrl: '',
      title: 'Latest Mix',
      visible: false,
    },
    sections: DEFAULT_ARTIST_SECTIONS.map((s) => ({ ...s })),
    status: 'draft',
    visible: false,
  }
}

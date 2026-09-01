import type { Artist, SocialLink, Track } from '@/types/artist'
import { artists } from '@/data/artists'

const defaultSocials = (slug: string): SocialLink[] => [
  { platform: 'website', url: `#`, label: 'Website' },
  { platform: 'instagram', url: `https://instagram.com/${slug}`, label: 'Instagram' },
  { platform: 'tiktok', url: `https://tiktok.com/@${slug}`, label: 'TikTok' },
  { platform: 'facebook', url: `https://facebook.com/${slug}`, label: 'Facebook' },
  { platform: 'soundcloud', url: `https://soundcloud.com/${slug}`, label: 'SoundCloud' },
  { platform: 'spotify', url: `https://open.spotify.com/search/${slug}`, label: 'Spotify' },
]

const defaultTracks = (name: string): Track[] => [
  { id: '1', title: 'Grey & Old', credit: name, duration: '3:24' },
  { id: '2', title: 'Paralyzed', credit: name, duration: '2:58' },
  { id: '3', title: 'Night Drive', credit: `${name}, Friends`, duration: '3:41' },
  { id: '4', title: 'After Hours', credit: name, duration: '4:02' },
  { id: '5', title: 'Signal', credit: name, duration: '3:15' },
]

/** Rich overrides for featured artists — rest get sensible defaults. */
const overrides: Record<
  string,
  Partial<Pick<Artist, 'bio' | 'socials' | 'tracks' | 'presskitUrl'>>
> = {
  'alber-k': {
    bio: 'Alber-K is a house producer and DJ known for warm grooves, sharp DJ tools and late-night energy. From club residencies to festival stages, his sets blend classic house DNA with a modern crossover edge — always built for the floor.',
    tracks: [
      { id: '1', title: 'Grey & Old', credit: 'Alber-K', duration: '3:24' },
      { id: '2', title: 'Paralyzed', credit: 'Alber-K', duration: '2:58' },
      { id: '3', title: 'Blue Room', credit: 'Alber-K', duration: '3:47' },
      { id: '4', title: 'Keep Moving', credit: 'Alber-K, Friends', duration: '4:11' },
      { id: '5', title: 'Sunrise Edit', credit: 'Alber-K', duration: '3:33' },
    ],
  },
}

export function getArtistBySlug(slug: string): Artist | undefined {
  const base = artists.find((a) => a.slug === slug)
  if (!base) return undefined

  const extra = overrides[slug] ?? {}
  return {
    ...base,
    bio:
      extra.bio ??
      `${base.name} is part of the No Type roster — a ${base.genre ?? 'music'} act with a clear signature and ambitious live energy. Full-service management across bookings, strategy and creative direction.`,
    socials: extra.socials ?? defaultSocials(slug),
    tracks: extra.tracks ?? defaultTracks(base.name),
    presskitUrl: extra.presskitUrl ?? '#',
  }
}

export function getAllArtistSlugs(): string[] {
  return artists.map((a) => a.slug)
}

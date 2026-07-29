import type { ArtistRow } from '@/lib/database.types'
import type {
  Artist,
  ArtistSectionConfig,
  SocialLink,
  Track,
} from '@/types/artist'
import { withArtDirection } from '@/cms/imageFocus'

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

/** Map a Supabase artists row → app Artist type. */
export function artistFromRow(row: ArtistRow): Artist {
  const mapped: Artist = {
    id: row.id,
    slug: row.slug,
    name: row.name,
    genre: row.genre ?? undefined,
    bio: row.bio ?? undefined,
    imageUrl: row.image_url ?? '',
    imageAlt: row.image_alt ?? `${row.name} portrait`,
    imageFocus: row.image_focus ?? undefined,
    imageFocusX: row.image_focus_x ?? undefined,
    imageFocusY: row.image_focus_y ?? undefined,
    imageScale: row.image_scale ?? undefined,
    artDirectionVersion: row.art_direction_version ?? undefined,
    videoUrl: row.video_url ?? undefined,
    socials: asArray<SocialLink>(row.socials),
    tracks: asArray<Track>(row.tracks),
    sections: asArray<ArtistSectionConfig>(row.sections),
    presskitUrl: row.presskit_url ?? undefined,
    visible: row.visible,
  }

  return withArtDirection(mapped)
}

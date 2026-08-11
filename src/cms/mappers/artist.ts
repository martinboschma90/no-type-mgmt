import type { ArtistRow, Database } from '@/lib/database.types'
import type {
  Artist,
  ArtistSectionConfig,
  ArtistStatus,
  SocialLink,
} from '@/types/artist'
import {
  DEFAULT_ARTIST_SECTIONS,
  normalizeArtistSections,
} from '@/cms/artistSections'
import {
  parseTracksColumn,
  serializeTracksColumn,
} from '@/cms/artistMusic'
import {
  parseVideosColumn,
  syncLegacyVideoUrl,
} from '@/cms/artistVideos'
import { getArtistStatus } from '@/cms/artistVisibility'
import { withArtDirection } from '@/cms/imageFocus'

type ArtistInsert = Database['public']['Tables']['artists']['Insert']
type ArtistUpdate = Database['public']['Tables']['artists']['Update']

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/** True when id is a real Postgres UUID (seed ids like "1" are not). */
export function isArtistUuid(id: string) {
  return UUID_RE.test(id)
}

function parseStatus(value: unknown, visible: boolean): ArtistStatus {
  if (value === 'draft' || value === 'published') return value
  return visible ? 'published' : 'draft'
}

/** Map a Supabase artists row → app Artist type. */
export function artistFromRow(row: ArtistRow): Artist {
  const { tracks, music } = parseTracksColumn(row.tracks)
  const status = parseStatus(row.status, row.visible)

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
    videos: parseVideosColumn(row.videos),
    socials: asArray<SocialLink>(row.socials),
    tracks,
    music,
    sections: asArray<ArtistSectionConfig>(row.sections),
    presskitUrl: row.presskit_url ?? undefined,
    status,
    publishedAt: row.published_at ?? undefined,
    visible: status === 'published',
  }

  return withArtDirection(mapped)
}

/** Slim row shape for public roster cards (skips heavy jsonb). */
export type ArtistRosterRow = Pick<
  ArtistRow,
  | 'id'
  | 'slug'
  | 'name'
  | 'genre'
  | 'image_url'
  | 'image_alt'
  | 'image_focus'
  | 'image_focus_x'
  | 'image_focus_y'
  | 'image_scale'
  | 'art_direction_version'
  | 'status'
  | 'published_at'
  | 'visible'
>

/** Map roster columns → Artist (card fields only). */
export function artistFromRosterRow(row: ArtistRosterRow): Artist {
  const status = parseStatus(row.status, row.visible)
  const mapped: Artist = {
    id: row.id,
    slug: row.slug,
    name: row.name,
    genre: row.genre ?? undefined,
    imageUrl: row.image_url ?? '',
    imageAlt: row.image_alt ?? `${row.name} portrait`,
    imageFocus: row.image_focus ?? undefined,
    imageFocusX: row.image_focus_x ?? undefined,
    imageFocusY: row.image_focus_y ?? undefined,
    imageScale: row.image_scale ?? undefined,
    artDirectionVersion: row.art_direction_version ?? undefined,
    status,
    publishedAt: row.published_at ?? undefined,
    visible: status === 'published',
  }
  return withArtDirection(mapped)
}

/** Shared column payload for insert / update / upsert. */
export function artistToColumns(artist: Artist): ArtistUpdate {
  const sections = normalizeArtistSections(
    artist.sections?.length ? artist.sections : DEFAULT_ARTIST_SECTIONS,
  )
  const status = getArtistStatus(artist)

  return {
    slug: artist.slug,
    name: artist.name,
    genre: artist.genre ?? null,
    bio: artist.bio ?? null,
    image_url: artist.imageUrl || null,
    image_alt: artist.imageAlt || null,
    image_focus: artist.imageFocus ?? null,
    image_focus_x:
      typeof artist.imageFocusX === 'number' ? artist.imageFocusX : null,
    image_focus_y:
      typeof artist.imageFocusY === 'number' ? artist.imageFocusY : null,
    image_scale:
      typeof artist.imageScale === 'number' ? artist.imageScale : null,
    art_direction_version:
      typeof artist.artDirectionVersion === 'number'
        ? artist.artDirectionVersion
        : null,
    video_url: syncLegacyVideoUrl(artist.videos) ?? artist.videoUrl ?? null,
    videos: (artist.videos ?? [])
      .filter((v) => Boolean(v.videoUrl?.trim()))
      .slice(0, 5)
      .map((v) => ({
        id: v.id,
        videoUrl: v.videoUrl.trim(),
        posterUrl: v.posterUrl?.trim() || '',
        title: v.title?.trim() || '',
      })),
    socials: artist.socials ?? [],
    tracks: serializeTracksColumn(artist.tracks, artist.music),
    sections,
    presskit_url: artist.presskitUrl ?? null,
    status,
    published_at: artist.publishedAt ?? null,
    visible: status === 'published',
  }
}

/** Insert payload — includes id only when it is a UUID. */
export function artistToInsert(artist: Artist): ArtistInsert {
  const columns = artistToColumns(artist)
  if (isArtistUuid(artist.id)) {
    return { ...columns, id: artist.id, slug: artist.slug, name: artist.name }
  }
  return { ...columns, slug: artist.slug, name: artist.name }
}

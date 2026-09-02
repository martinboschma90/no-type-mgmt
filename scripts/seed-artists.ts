/**
 * Phase 2.2 — one-time artist seed → Supabase (upsert by slug).
 *
 * Source (same as local CMS defaults):
 *   - src/data/artists.ts
 *   - src/data/artistDetails.ts
 *   - art direction seeds (image focus X/Y + scale)
 *
 * Usage:
 *   npm run seed:artists:dry
 *   npm run seed:artists
 *
 * Requires in .env.local:
 *   VITE_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY   (Dashboard → Settings → API → service_role)
 *
 * Non-destructive: upsert on slug only. Never deletes rows.
 * Does not touch CMS UI or write paths.
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  DEFAULT_ARTIST_SECTIONS,
  normalizeArtistSections,
} from '../src/cms/artistSections'
import { createDefaultContent } from '../src/cms/defaultCmsContent'
import type { Artist } from '../src/types/artist'

const dryRun = process.argv.includes('--dry-run')
const root = process.cwd()

function loadEnvFile(filename: string) {
  const path = resolve(root, filename)
  if (!existsSync(path)) return false
  const text = readFileSync(path, 'utf8')
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (!(key in process.env)) process.env[key] = value
  }
  return true
}

const loaded = ['.env.local', '.env'].filter((f) => loadEnvFile(f))

const url = (process.env.VITE_SUPABASE_URL ?? '').trim()
const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim()

console.log('=== No Type · Phase 2.2 seed artists ===\n')
console.log('Env files loaded:', loaded.length ? loaded.join(', ') : '(none)')
console.log('Mode:', dryRun ? 'dry-run (no writes)' : 'upsert')
console.log('VITE_SUPABASE_URL:', url ? `${url.slice(0, 32)}…` : '(missing)')
console.log(
  'SUPABASE_SERVICE_ROLE_KEY:',
  serviceKey
    ? `${serviceKey.slice(0, 12)}… (${serviceKey.length} chars)`
    : '(missing)',
)

if (!dryRun) {
  if (!url || !serviceKey) {
    console.error(`
Error: Missing credentials.
Add to .env.local (never commit service_role):
  VITE_SUPABASE_URL=https://….supabase.co
  SUPABASE_SERVICE_ROLE_KEY=eyJ…   # Project Settings → API → service_role
`)
    process.exit(1)
  }

  if (serviceKey === process.env.VITE_SUPABASE_ANON_KEY?.trim()) {
    console.error(
      'Error: SUPABASE_SERVICE_ROLE_KEY looks like the anon key. Use the service_role secret.',
    )
    process.exit(1)
  }
}

/** Map app Artist → artists table row (omit id — seed ids are not UUIDs). */
function artistToRow(artist: Artist) {
  const sections = normalizeArtistSections(
    artist.sections?.length ? artist.sections : DEFAULT_ARTIST_SECTIONS,
  )

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
    video_url: artist.videoUrl ?? null,
    videos: (artist.videos ?? [])
      .filter((v) => Boolean(v.videoUrl?.trim()))
      .map((v) => ({
        id: v.id,
        videoUrl: v.videoUrl,
        posterUrl: v.posterUrl ?? '',
        title: v.title ?? '',
      })),
    socials: artist.socials ?? [],
    tracks: artist.tracks ?? [],
    sections,
    presskit_url: artist.presskitUrl ?? null,
    visible: artist.visible !== false,
  }
}

const { artists } = createDefaultContent()
const rows = artists.map(artistToRow)

console.log(`\nPrepared ${rows.length} artist row(s) from local seed.`)
console.log(
  'Slugs:',
  rows.map((r) => r.slug).slice(0, 8).join(', ') +
    (rows.length > 8 ? `, … (+${rows.length - 8})` : ''),
)

if (dryRun) {
  const sample = rows[0]
  console.log('\nDry-run sample row (first artist):')
  console.log(
    JSON.stringify(
      {
        slug: sample.slug,
        name: sample.name,
        bio: `${sample.bio?.slice(0, 80) ?? ''}…`,
        image_focus_x: sample.image_focus_x,
        image_focus_y: sample.image_focus_y,
        image_scale: sample.image_scale,
        socials: sample.socials.length,
        tracks: sample.tracks.length,
        sections: sample.sections,
        visible: sample.visible,
      },
      null,
      2,
    ),
  )
  console.log('\nNo writes performed. Re-run without --dry-run to upsert.')
  process.exit(0)
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const { data, error } = await supabase
  .from('artists')
  .upsert(rows, { onConflict: 'slug' })
  .select('slug, name, visible')

if (error) {
  console.error('\nUpsert failed:', error.message)
  if (error.details) console.error('Details:', error.details)
  if (error.hint) console.error('Hint:', error.hint)
  process.exit(1)
}

const { count, error: countError } = await supabase
  .from('artists')
  .select('id', { count: 'exact', head: true })

console.log(`\nUpserted: ${data?.length ?? rows.length} row(s)`)
if (!countError) {
  console.log(`artists table count: ${count}`)
}
console.log(
  'Result sample:',
  (data ?? [])
    .slice(0, 5)
    .map((r) => r.slug)
    .join(', '),
)
console.log('\nDone. Public pages (Phase 2.1) will read these when present.')

import { useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { useCms } from '@/cms/CmsProvider'
import { useMedia } from '@/cms/media/MediaProvider'
import {
  applyMediaUrlMap,
  countLocalMediaRefs,
  migrateLocalMediaRefs,
  type MigrateLocalMediaResult,
} from '@/cms/media/migrateLocalMedia'
import { parseMediaRef } from '@/cms/media/refs'
import type { Artist } from '@/types/artist'

function rewriteArtistMedia(
  artist: Artist,
  getPublicUrl: (id: string) => string | undefined,
): Artist | null {
  const urlById: Record<string, string> = {}
  const consider = (value: string | undefined) => {
    if (!value) return
    const id = parseMediaRef(value)
    if (!id) return
    const publicUrl = getPublicUrl(id)
    if (publicUrl) urlById[id] = publicUrl
  }

  consider(artist.imageUrl)
  consider(artist.videoUrl)
  for (const video of artist.videos ?? []) {
    consider(video.videoUrl)
    consider(video.posterUrl)
  }

  if (Object.keys(urlById).length === 0) return null
  const next = applyMediaUrlMap(artist, urlById)
  const changed =
    next.imageUrl !== artist.imageUrl ||
    next.videoUrl !== artist.videoUrl ||
    JSON.stringify(next.videos) !== JSON.stringify(artist.videos)
  return changed ? next : null
}

/**
 * CMS panel: migrate `media://` refs → Supabase Storage HTTPS URLs.
 * Keeps publish block intact; only rewrites when migration succeeds.
 */
export function MediaArtistRepair() {
  const { content, updateArtist, saveArtist, setArtists } = useCms()
  const { ready, syncingRemote, getPublicUrl, assets } = useMedia()
  const [orphanCount, setOrphanCount] = useState(0)
  const [running, setRunning] = useState(false)
  const [lastResult, setLastResult] = useState<MigrateLocalMediaResult | null>(
    null,
  )
  const repairing = useRef(false)
  const doneKeys = useRef(new Set<string>())

  useEffect(() => {
    setOrphanCount(countLocalMediaRefs(content.artists))
  }, [content.artists, assets, ready])

  // Passive rewrite when MediaProvider already published a publicUrl for an id
  useEffect(() => {
    if (!ready || syncingRemote || repairing.current || running) return

    const jobs: { slug: string; repaired: Artist }[] = []

    for (const artist of content.artists) {
      const repaired = rewriteArtistMedia(artist, getPublicUrl)
      if (!repaired) continue
      const key = `${artist.id}:${repaired.imageUrl}:${repaired.videoUrl ?? ''}`
      if (doneKeys.current.has(key)) continue
      doneKeys.current.add(key)
      jobs.push({ slug: artist.slug, repaired })
    }

    if (jobs.length === 0) return

    repairing.current = true
    void (async () => {
      for (const job of jobs) {
        flushSync(() => {
          updateArtist(job.slug, () => job.repaired)
        })
        await saveArtist(job.slug)
      }
      repairing.current = false
    })()
  }, [
    assets,
    content.artists,
    getPublicUrl,
    ready,
    running,
    saveArtist,
    syncingRemote,
    updateArtist,
  ])

  async function runMigration() {
    if (running) return
    setRunning(true)
    setLastResult(null)
    try {
      const { artists: nextArtists, result } = await migrateLocalMediaRefs({
        artists: content.artists,
        localAssets: assets,
      })

      flushSync(() => {
        setArtists(() => nextArtists)
      })

      for (const slug of result.artistsUpdated) {
        await saveArtist(slug)
      }

      setLastResult(result)
      setOrphanCount(result.remaining)
    } finally {
      setRunning(false)
    }
  }

  return (
    <div
      className={[
        'mb-3 space-y-3 rounded-2xl border px-3.5 py-3',
        orphanCount > 0
          ? 'border-brand/30 bg-brand/10'
          : 'border-ink/10 bg-ink/[0.03]',
      ].join(' ')}
      role="status"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="type-label text-[0.65rem] tracking-[0.12em] text-ink uppercase">
            Media storage sync
          </p>
          <p className="type-body mt-1.5 text-xs text-ink/65">
            {orphanCount > 0
              ? `${orphanCount} media:// link${orphanCount === 1 ? '' : 's'} still need a permanent Supabase Storage URL before publish.`
              : 'No local-only media:// references detected on artists.'}
          </p>
        </div>
        <button
          type="button"
          disabled={running || syncingRemote || !ready}
          onClick={() => void runMigration()}
          className="type-label shrink-0 rounded-full bg-brand px-3.5 py-2 text-[0.6rem] tracking-[0.12em] text-[#111111] uppercase transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {running ? 'Syncing…' : 'Sync missing media to Storage'}
        </button>
      </div>

      {lastResult ? (
        <div className="rounded-xl border border-ink/10 bg-[var(--body-bg)]/70 px-3 py-2.5 type-body text-xs text-ink/70">
          <p>
            Migrated: <span className="text-ink">{lastResult.migrated}</span>
            {' · '}
            Failed: <span className="text-ink">{lastResult.failed.length}</span>
            {' · '}
            Remaining:{' '}
            <span className="text-ink">{lastResult.remaining}</span>
          </p>
          {lastResult.artistsUpdated.length > 0 ? (
            <p className="mt-1 text-ink/50">
              Artists updated: {lastResult.artistsUpdated.join(', ')}
            </p>
          ) : null}
          {lastResult.failed.length > 0 ? (
            <ul className="mt-2 space-y-1 text-red-400">
              {lastResult.failed.map((f) => (
                <li key={f.mediaId}>
                  {f.mediaId.slice(0, 8)}… — {f.reason}
                </li>
              ))}
            </ul>
          ) : null}
          {lastResult.remaining > 0 ? (
            <p className="mt-2 text-ink/55">
              Remaining refs need a re-upload in this browser (file missing from
              IndexedDB), then run sync again. Publish stays blocked until
              remaining is 0.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

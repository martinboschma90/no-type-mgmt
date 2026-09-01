import { useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { useCms } from '@/cms/CmsProvider'
import { useMedia } from '@/cms/media/MediaProvider'
import {
  applyMediaUrlMap,
  countUnsyncedMediaUrls,
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
    consider(video.clipUrl)
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
  const { content, updateArtist, saveArtist, setArtists, setSite, setTeam } =
    useCms()
  const { ready, syncingRemote, getPublicUrl, assets } = useMedia()
  const [orphanCount, setOrphanCount] = useState(0)
  const [running, setRunning] = useState(false)
  const [lastResult, setLastResult] = useState<MigrateLocalMediaResult | null>(
    null,
  )
  const repairing = useRef(false)
  const doneKeys = useRef(new Set<string>())

  useEffect(() => {
    setOrphanCount(countUnsyncedMediaUrls(content))
  }, [content, assets, ready])

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
      const { content: nextContent, result } = await migrateLocalMediaRefs({
        content,
        localAssets: assets,
      })

      flushSync(() => {
        setSite(() => nextContent.site)
        setTeam(() => nextContent.team)
        setArtists(() => nextContent.artists)
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
      className="mb-3 space-y-3 rounded-xl border border-neutral-200 bg-white px-3.5 py-3"
      role="status"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-xs font-semibold text-neutral-900">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                orphanCount > 0 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
            />
            Media-opslag
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">
            {orphanCount > 0
              ? `${orphanCount} ${orphanCount === 1 ? 'bestand heeft' : 'bestanden hebben'} nog een permanente opslaglink nodig.`
              : 'Alle mediabestanden zijn online beschikbaar.'}
          </p>
        </div>
        <button
          type="button"
          disabled={running || syncingRemote || !ready}
          onClick={() => void runMigration()}
          className="cms-primary-action shrink-0 rounded-lg bg-neutral-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-neutral-800 disabled:opacity-40"
        >
          {running ? 'Synchroniseren…' : 'Ontbrekende media synchroniseren'}
        </button>
      </div>

      {lastResult ? (
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-xs text-neutral-600">
          <p>
            Gesynchroniseerd:{' '}
            <span className="font-medium text-neutral-900">{lastResult.migrated}</span>
            {' · '}
            Mislukt:{' '}
            <span className="font-medium text-neutral-900">{lastResult.failed.length}</span>
            {' · '}
            Resterend:{' '}
            <span className="font-medium text-neutral-900">{lastResult.remaining}</span>
          </p>
          {lastResult.artistsUpdated.length > 0 ? (
            <p className="mt-1 text-neutral-500">
              Artiesten bijgewerkt: {lastResult.artistsUpdated.join(', ')}
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
            <p className="mt-2 text-neutral-500">
              Upload de ontbrekende bestanden opnieuw en start daarna de
              synchronisatie nogmaals. Publiceren blijft geblokkeerd zolang er
              bestanden ontbreken.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

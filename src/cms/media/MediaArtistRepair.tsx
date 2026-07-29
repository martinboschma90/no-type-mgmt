import { useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { useCms } from '@/cms/CmsProvider'
import { useMedia } from '@/cms/media/MediaProvider'
import { parseMediaRef } from '@/cms/media/refs'
import { isMediaLibraryRef } from '@/cms/media/publicMedia'
import type { Artist } from '@/types/artist'

function collectMediaRefs(artist: Artist): string[] {
  const refs: string[] = []
  if (isMediaLibraryRef(artist.imageUrl)) refs.push(artist.imageUrl)
  if (isMediaLibraryRef(artist.videoUrl)) refs.push(artist.videoUrl!)
  for (const video of artist.videos ?? []) {
    if (isMediaLibraryRef(video.videoUrl)) refs.push(video.videoUrl)
    if (isMediaLibraryRef(video.posterUrl)) refs.push(video.posterUrl!)
  }
  return refs
}

function rewriteArtistMedia(
  artist: Artist,
  getPublicUrl: (id: string) => string | undefined,
): Artist | null {
  let changed = false

  const rewrite = (value: string | undefined) => {
    if (!value) return value
    const id = parseMediaRef(value)
    if (!id) return value
    const publicUrl = getPublicUrl(id)
    if (!publicUrl || publicUrl === value) return value
    changed = true
    return publicUrl
  }

  const next: Artist = {
    ...artist,
    imageUrl: rewrite(artist.imageUrl) || artist.imageUrl,
    videoUrl: rewrite(artist.videoUrl),
    videos: artist.videos?.map((video) => ({
      ...video,
      videoUrl: rewrite(video.videoUrl) || video.videoUrl,
      posterUrl: rewrite(video.posterUrl),
    })),
  }

  return changed ? next : null
}

/**
 * After local media is published to Supabase Storage, rewrite artist
 * `media://` fields to durable public HTTPS URLs and save.
 */
export function MediaArtistRepair() {
  const { content, updateArtist, saveArtist } = useCms()
  const { ready, syncingRemote, getPublicUrl, getAssetUrl, assets } = useMedia()
  const [orphanCount, setOrphanCount] = useState(0)
  const repairing = useRef(false)
  const doneKeys = useRef(new Set<string>())

  useEffect(() => {
    if (!ready || syncingRemote || repairing.current) return

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
    saveArtist,
    syncingRemote,
    updateArtist,
  ])

  useEffect(() => {
    if (!ready) return
    let orphans = 0
    for (const artist of content.artists) {
      for (const ref of collectMediaRefs(artist)) {
        const id = parseMediaRef(ref)
        if (!id) continue
        if (getAssetUrl(id) || getPublicUrl(id)) continue
        orphans += 1
      }
    }
    setOrphanCount(orphans)
  }, [assets, content.artists, getAssetUrl, getPublicUrl, ready])

  if (orphanCount === 0) return null

  return (
    <div
      className="mb-3 rounded-2xl border border-brand/30 bg-brand/10 px-3.5 py-3"
      role="status"
    >
      <p className="type-label text-[0.65rem] tracking-[0.12em] text-ink uppercase">
        Media ontbreekt in deze browser
      </p>
      <p className="type-body mt-1.5 text-xs text-ink/65">
        {orphanCount} mediakoppeling
        {orphanCount === 1 ? '' : 'en'} (foto/video) staan als lokale referentie
        maar het bestand ontbreekt hier. Open de artiest → Profile / Visuals en
        upload de file opnieuw. Nieuwe uploads worden permanent in Supabase
        Storage bewaard.
      </p>
    </div>
  )
}

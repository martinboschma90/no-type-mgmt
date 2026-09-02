import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/cms/auth/AuthProvider'
import { useCms } from '@/cms/CmsProvider'
import { getArtistStatus } from '@/cms/artistVisibility'
import { normalizeArtistVideos } from '@/cms/artistVideos'
import { useMedia } from '@/cms/media/MediaProvider'
import { parseMediaRef, toMediaRef } from '@/cms/media/refs'
import type { LiveSiteSnapshot } from '@/cms/flow-mates/liveSite'
import type { ArtistVideo } from '@/types/artist'

const MAX_CLIPS = 2

export type AutoOptimizeState = {
  running: boolean
  message: string | null
  done: boolean
}

function resolveVideoUrl(
  videoUrl: string,
  assets: { id: string; publicUrl?: string; url: string }[],
) {
  const id = parseMediaRef(videoUrl)
  if (id) {
    const asset = assets.find((item) => item.id === id)
    return asset?.publicUrl || asset?.url || videoUrl
  }
  return videoUrl
}

export function useAutoOptimize(live: LiveSiteSnapshot | null): AutoOptimizeState {
  const { content, saveArtist, updateArtist } = useCms()
  const { assets, createVideoPoster, createVideoClip } = useMedia()
  const { session, canEdit } = useAuth()
  const [state, setState] = useState<AutoOptimizeState>({
    running: false,
    message: null,
    done: false,
  })
  const startedFor = useRef<string | null>(null)

  useEffect(() => {
    const test = live?.speed?.latest
    if (!canEdit || !test?.id || test.optimizedAt) return
    if (!live?.speed?.belowThreshold) return
    if (startedFor.current === test.id) return
    startedFor.current = test.id

    let cancelled = false
    async function run() {
      setState({ running: true, message: 'Score te laag — video’s optimaliseren…', done: false })
      const published = content.artists.filter(
        (artist) => getArtistStatus(artist) === 'published',
      )
      let posters = 0
      let clips = 0
      const changed = new Set<string>()

      for (const artist of published) {
        if (cancelled) return
        const videos = normalizeArtistVideos(artist)
        const nextVideos: ArtistVideo[] = []
        let artistChanged = false
        for (const video of videos) {
          const patched = { ...video }
          const source = resolveVideoUrl(video.videoUrl, assets)
          if (!source || (!/^https?:\/\//i.test(source) && !source.startsWith('blob:'))) {
            nextVideos.push(patched)
            continue
          }
          if (!patched.posterUrl?.trim()) {
            try {
              setState({
                running: true,
                message: `Poster maken: ${artist.name}`,
                done: false,
              })
              const asset = await createVideoPoster({
                sourceUrl: source,
                name: `${artist.slug}-poster`,
                atTime: patched.clipStart ?? 0.45,
              })
              patched.posterUrl = asset.publicUrl || toMediaRef(asset.id)
              posters += 1
              artistChanged = true
            } catch {
              /* skip this video */
            }
          }
          if (!patched.clipUrl?.trim() && clips < MAX_CLIPS) {
            try {
              setState({
                running: true,
                message: `Fragment maken: ${artist.name}`,
                done: false,
              })
              const asset = await createVideoClip({
                sourceUrl: source,
                name: `${artist.slug}-clip`,
                startTime: patched.clipStart ?? 0,
                duration: patched.clipDuration ?? 6,
              })
              patched.clipUrl = asset.publicUrl || toMediaRef(asset.id)
              patched.clipBytes = asset.size
              clips += 1
              artistChanged = true
            } catch {
              /* skip this video */
            }
          }
          nextVideos.push(patched)
        }
        if (artistChanged) {
          updateArtist(artist.slug, (current) => ({ ...current, videos: nextVideos }))
          changed.add(artist.slug)
        }
      }

      for (const slug of changed) {
        await saveArtist(slug)
      }

      const summary =
        posters || clips
          ? `${posters} poster${posters === 1 ? '' : 's'}, ${clips} fragment${clips === 1 ? '' : 'en'}`
          : 'geen extra media gemaakt'
      if (test.id && session?.access_token) {
        await fetch('/api/site-speed', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'optimize-done',
            id: test.id,
            summary,
          }),
        }).catch(() => null)
      }
      if (!cancelled) {
        setState({
          running: false,
          message: `Automatisch geoptimaliseerd: ${summary}.`,
          done: true,
        })
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [assets, canEdit, content.artists, createVideoClip, createVideoPoster, live, saveArtist, session?.access_token, updateArtist])

  return state
}

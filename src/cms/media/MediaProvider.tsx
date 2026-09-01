import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from '@/cms/auth/AuthProvider'
import {
  convertImageToWebp,
  convertVideoToWebm,
  isImageFile,
  isVideoFile,
} from '@/cms/media/convert'
import { idbClearAssets, idbDeleteAsset, idbListAssets, idbPutAsset } from '@/cms/media/idb'
import { MediaContext } from '@/cms/media/MediaContext'
import { publishMediaAssetToSupabase } from '@/cms/media/publishMedia'
import type { MediaAsset, MediaUploadProgress } from '@/cms/media/types'
import { isSupabaseConfigured } from '@/lib/supabaseEnv'

function baseName(fileName: string) {
  return fileName.replace(/\.[^.]+$/, '')
}

function toAsset(
  meta: Omit<MediaAsset, 'url' | 'blob'> & { blob: Blob; publicUrl?: string },
): MediaAsset {
  return {
    ...meta,
    url: URL.createObjectURL(meta.blob),
  }
}

async function syncAssetToSupabase(
  asset: Pick<
    MediaAsset,
    | 'id'
    | 'name'
    | 'kind'
    | 'mimeType'
    | 'size'
    | 'width'
    | 'height'
    | 'duration'
    | 'blob'
  >,
): Promise<string | null> {
  if (!isSupabaseConfigured) return null
  return publishMediaAssetToSupabase({
    id: asset.id,
    name: asset.name,
    kind: asset.kind,
    mimeType: asset.mimeType,
    size: asset.size,
    width: asset.width,
    height: asset.height,
    duration: asset.duration,
    blob: asset.blob,
  })
}

export function MediaProvider({ children }: { children: ReactNode }) {
  const { ready: authReady, user } = useAuth()
  const [assets, setAssets] = useState<MediaAsset[]>([])
  const [ready, setReady] = useState(false)
  const [syncingRemote, setSyncingRemote] = useState(false)
  const [uploading, setUploading] = useState<MediaUploadProgress | null>(null)
  const syncedIds = useRef(new Set<string>())
  const assetsRef = useRef(assets)
  assetsRef.current = assets

  // Load IndexedDB library
  useEffect(() => {
    let cancelled = false
    const urls: string[] = []

    ;(async () => {
      const rows = await idbListAssets()
      if (cancelled) return
      const next = rows.map((row) => {
        const asset = toAsset(row)
        urls.push(asset.url)
        return asset
      })
      setAssets(next)
      setReady(true)
    })().catch(() => {
      if (!cancelled) setReady(true)
    })

    return () => {
      cancelled = true
      urls.forEach((u) => URL.revokeObjectURL(u))
    }
  }, [])

  // Publish local blobs → Supabase Storage once the admin session exists
  useEffect(() => {
    if (!isSupabaseConfigured || !authReady || !user || !ready) return

    let cancelled = false

    ;(async () => {
      const pending = assetsRef.current.filter(
        (a) => !a.publicUrl && !syncedIds.current.has(a.id),
      )
      if (pending.length === 0) return

      setSyncingRemote(true)
      for (const asset of pending) {
        if (cancelled) break
        syncedIds.current.add(asset.id)
        const publicUrl = await syncAssetToSupabase(asset)
        if (!publicUrl || cancelled) continue
        setAssets((prev) =>
          prev.map((a) => (a.id === asset.id ? { ...a, publicUrl } : a)),
        )
      }
      if (!cancelled) setSyncingRemote(false)
    })().catch(() => {
      if (!cancelled) setSyncingRemote(false)
    })

    return () => {
      cancelled = true
    }
  }, [authReady, user, ready, assets.length])

  const uploadFiles = useCallback(async (files: FileList | File[]) => {
    const list = Array.from(files)
    const created: MediaAsset[] = []

    for (const file of list) {
      setUploading({ fileName: file.name, stage: 'reading' })
      try {
        if (isImageFile(file)) {
          setUploading({
            fileName: file.name,
            stage: 'converting',
            message: 'Converting to WebP…',
          })
          const { blob, width, height } = await convertImageToWebp(file)
          const id = crypto.randomUUID()
          const meta = {
            id,
            name: `${baseName(file.name)}.webp`,
            kind: 'image' as const,
            mimeType: 'image/webp' as const,
            size: blob.size,
            width,
            height,
            createdAt: Date.now(),
            blob,
          }
          setUploading({ fileName: file.name, stage: 'saving' })
          await idbPutAsset(meta)
          const publicUrl = await syncAssetToSupabase(meta)
          if (publicUrl) syncedIds.current.add(id)
          const asset = toAsset({ ...meta, publicUrl: publicUrl ?? undefined })
          created.push(asset)
          setAssets((prev) => [asset, ...prev])
        } else if (isVideoFile(file)) {
          setUploading({
            fileName: file.name,
            stage: 'converting',
            message: 'Preparing video…',
          })
          const { blob, width, height, duration } = await convertVideoToWebm(
            file,
            (ratio) => {
              setUploading({
                fileName: file.name,
                stage: 'converting',
                message: `Converting to WebM… ${Math.round(ratio * 100)}%`,
              })
            },
          )
          const mimeType = blob.type || 'video/webm'
          const ext =
            mimeType.includes('webm')
              ? 'webm'
              : mimeType.includes('quicktime') ||
                  file.name.toLowerCase().endsWith('.mov')
                ? 'mov'
                : mimeType.includes('mp4') || mimeType.includes('m4v')
                  ? 'mp4'
                  : file.name.includes('.')
                    ? (file.name.split('.').pop() ?? 'mp4')
                    : 'mp4'
          const id = crypto.randomUUID()
          const meta = {
            id,
            name: `${baseName(file.name)}.${ext}`,
            kind: 'video' as const,
            mimeType,
            size: blob.size,
            width,
            height,
            duration,
            createdAt: Date.now(),
            blob,
          }
          setUploading({ fileName: file.name, stage: 'saving' })
          await idbPutAsset(meta)
          const publicUrl = await syncAssetToSupabase(meta)
          if (publicUrl) syncedIds.current.add(id)
          const asset = toAsset({ ...meta, publicUrl: publicUrl ?? undefined })
          created.push(asset)
          setAssets((prev) => [asset, ...prev])
        } else {
          throw new Error('Only image and video files are supported')
        }
        setUploading({ fileName: file.name, stage: 'done' })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Upload failed'
        setUploading({ fileName: file.name, stage: 'error', message })
        throw err
      }
    }

    window.setTimeout(() => setUploading(null), 1200)
    return created
  }, [])

  const createVideoClip = useCallback(
    async ({
      sourceUrl,
      name,
      startTime,
      duration,
    }: {
      sourceUrl: string
      name: string
      startTime: number
      duration: number
    }) => {
      const clipName = `${baseName(name || 'artist-video')}-clip.webm`
      setUploading({
        fileName: clipName,
        stage: 'reading',
        message: 'Originele video openen…',
      })

      try {
        const response = await fetch(sourceUrl)
        if (!response.ok) throw new Error('De originele video kon niet worden geopend.')
        const sourceBlob = await response.blob()
        const sourceFile = new File([sourceBlob], name || 'artist-video.mp4', {
          type: sourceBlob.type || 'video/mp4',
        })

        setUploading({
          fileName: clipName,
          stage: 'converting',
          message: 'Kort fragment maken…',
        })
        const converted = await convertVideoToWebm(
          sourceFile,
          (ratio) =>
            setUploading({
              fileName: clipName,
              stage: 'converting',
              message: `Fragment maken… ${Math.round(ratio * 100)}%`,
            }),
          { startTime, duration },
        )

        const id = crypto.randomUUID()
        const meta = {
          id,
          name: clipName,
          kind: 'video' as const,
          mimeType: converted.blob.type || 'video/webm',
          size: converted.blob.size,
          width: converted.width,
          height: converted.height,
          duration: converted.duration,
          createdAt: Date.now(),
          blob: converted.blob,
        }

        setUploading({ fileName: clipName, stage: 'saving', message: 'Opslaan…' })
        await idbPutAsset(meta)
        const publicUrl = await syncAssetToSupabase(meta)
        if (publicUrl) syncedIds.current.add(id)
        const asset = toAsset({ ...meta, publicUrl: publicUrl ?? undefined })
        setAssets((previous) => [asset, ...previous])
        setUploading({ fileName: clipName, stage: 'done' })
        window.setTimeout(() => setUploading(null), 1200)
        return asset
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Fragment maken mislukt.'
        setUploading({ fileName: clipName, stage: 'error', message })
        throw error
      }
    },
    [],
  )

  const removeAsset = useCallback(async (id: string) => {
    await idbDeleteAsset(id)
    syncedIds.current.delete(id)
    setAssets((prev) => {
      const target = prev.find((a) => a.id === id)
      if (target) URL.revokeObjectURL(target.url)
      return prev.filter((a) => a.id !== id)
    })
  }, [])

  const clearAll = useCallback(async () => {
    await idbClearAssets()
    syncedIds.current.clear()
    setAssets((prev) => {
      prev.forEach((a) => URL.revokeObjectURL(a.url))
      return []
    })
  }, [])

  const getAssetUrl = useCallback(
    (id: string) => {
      const asset = assets.find((a) => a.id === id)
      return asset?.url || asset?.publicUrl
    },
    [assets],
  )

  const getPublicUrl = useCallback(
    (id: string) => assets.find((a) => a.id === id)?.publicUrl,
    [assets],
  )

  const value = useMemo(
    () => ({
      assets,
      ready,
      syncingRemote,
      uploading,
      uploadFiles,
      createVideoClip,
      removeAsset,
      clearAll,
      getAssetUrl,
      getPublicUrl,
    }),
    [
      assets,
      ready,
      syncingRemote,
      uploading,
      uploadFiles,
      createVideoClip,
      removeAsset,
      clearAll,
      getAssetUrl,
      getPublicUrl,
    ],
  )

  return <MediaContext.Provider value={value}>{children}</MediaContext.Provider>
}

export function useMedia() {
  const ctx = useContext(MediaContext)
  if (!ctx) throw new Error('useMedia must be used within MediaProvider')
  return ctx
}

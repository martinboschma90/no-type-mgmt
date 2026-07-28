import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  convertImageToWebp,
  convertVideoToWebm,
  isImageFile,
  isVideoFile,
} from '@/cms/media/convert'
import { idbClearAssets, idbDeleteAsset, idbListAssets, idbPutAsset } from '@/cms/media/idb'
import type { MediaAsset, MediaUploadProgress } from '@/cms/media/types'

type MediaContextValue = {
  assets: MediaAsset[]
  ready: boolean
  uploading: MediaUploadProgress | null
  uploadFiles: (files: FileList | File[]) => Promise<MediaAsset[]>
  removeAsset: (id: string) => Promise<void>
  clearAll: () => Promise<void>
  getAssetUrl: (id: string) => string | undefined
}

const MediaContext = createContext<MediaContextValue | null>(null)

function baseName(fileName: string) {
  return fileName.replace(/\.[^.]+$/, '')
}

function toAsset(
  meta: Omit<MediaAsset, 'url' | 'blob'> & { blob: Blob },
): MediaAsset {
  return {
    ...meta,
    url: URL.createObjectURL(meta.blob),
  }
}

export function MediaProvider({ children }: { children: ReactNode }) {
  const [assets, setAssets] = useState<MediaAsset[]>([])
  const [ready, setReady] = useState(false)
  const [uploading, setUploading] = useState<MediaUploadProgress | null>(null)

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
          const asset = toAsset(meta)
          created.push(asset)
          setAssets((prev) => [asset, ...prev])
        } else if (isVideoFile(file)) {
          setUploading({
            fileName: file.name,
            stage: 'converting',
            message: 'Converting to WebM…',
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
          const id = crypto.randomUUID()
          const meta = {
            id,
            name: `${baseName(file.name)}.webm`,
            kind: 'video' as const,
            mimeType: 'video/webm' as const,
            size: blob.size,
            width,
            height,
            duration,
            createdAt: Date.now(),
            blob,
          }
          setUploading({ fileName: file.name, stage: 'saving' })
          await idbPutAsset(meta)
          const asset = toAsset(meta)
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

  const removeAsset = useCallback(async (id: string) => {
    await idbDeleteAsset(id)
    setAssets((prev) => {
      const target = prev.find((a) => a.id === id)
      if (target) URL.revokeObjectURL(target.url)
      return prev.filter((a) => a.id !== id)
    })
  }, [])

  const clearAll = useCallback(async () => {
    await idbClearAssets()
    setAssets((prev) => {
      prev.forEach((a) => URL.revokeObjectURL(a.url))
      return []
    })
  }, [])

  const getAssetUrl = useCallback(
    (id: string) => assets.find((a) => a.id === id)?.url,
    [assets],
  )

  const value = useMemo(
    () => ({
      assets,
      ready,
      uploading,
      uploadFiles,
      removeAsset,
      clearAll,
      getAssetUrl,
    }),
    [assets, ready, uploading, uploadFiles, removeAsset, clearAll, getAssetUrl],
  )

  return <MediaContext.Provider value={value}>{children}</MediaContext.Provider>
}

export function useMedia() {
  const ctx = useContext(MediaContext)
  if (!ctx) throw new Error('useMedia must be used within MediaProvider')
  return ctx
}

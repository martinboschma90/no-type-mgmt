import { createContext } from 'react'
import type { MediaAsset, MediaUploadProgress } from '@/cms/media/types'

export type MediaContextValue = {
  assets: MediaAsset[]
  ready: boolean
  syncingRemote: boolean
  uploading: MediaUploadProgress | null
  uploadFiles: (files: FileList | File[]) => Promise<MediaAsset[]>
  removeAsset: (id: string) => Promise<void>
  clearAll: () => Promise<void>
  getAssetUrl: (id: string) => string | undefined
  getPublicUrl: (id: string) => string | undefined
}

export const MediaContext = createContext<MediaContextValue | null>(null)

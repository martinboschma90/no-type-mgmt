export type MediaKind = 'image' | 'video'

export type MediaAssetMeta = {
  id: string
  name: string
  kind: MediaKind
  mimeType: 'image/webp' | 'video/webm'
  size: number
  width?: number
  height?: number
  duration?: number
  createdAt: number
}

export type MediaAsset = MediaAssetMeta & {
  blob: Blob
  /** Object URL for preview / site use — revoked on delete */
  url: string
}

export type MediaUploadProgress = {
  fileName: string
  stage: 'reading' | 'converting' | 'saving' | 'done' | 'error'
  message?: string
}

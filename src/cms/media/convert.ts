/** Browser-side conversion: images → WebP, video → WebM when supported. */

const MAX_IMAGE_EDGE = 2400

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not decode image'))
    }
    img.src = url
  })
}

function canvasToWebp(canvas: HTMLCanvasElement, quality = 0.86): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error('WebP encoding failed in this browser'))
        else resolve(blob)
      },
      'image/webp',
      quality,
    )
  })
}

export async function convertImageToWebp(file: File): Promise<{
  blob: Blob
  width: number
  height: number
}> {
  const img = await loadImage(file)
  let { naturalWidth: width, naturalHeight: height } = img

  const longest = Math.max(width, height)
  if (longest > MAX_IMAGE_EDGE) {
    const scale = MAX_IMAGE_EDGE / longest
    width = Math.round(width * scale)
    height = Math.round(height * scale)
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas unavailable')
  ctx.drawImage(img, 0, 0, width, height)

  const blob = await canvasToWebp(canvas)
  return { blob, width, height }
}

function waitForEvent<T extends EventTarget>(
  target: T,
  event: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const onOk = () => {
      cleanup()
      resolve()
    }
    const onErr = () => {
      cleanup()
      reject(new Error(`Media event failed: ${event}`))
    }
    const cleanup = () => {
      target.removeEventListener(event, onOk)
      target.removeEventListener('error', onErr)
    }
    target.addEventListener(event, onOk, { once: true })
    target.addEventListener('error', onErr, { once: true })
  })
}

function pickWebmMime(): string | null {
  const candidates = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
  ]
  if (typeof MediaRecorder === 'undefined') return null
  for (const type of candidates) {
    if (MediaRecorder.isTypeSupported(type)) return type
  }
  return null
}

/** Returns null when the browser cannot re-encode via captureStream (e.g. Safari). */
function tryGetCaptureStream(video: HTMLVideoElement): MediaStream | null {
  const anyVideo = video as HTMLVideoElement & {
    captureStream?: (fps?: number) => MediaStream
    mozCaptureStream?: (fps?: number) => MediaStream
  }
  try {
    return anyVideo.captureStream?.(30) ?? anyVideo.mozCaptureStream?.(30) ?? null
  } catch {
    return null
  }
}

function guessVideoMime(file: File): string {
  if (file.type) return file.type
  const name = file.name.toLowerCase()
  if (name.endsWith('.webm')) return 'video/webm'
  if (name.endsWith('.mov')) return 'video/quicktime'
  if (name.endsWith('.m4v')) return 'video/x-m4v'
  if (name.endsWith('.mkv')) return 'video/x-matroska'
  return 'video/mp4'
}

async function readVideoMeta(file: File): Promise<{
  blob: Blob
  width: number
  height: number
  duration: number
}> {
  const mime = guessVideoMime(file)
  const url = URL.createObjectURL(file)
  const video = document.createElement('video')
  video.preload = 'metadata'
  video.muted = true
  video.playsInline = true
  video.src = url

  try {
    await waitForEvent(video, 'loadedmetadata')
  } catch {
    URL.revokeObjectURL(url)
    // Still store the file — preview <video> can try to play it
    return {
      blob: file.slice(0, file.size, mime),
      width: 0,
      height: 0,
      duration: 0,
    }
  }

  const meta = {
    blob: file.slice(0, file.size, mime),
    width: video.videoWidth,
    height: video.videoHeight,
    duration: Number.isFinite(video.duration) ? video.duration : 0,
  }
  URL.revokeObjectURL(url)
  return meta
}

/**
 * Prefer WebM re-encode when the browser supports captureStream + MediaRecorder.
 * Otherwise keep the original file so CMS/public <video> can play it normally.
 * Never throws for missing captureStream.
 */
export async function convertVideoToWebm(
  file: File,
  onProgress?: (ratio: number) => void,
): Promise<{ blob: Blob; width: number; height: number; duration: number }> {
  // Already WebM — store as-is
  if (file.type === 'video/webm' || file.name.toLowerCase().endsWith('.webm')) {
    return readVideoMeta(file)
  }

  const mimeType = pickWebmMime()
  if (!mimeType) {
    onProgress?.(1)
    return readVideoMeta(file)
  }

  const sourceUrl = URL.createObjectURL(file)
  const video = document.createElement('video')
  video.playsInline = true
  video.muted = true
  video.preload = 'auto'
  video.src = sourceUrl

  try {
    await waitForEvent(video, 'loadedmetadata')
    await waitForEvent(video, 'canplay')
  } catch {
    URL.revokeObjectURL(sourceUrl)
    onProgress?.(1)
    return readVideoMeta(file)
  }

  const width = video.videoWidth
  const height = video.videoHeight
  const duration = Number.isFinite(video.duration) ? video.duration : 0
  if (!width || !height) {
    URL.revokeObjectURL(sourceUrl)
    onProgress?.(1)
    return readVideoMeta(file)
  }

  const stream = tryGetCaptureStream(video)
  if (!stream) {
    URL.revokeObjectURL(sourceUrl)
    onProgress?.(1)
    return readVideoMeta(file)
  }

  try {
    const chunks: BlobPart[] = []
    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 4_000_000,
    })

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data)
    }

    const stopped = new Promise<Blob>((resolve, reject) => {
      recorder.onstop = () => {
        resolve(new Blob(chunks, { type: 'video/webm' }))
      }
      recorder.onerror = () => reject(new Error('WebM recording failed'))
    })

    recorder.start(250)

    video.playbackRate = Math.min(4, Math.max(1, duration > 60 ? 4 : 2))
    try {
      await video.play()
    } catch {
      if (recorder.state !== 'inactive') recorder.stop()
      stream.getTracks().forEach((t) => t.stop())
      URL.revokeObjectURL(sourceUrl)
      onProgress?.(1)
      return readVideoMeta(file)
    }

    await new Promise<void>((resolve, reject) => {
      const onTime = () => {
        if (duration > 0) onProgress?.(Math.min(0.99, video.currentTime / duration))
      }
      const onEnded = () => {
        cleanup()
        resolve()
      }
      const onErr = () => {
        cleanup()
        reject(new Error('Video playback failed during conversion'))
      }
      const cleanup = () => {
        video.removeEventListener('timeupdate', onTime)
        video.removeEventListener('ended', onEnded)
        video.removeEventListener('error', onErr)
      }
      video.addEventListener('timeupdate', onTime)
      video.addEventListener('ended', onEnded)
      video.addEventListener('error', onErr)
    })

    if (recorder.state !== 'inactive') recorder.stop()
    stream.getTracks().forEach((t) => t.stop())
    video.pause()
    URL.revokeObjectURL(sourceUrl)

    const blob = await stopped
    onProgress?.(1)
    if (blob.size < 64) {
      return readVideoMeta(file)
    }
    return { blob, width, height, duration }
  } catch {
    stream.getTracks().forEach((t) => t.stop())
    video.pause()
    URL.revokeObjectURL(sourceUrl)
    onProgress?.(1)
    return readVideoMeta(file)
  }
}

export function isImageFile(file: File) {
  return file.type.startsWith('image/') || /\.(jpe?g|png|gif|webp|avif|bmp|tiff?)$/i.test(file.name)
}

export function isVideoFile(file: File) {
  return file.type.startsWith('video/') || /\.(mp4|mov|webm|mkv|avi|m4v)$/i.test(file.name)
}

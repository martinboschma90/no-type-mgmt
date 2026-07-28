/** Browser-side conversion: images → WebP, video → WebM. */

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

function pickWebmMime(): string {
  const candidates = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
  ]
  for (const type of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) {
      return type
    }
  }
  throw new Error('This browser cannot record WebM video')
}

function getCaptureStream(video: HTMLVideoElement): MediaStream {
  const anyVideo = video as HTMLVideoElement & {
    captureStream?: (fps?: number) => MediaStream
    mozCaptureStream?: (fps?: number) => MediaStream
  }
  const stream = anyVideo.captureStream?.(30) ?? anyVideo.mozCaptureStream?.(30)
  if (!stream) {
    throw new Error('Video captureStream is not supported in this browser')
  }
  return stream
}

export async function convertVideoToWebm(
  file: File,
  onProgress?: (ratio: number) => void,
): Promise<{ blob: Blob; width: number; height: number; duration: number }> {
  // Already WebM — store as-is (normalize mime)
  if (file.type === 'video/webm' || file.name.toLowerCase().endsWith('.webm')) {
    const url = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.muted = true
    video.src = url
    await waitForEvent(video, 'loadedmetadata')
    const meta = {
      blob: file.slice(0, file.size, 'video/webm'),
      width: video.videoWidth,
      height: video.videoHeight,
      duration: Number.isFinite(video.duration) ? video.duration : 0,
    }
    URL.revokeObjectURL(url)
    return meta
  }

  const mimeType = pickWebmMime()
  const sourceUrl = URL.createObjectURL(file)
  const video = document.createElement('video')
  video.playsInline = true
  video.muted = true
  video.preload = 'auto'
  video.src = sourceUrl

  await waitForEvent(video, 'loadedmetadata')
  await waitForEvent(video, 'canplay')

  const width = video.videoWidth
  const height = video.videoHeight
  const duration = Number.isFinite(video.duration) ? video.duration : 0
  if (!width || !height) {
    URL.revokeObjectURL(sourceUrl)
    throw new Error('Could not read video dimensions')
  }

  const stream = getCaptureStream(video)
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

  // Play through for re-encode (playbackRate speeds conversion)
  video.playbackRate = Math.min(4, Math.max(1, duration > 60 ? 4 : 2))
  try {
    await video.play()
  } catch {
    URL.revokeObjectURL(sourceUrl)
    stream.getTracks().forEach((t) => t.stop())
    throw new Error('Could not play video for conversion')
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
  if (blob.size < 64) throw new Error('Converted WebM was empty')
  return { blob, width, height, duration }
}

export function isImageFile(file: File) {
  return file.type.startsWith('image/') || /\.(jpe?g|png|gif|webp|avif|bmp|tiff?)$/i.test(file.name)
}

export function isVideoFile(file: File) {
  return file.type.startsWith('video/') || /\.(mp4|mov|webm|mkv|avi|m4v)$/i.test(file.name)
}

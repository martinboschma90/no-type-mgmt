/** Browser-side conversion: images → WebP, video → WebM when supported. */
import fixWebmDuration from 'fix-webm-duration'

const MAX_IMAGE_EDGE = 2400
export const MAX_LIVE_VIDEO_BYTES = 4 * 1024 * 1024
export const MAX_STORED_VIDEO_BYTES = 50 * 1024 * 1024

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

function tryGetReelCapture(video: HTMLVideoElement): {
  stream: MediaStream
  width: number
  height: number
  stop: () => void
} | null {
  const maxEdge = 960
  const scale = Math.min(
    1,
    maxEdge / Math.max(video.videoWidth, video.videoHeight),
  )
  const width = Math.max(2, Math.round(video.videoWidth * scale))
  const height = Math.max(2, Math.round(video.videoHeight * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d', { alpha: false })
  if (!context || typeof canvas.captureStream !== 'function') return null

  const draw = () => {
    try {
      context.drawImage(video, 0, 0, width, height)
    } catch {
      /* keep the previous valid frame */
    }
  }
  draw()
  const timer = window.setInterval(draw, 1000 / 24)
  const stream = canvas.captureStream(24)

  return {
    stream,
    width,
    height,
    stop: () => {
      window.clearInterval(timer)
    },
  }
}

function waitForVideoFrame(video: HTMLVideoElement): Promise<void> {
  return new Promise((resolve) => {
    if ('requestVideoFrameCallback' in video) {
      video.requestVideoFrameCallback(() => resolve())
      return
    }
    window.setTimeout(resolve, 80)
  })
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
  clip?: { startTime: number; duration: number },
): Promise<{ blob: Blob; width: number; height: number; duration: number }> {
  const originalMeta = !clip ? await readVideoMeta(file) : null

  const maxOutputBytes = clip
    ? MAX_LIVE_VIDEO_BYTES
    : MAX_STORED_VIDEO_BYTES

  // A suitable WebM can be stored directly. Larger WebM and other formats are
  // compressed, bounded to short uploads for stability.
  if (!clip) {
    if (
      (file.type === 'video/webm' ||
        file.name.toLowerCase().endsWith('.webm')) &&
      file.size <= MAX_STORED_VIDEO_BYTES
    ) {
      onProgress?.(1)
      return originalMeta!
    }
    if (!originalMeta?.duration || !Number.isFinite(originalMeta.duration)) {
      throw new Error('De videoduur kon niet worden gelezen.')
    }
  }

  const mimeType = pickWebmMime()
  if (!mimeType) {
    throw new Error('Deze browser ondersteunt geen WebM-opname.')
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
    throw new Error('De video kon niet worden voorbereid.')
  }

  const width = video.videoWidth
  const height = video.videoHeight
  const sourceDuration = Number.isFinite(video.duration) ? video.duration : 0
  const clipStart = clip
    ? Math.min(Math.max(0, clip.startTime), Math.max(0, sourceDuration - 0.1))
    : 0
  const clipEnd = clip
    ? Math.min(sourceDuration, clipStart + Math.max(2, clip.duration))
    : sourceDuration
  const duration = clip ? Math.max(0, clipEnd - clipStart) : sourceDuration
  if (!width || !height) {
    URL.revokeObjectURL(sourceUrl)
    onProgress?.(1)
    throw new Error('De videoresolutie kon niet worden gelezen.')
  }

  if (clipStart > 0) {
    video.currentTime = clipStart
    try {
      await waitForEvent(video, 'seeked')
    } catch {
      URL.revokeObjectURL(sourceUrl)
      throw new Error('Het gekozen videomoment kon niet worden geopend.')
    }
  }

  const reelCapture = clip ? tryGetReelCapture(video) : null
  const stream = reelCapture?.stream ?? tryGetCaptureStream(video)
  const stopCapture = reelCapture?.stop ?? (() => {})
  const outputWidth = reelCapture?.width ?? width
  const outputHeight = reelCapture?.height ?? height
  if (!stream) {
    URL.revokeObjectURL(sourceUrl)
    onProgress?.(1)
    if (clip) {
      throw new Error('Videofragmenten maken wordt niet ondersteund in deze browser.')
    }
    throw new Error('Deze browser kan de video niet veilig naar WebM omzetten.')
  }

  try {
    const chunks: BlobPart[] = []
    const audioBitsPerSecond = clip ? 64_000 : 128_000
    const storedTargetBytes = 45 * 1024 * 1024
    const storedVideoBitsPerSecond = Math.max(
      80_000,
      Math.min(
        4_000_000,
        Math.floor(
          (storedTargetBytes * 8) / Math.max(duration, 1) -
            audioBitsPerSecond,
        ),
      ),
    )
    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: clip ? 650_000 : storedVideoBitsPerSecond,
      audioBitsPerSecond,
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

    video.playbackRate = 1
    try {
      await video.play()
      await waitForVideoFrame(video)
      recorder.start(250)
    } catch {
      if (recorder.state !== 'inactive') recorder.stop()
      stopCapture()
      stream.getTracks().forEach((t) => t.stop())
      URL.revokeObjectURL(sourceUrl)
      onProgress?.(1)
      if (!clip) throw new Error('De video kon niet worden afgespeeld voor omzetting.')
      throw new Error('Het gekozen videofragment kon niet worden afgespeeld.')
    }

    await new Promise<void>((resolve, reject) => {
      const onTime = () => {
        if (duration > 0) {
          onProgress?.(
            Math.min(0.99, (video.currentTime - clipStart) / duration),
          )
        }
        if (clip && video.currentTime >= clipEnd) {
          cleanup()
          resolve()
        }
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
    stopCapture()
    stream.getTracks().forEach((t) => t.stop())
    video.pause()
    URL.revokeObjectURL(sourceUrl)

    const recordedBlob = await stopped
    const blob = await fixWebmDuration(
      recordedBlob,
      Math.max(1, duration) * 1000,
      { logger: false },
    )
    onProgress?.(1)
    if (blob.size < 64) {
      throw new Error('De WebM-omzetting leverde geen geldige video op.')
    }
    if (blob.size > maxOutputBytes) {
      throw new Error(
        clip
          ? 'Het live fragment is nog groter dan 4 MB. Kies een korter fragment.'
          : 'De gecomprimeerde video is nog groter dan 50 MB.',
      )
    }
    return { blob, width: outputWidth, height: outputHeight, duration }
  } catch (error) {
    stopCapture()
    stream.getTracks().forEach((t) => t.stop())
    video.pause()
    URL.revokeObjectURL(sourceUrl)
    onProgress?.(1)
    if (error instanceof Error) throw error
    throw new Error(
      clip
        ? 'Het videofragment kon niet worden gemaakt.'
        : 'De video kon niet veilig naar WebM worden omgezet.',
    )
  }
}

export function isImageFile(file: File) {
  return file.type.startsWith('image/') || /\.(jpe?g|png|gif|webp|avif|bmp|tiff?)$/i.test(file.name)
}

export function isVideoFile(file: File) {
  return file.type.startsWith('video/') || /\.(mp4|mov|webm|mkv|avi|m4v)$/i.test(file.name)
}

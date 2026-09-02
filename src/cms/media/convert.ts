/** Browser-side conversion: images → WebP, stored video → WebM, live clips → H.264 MP4. */
import { ArrayBufferTarget, Muxer } from 'mp4-muxer'
import fixWebmDuration from 'fix-webm-duration'
import {
  MAX_LIVE_VIDEO_BYTES,
  MAX_STORED_VIDEO_BYTES,
  liveClipTooLargeMessage,
} from '@/cms/media/videoLimits'

export { MAX_LIVE_VIDEO_BYTES, MAX_STORED_VIDEO_BYTES }

const CLIP_MAX_EDGE = 1920
const CLIP_FRAME_RATE = 30

const MAX_IMAGE_EDGE = 2400
const CONVERT_TIMEOUT_MS = 120_000
const CLIP_TIMEOUT_MS = 90_000

let mediaJobChain: Promise<unknown> = Promise.resolve()

function withTimeout<T>(job: Promise<T>, timeoutMs: number, message: string) {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error(message))
    }, timeoutMs)
    job.then(
      (value) => {
        window.clearTimeout(timer)
        resolve(value)
      },
      (error) => {
        window.clearTimeout(timer)
        reject(error)
      },
    )
  })
}

export function enqueueMediaJob<T>(
  job: () => Promise<T>,
  timeoutMs = CONVERT_TIMEOUT_MS,
  timeoutMessage = 'Video verwerken duurde te lang. Probeer een korter bestand.',
) {
  const run = mediaJobChain.then(
    () => withTimeout(job(), timeoutMs, timeoutMessage),
    () => withTimeout(job(), timeoutMs, timeoutMessage),
  )
  mediaJobChain = run.then(
    () => undefined,
    () => undefined,
  )
  return run
}

export const CLIP_JOB_TIMEOUT_MS = CLIP_TIMEOUT_MS

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

function pickRecorderMime(candidates: string[]): string | null {
  if (typeof MediaRecorder === 'undefined') return null
  for (const type of candidates) {
    if (MediaRecorder.isTypeSupported(type)) return type
  }
  return null
}

function pickWebmMime(): string | null {
  return pickRecorderMime([
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
  ])
}

function pickClipRecorderMime(): string | null {
  return pickRecorderMime([
    'video/mp4;codecs=avc1.42E01E',
    'video/mp4;codecs=avc1.4D401F',
    'video/mp4',
  ])
}

function evenDim(value: number) {
  const rounded = Math.max(2, Math.round(value))
  return rounded % 2 === 0 ? rounded : rounded - 1
}

function clipVideoBitsPerSecond(duration: number) {
  const liveTargetBytes = 6.5 * 1024 * 1024
  return Math.max(
    1_500_000,
    Math.min(5_000_000, Math.floor((liveTargetBytes * 8) / Math.max(duration, 1))),
  )
}

function clipScaleForVideo(videoWidth: number, videoHeight: number) {
  const scale = Math.min(
    1,
    CLIP_MAX_EDGE / Math.max(videoWidth, videoHeight),
  )
  return {
    width: evenDim(videoWidth * scale),
    height: evenDim(videoHeight * scale),
  }
}

async function encodeClipToAvcMp4(
  video: HTMLVideoElement,
  options: {
    clipStart: number
    clipEnd: number
    duration: number
    onProgress?: (ratio: number) => void
  },
): Promise<{ blob: Blob; width: number; height: number; duration: number } | null> {
  if (typeof VideoEncoder === 'undefined' || typeof VideoFrame === 'undefined') {
    return null
  }

  const { width, height } = clipScaleForVideo(
    video.videoWidth,
    video.videoHeight,
  )
  const bitrate = clipVideoBitsPerSecond(options.duration)
  const codecCandidates = ['avc1.4D401F', 'avc1.42001F'] as const
  let codec: (typeof codecCandidates)[number] | null = null

  try {
    for (const candidate of codecCandidates) {
      const support = await VideoEncoder.isConfigSupported({
        codec: candidate,
        width,
        height,
        bitrate,
        framerate: CLIP_FRAME_RATE,
        avc: { format: 'avc' },
      })
      if (support.supported) {
        codec = candidate
        break
      }
    }
    if (!codec) return null
  } catch {
    return null
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { alpha: false })
  if (!ctx) return null

  const target = new ArrayBufferTarget()
  const muxer = new Muxer({
    target,
    video: { codec: 'avc', width, height, frameRate: CLIP_FRAME_RATE },
    fastStart: 'in-memory',
    firstTimestampBehavior: 'offset',
  })

  let encodeError: Error | null = null
  const encoder = new VideoEncoder({
    output: (chunk, meta) => {
      try {
        muxer.addVideoChunk(chunk, meta)
      } catch (error) {
        encodeError = error instanceof Error ? error : new Error('MP4 mux failed')
      }
    },
    error: (error) => {
      encodeError = error
    },
  })

  try {
    encoder.configure({
      codec,
      width,
      height,
      bitrate,
      framerate: CLIP_FRAME_RATE,
      latencyMode: 'quality',
      avc: { format: 'avc' },
    })
  } catch {
    try {
      encoder.close()
    } catch {
      /* ignore */
    }
    return null
  }

  try {
    video.playbackRate = 1
    await video.play()
    await waitForVideoFrame(video)

    let frameIndex = 0
    await new Promise<void>((resolve, reject) => {
      let settled = false
      const finish = () => {
        if (settled) return
        settled = true
        resolve()
      }
      const fail = (error: unknown) => {
        if (settled) return
        settled = true
        reject(error instanceof Error ? error : new Error('Clip encode failed'))
      }

      const tick = () => {
        if (encodeError) {
          fail(encodeError)
          return
        }
        if (video.currentTime >= options.clipEnd - 0.02 || video.ended) {
          finish()
          return
        }
        try {
          ctx.drawImage(video, 0, 0, width, height)
          const timestamp = Math.round(
            (video.currentTime - options.clipStart) * 1_000_000,
          )
          const frame = new VideoFrame(canvas, {
            timestamp: Math.max(0, timestamp),
            duration: Math.round(1_000_000 / CLIP_FRAME_RATE),
          })
          encoder.encode(frame, {
            keyFrame: frameIndex % CLIP_FRAME_RATE === 0,
          })
          frame.close()
          frameIndex += 1
        } catch (error) {
          fail(error)
          return
        }
        options.onProgress?.(
          Math.min(
            0.99,
            (video.currentTime - options.clipStart) /
              Math.max(options.duration, 0.01),
          ),
        )
        if ('requestVideoFrameCallback' in video) {
          video.requestVideoFrameCallback(tick)
        } else {
          requestAnimationFrame(tick)
        }
      }

      if ('requestVideoFrameCallback' in video) {
        video.requestVideoFrameCallback(tick)
      } else {
        requestAnimationFrame(tick)
      }
    })

    video.pause()
    await encoder.flush()
    encoder.close()
    muxer.finalize()

    const buffer = target.buffer
    if (!buffer || buffer.byteLength < 64) return null
    const blob = new Blob([buffer], { type: 'video/mp4' })
    if (blob.size > MAX_LIVE_VIDEO_BYTES) {
      throw new Error(liveClipTooLargeMessage())
    }
    return { blob, width, height, duration: options.duration }
  } catch (error) {
    try {
      if (encoder.state !== 'closed') encoder.close()
    } catch {
      /* ignore */
    }
    video.pause()
    if (
      error instanceof Error &&
      error.message.includes('groter dan')
    ) {
      throw error
    }
    return null
  }
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
  const { width, height } = clipScaleForVideo(
    video.videoWidth,
    video.videoHeight,
  )
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
  const timer = window.setInterval(draw, 1000 / CLIP_FRAME_RATE)
  const stream = canvas.captureStream(CLIP_FRAME_RATE)

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
 * Stored uploads: WebM when captureStream + MediaRecorder work.
 * Live clips: H.264 MP4 via WebCodecs, then MediaRecorder MP4/WebM.
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

  if (clip) {
    try {
      const mp4 = await encodeClipToAvcMp4(video, {
        clipStart,
        clipEnd,
        duration,
        onProgress,
      })
      if (mp4) {
        URL.revokeObjectURL(sourceUrl)
        onProgress?.(1)
        return mp4
      }
    } catch (error) {
      URL.revokeObjectURL(sourceUrl)
      onProgress?.(1)
      throw error
    }
    video.currentTime = clipStart
    try {
      await waitForEvent(video, 'seeked')
    } catch {
      /* recorder path can still start from the current frame */
    }
  }

  const mimeType = clip ? pickClipRecorderMime() : pickWebmMime()
  if (!mimeType) {
    URL.revokeObjectURL(sourceUrl)
    onProgress?.(1)
    throw new Error(
      clip
        ? 'Fragment als MP4 maken lukt niet in deze browser. Gebruik Chrome of Edge.'
        : 'Deze browser ondersteunt geen WebM-opname.',
    )
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
      throw new Error(
        'Fragment als MP4 maken lukt niet in deze browser. Gebruik Chrome of Edge.',
      )
    }
    throw new Error('Deze browser kan de video niet veilig naar WebM omzetten.')
  }

  const recorderMime = mimeType.includes('mp4') ? 'video/mp4' : 'video/webm'

  try {
    const chunks: BlobPart[] = []
    const audioBitsPerSecond = clip ? 0 : 128_000
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
      videoBitsPerSecond: clip
        ? clipVideoBitsPerSecond(duration)
        : storedVideoBitsPerSecond,
      audioBitsPerSecond,
    })

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data)
    }

    const stopped = new Promise<Blob>((resolve, reject) => {
      recorder.onstop = () => {
        resolve(new Blob(chunks, { type: recorderMime }))
      }
      recorder.onerror = () => reject(new Error('Video recording failed'))
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
    const blob =
      recorderMime === 'video/webm'
        ? await fixWebmDuration(
            recordedBlob,
            Math.max(1, duration) * 1000,
            { logger: false },
          )
        : recordedBlob
    onProgress?.(1)
    if (blob.size < 64) {
      throw new Error('De video-omzetting leverde geen geldige video op.')
    }
    if (blob.size > maxOutputBytes) {
      throw new Error(
        clip
          ? liveClipTooLargeMessage()
          : 'De gecomprimeerde video is nog groter dan 50 MB.',
      )
    }
    if (clip && !blob.type.includes('mp4')) {
      throw new Error(
        'Fragment als MP4 maken lukt niet in deze browser. Gebruik Chrome of Edge.',
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

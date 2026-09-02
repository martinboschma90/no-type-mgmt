/** Public artist-page clips. Quality over tiny files: ~1080-tall 9:16 at a few Mbps. */
export const MAX_LIVE_VIDEO_BYTES = 8 * 1024 * 1024
/** Source files stored in the media library. */
export const MAX_STORED_VIDEO_BYTES = 50 * 1024 * 1024

export function liveVideoMaxMegabytes() {
  return Math.round(MAX_LIVE_VIDEO_BYTES / (1024 * 1024))
}

export function liveClipTooLargeMessage() {
  return `Het live fragment is nog groter dan ${liveVideoMaxMegabytes()} MB. Kies een korter fragment.`
}

export function isLiveVideoSizeAllowed(bytes: number) {
  return Number.isFinite(bytes) && bytes > 0 && bytes <= MAX_LIVE_VIDEO_BYTES
}

/** Public artist-page clips must stay this small. */
export const MAX_LIVE_VIDEO_BYTES = 2 * 1024 * 1024
/** Source files stored in the media library. */
export const MAX_STORED_VIDEO_BYTES = 50 * 1024 * 1024

export function isLiveVideoSizeAllowed(bytes: number) {
  return Number.isFinite(bytes) && bytes > 0 && bytes <= MAX_LIVE_VIDEO_BYTES
}

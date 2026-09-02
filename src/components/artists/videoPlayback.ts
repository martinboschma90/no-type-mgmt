const MAX_PLAYING = 6
const playingVideos = new Set<HTMLVideoElement>()

export function pauseVideo(element: HTMLVideoElement) {
  playingVideos.delete(element)
  element.pause()
}

export function releaseVideo(element: HTMLVideoElement) {
  pauseVideo(element)
}

export function requestPlay(element: HTMLVideoElement) {
  if (playingVideos.size >= MAX_PLAYING && !playingVideos.has(element)) {
    const oldest = playingVideos.values().next().value
    if (oldest && oldest !== element) pauseVideo(oldest)
  }
  playingVideos.add(element)
  void element.play().catch(() => {
    playingVideos.delete(element)
  })
}

export function releaseAllPlayingVideos() {
  for (const element of playingVideos) {
    element.pause()
  }
  playingVideos.clear()
}

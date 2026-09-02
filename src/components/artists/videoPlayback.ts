const playingVideos = new Set<HTMLVideoElement>()

export function bindMobilePlayback(element: HTMLVideoElement) {
  element.muted = true
  element.defaultMuted = true
  element.volume = 0
  element.playsInline = true
  element.setAttribute('muted', '')
  element.setAttribute('playsinline', '')
  element.setAttribute('webkit-playsinline', '')
}

export function pauseVideo(element: HTMLVideoElement) {
  playingVideos.delete(element)
  element.pause()
}

export function releaseVideo(element: HTMLVideoElement) {
  pauseVideo(element)
}

export function requestPlay(element: HTMLVideoElement) {
  bindMobilePlayback(element)
  playingVideos.add(element)
  void element.play().then(
    () => {
      playingVideos.add(element)
    },
    () => {
      window.setTimeout(() => {
        bindMobilePlayback(element)
        void element.play().then(
          () => playingVideos.add(element),
          () => playingVideos.delete(element),
        )
      }, 180)
    },
  )
}

export function releaseAllPlayingVideos() {
  for (const element of playingVideos) {
    element.pause()
  }
  playingVideos.clear()
}

export function mediaLooksWebm(url: string | undefined | null) {
  if (!url) return false
  return /\.webm(\?|#|$)/i.test(url) || /\/webm/i.test(url)
}

export function browserCanPlayWebm() {
  if (typeof document === 'undefined') return true
  const probe = document.createElement('video')
  return (
    probe.canPlayType('video/webm; codecs="vp8"') !== '' ||
    probe.canPlayType('video/webm; codecs="vp9"') !== '' ||
    probe.canPlayType('video/webm') === 'probably'
  )
}

export function guessVideoSourceType(url: string) {
  if (/\.mp4(\?|#|$)/i.test(url) || /\.m4v(\?|#|$)/i.test(url)) return 'video/mp4'
  if (/\.webm(\?|#|$)/i.test(url)) return 'video/webm'
  if (/\.mov(\?|#|$)/i.test(url)) return 'video/quicktime'
  return undefined
}

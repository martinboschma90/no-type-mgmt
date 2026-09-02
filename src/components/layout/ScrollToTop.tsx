import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { releaseAllPlayingVideos } from '@/components/artists/videoPlayback'

/** Reset scroll on route change; honour hash targets when present. */
export function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    releaseAllPlayingVideos()
    if (hash) {
      const id = decodeURIComponent(hash.replace(/^#/, ''))
      const scrollToHash = () => {
        const el = document.getElementById(id)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' })
          return true
        }
        return false
      }
      if (!scrollToHash()) {
        const t = window.setTimeout(scrollToHash, 120)
        return () => window.clearTimeout(t)
      }
      return
    }
    window.scrollTo(0, 0)
  }, [pathname, hash])

  return null
}

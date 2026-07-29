import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { Artist } from '@/types/artist'
import { useResolvedMediaUrl } from '@/cms/media/useResolvedMediaUrl'

type ArtistVideoSlideProps = {
  artist: Artist
  /** Show CMS empty-state when no video is linked yet */
  showEmptyState?: boolean
  /** CMS live preview — normal <video> playback, no captureStream */
  previewMode?: boolean
}

/**
 * Centered cinematic video slide on the artist page.
 * Renders nothing only when empty and empty-state is disabled (public default).
 */
export function ArtistVideoSlide({
  artist,
  showEmptyState = false,
  previewMode = false,
}: ArtistVideoSlideProps) {
  const videoUrl = useResolvedMediaUrl(artist.videoUrl)
  const posterUrl = useResolvedMediaUrl(artist.imageUrl)

  if (!videoUrl && !showEmptyState) return null

  return (
    <section
      className="px-4 py-10 sm:px-6 sm:py-14 lg:px-8"
      aria-label={`${artist.name} video`}
    >
      <motion.div
        className="mx-auto max-w-[1100px]"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="type-label mb-4 text-center text-ink/40">Video</p>
        <div className="overflow-hidden rounded-[1.75rem] bg-[#090909] shadow-[0_0_60px_rgba(88,40,120,0.12)]">
          <div className="relative aspect-video w-full">
            {videoUrl ? (
              <video
                key={videoUrl}
                src={videoUrl}
                poster={posterUrl || undefined}
                className="absolute inset-0 h-full w-full object-cover"
                controls
                playsInline
                preload="metadata"
                // CMS preview: autoplay muted loop. Public page: controls only.
                {...(previewMode
                  ? { autoPlay: true, muted: true, loop: true }
                  : {})}
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#151217] px-6 text-center">
                <p className="type-headline text-sm text-[#F5F5F5]/80">
                  Video slide
                </p>
                <p className="type-body max-w-sm text-xs text-[#F5F5F5]/45">
                  Nog geen video voor {artist.name}. Upload er een in het CMS → Media.
                </p>
                {showEmptyState ? (
                  <Link
                    to={`/cms/artists/${artist.slug}`}
                    className="type-ui mt-1 rounded-full border border-[#D8FF3E]/40 bg-[#D8FF3E]/15 px-4 py-2 text-[0.65rem] text-[#D8FF3E]"
                  >
                    Video uploaden →
                  </Link>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </section>
  )
}

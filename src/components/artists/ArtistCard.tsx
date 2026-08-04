import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { Artist } from '@/types/artist'
import { useCms } from '@/cms/CmsProvider'
import { portraitImageStyle } from '@/cms/imageFocus'
import { useArtistImageUrl } from '@/cms/media/useArtistImageUrl'
import { rosterGlowGradient } from '@/cms/rosterGlow'
import { OptimizedImg } from '@/components/ui/OptimizedImg'
import type { CSSProperties } from 'react'

type ArtistCardProps = {
  artist: Artist
  index?: number
}

/**
 * Superform-style roster card:
 * readable name always on → hover glow + name lift + More → CTA.
 */
export function ArtistCard({ artist, index = 0 }: ArtistCardProps) {
  const { content } = useCms()
  const imageUrl = useArtistImageUrl(artist)
  const frame = portraitImageStyle(artist)
  const glowStyle = {
    ['--artist-card-glow' as string]: rosterGlowGradient(
      content.site.rosterGlowPreset,
      content.site.rosterGlowCustom,
    ),
    aspectRatio: '3 / 4',
  } as CSSProperties

  return (
    <motion.div
      className="min-w-0 w-full"
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{
        duration: 0.45,
        delay: Math.min(index * 0.04, 0.35),
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <Link
        to={`/artists/${artist.slug}`}
        className="artist-card group relative isolate block w-full overflow-hidden rounded-[1.5rem] bg-[#151217] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        style={glowStyle}
      >
        {/* Media */}
        {imageUrl ? (
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 origin-center transition-transform duration-[600ms] ease-out will-change-transform group-hover:scale-[1.04]">
              <OptimizedImg
                src={imageUrl}
                alt={artist.imageAlt}
                className="artist-card__img absolute"
                style={frame}
                size="card"
                srcSetSizes={['card', 'hero']}
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                loading="lazy"
                fetchPriority="low"
                decoding="async"
                draggable={false}
              />
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 bg-ink/10" aria-hidden />
        )}

        {/* Dark base wash — always on so names stay readable on light photos */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[58%]"
          style={{
            background:
              'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.45) 40%, rgba(0,0,0,0.12) 70%, transparent 100%)',
          }}
          aria-hidden
        />

        {/* Animated multicolor glow — Superform-style, fades in on hover */}
        <div className="artist-card__glow" aria-hidden />

        {/* Name always visible; lifts on hover; More → slides in above */}
        <div className="absolute inset-x-0 bottom-0 z-[2] flex flex-col items-start gap-2.5 px-4 pb-4 sm:px-5 sm:pb-5">
          <span className="type-ui inline-flex translate-y-3 items-center rounded-full bg-brand px-3 py-1.5 text-[0.7rem] tracking-[0.06em] text-[#111111] opacity-0 transition-[opacity,transform] duration-[350ms] ease-out group-hover:translate-y-0 group-hover:opacity-100 group-hover:delay-100">
            More →
          </span>
          <h3 className="type-headline relative z-[1] max-w-[95%] text-left text-[clamp(1.25rem,2.6vw,1.8rem)] leading-[0.94] tracking-[-0.03em] text-white uppercase drop-shadow-[0_3px_18px_rgba(0,0,0,0.75)] transition-transform duration-[350ms] ease-out will-change-transform group-hover:-translate-y-1.5">
            {artist.name}
          </h3>
        </div>
      </Link>
    </motion.div>
  )
}

import { motion } from 'framer-motion'
import { PillButton } from '@/components/ui/PillButton'
import { SocialLinks } from '@/components/artists/SocialLinks'
import type { Artist } from '@/types/artist'
import { useCms } from '@/cms/CmsContext'
import { artistGenres } from '@/cms/artistGenres'
import { portraitImageStyle } from '@/cms/imageFocus'
import { useArtistImageUrl } from '@/cms/media/useArtistImageUrl'
import { OptimizedImg } from '@/components/ui/OptimizedImg'
import {
  artistBookingWhatsAppMessage,
  buildWhatsAppUrl,
  DEFAULT_WHATSAPP_NUMBER,
} from '@/data/whatsapp'

type ArtistHeroProps = {
  artist: Artist
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
      <path d="M12.04 2c-5.5 0-9.96 4.43-9.96 9.9 0 1.75.46 3.45 1.34 4.95L2 22l5.3-1.39a10 10 0 0 0 4.74 1.2h.01c5.5 0 9.96-4.43 9.96-9.9C22.01 6.43 17.54 2 12.04 2Zm5.8 14.15c-.24.68-1.4 1.25-1.93 1.33-.5.07-1.13.1-1.82-.11-.42-.13-.96-.31-1.65-.61-2.9-1.26-4.79-4.2-4.93-4.4-.14-.2-1.14-1.52-1.14-2.9 0-1.38.72-2.06.98-2.34.26-.28.57-.35.76-.35h.54c.17 0 .4-.07.63.48.24.56.81 1.94.88 2.08.07.14.12.3.02.49-.1.19-.14.3-.28.47-.14.16-.3.36-.42.49-.14.14-.28.29-.12.56.16.28.7 1.15 1.5 1.86 1.03.92 1.9 1.2 2.17 1.34.28.14.44.12.6-.07.16-.19.7-.81.89-1.09.19-.28.37-.23.63-.14.26.1 1.64.77 1.92.91.28.14.47.21.54.33.07.12.07.68-.17 1.36Z" />
    </svg>
  )
}

export function ArtistHero({ artist }: ArtistHeroProps) {
  const { content } = useCms()
  const imageUrl = useArtistImageUrl(artist)
  const frame = portraitImageStyle(artist)
  const bookingHref = `/booking?artist=${encodeURIComponent(artist.slug)}`
  const presskitHref = artist.presskitUrl?.trim() || ''
  const hasPresskit = Boolean(presskitHref && presskitHref !== '#')
  const whatsappNumber =
    content.site.whatsappNumber?.trim() || DEFAULT_WHATSAPP_NUMBER
  const whatsappHref = buildWhatsAppUrl(
    whatsappNumber,
    artistBookingWhatsAppMessage(artist.name),
  )

  return (
    <section className="px-4 pb-8 pt-20 sm:px-6 sm:pt-24 lg:px-8 lg:pb-12">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 items-start gap-5 sm:gap-8 lg:grid-cols-12 lg:gap-10">
        <motion.div
          className="relative w-full lg:col-span-5"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <div
            className="relative w-full overflow-hidden rounded-[1.5rem] bg-card sm:rounded-[2rem]"
            style={{ aspectRatio: '3 / 4' }}
          >
            {imageUrl ? (
              <OptimizedImg
                src={imageUrl}
                alt={artist.imageAlt}
                className="absolute object-cover"
                style={frame}
                size="hero"
                srcSetSizes={['card', 'hero', 'full']}
                sizes="(max-width: 1024px) 92vw, 42vw"
                loading="eager"
                fetchPriority="high"
                decoding="async"
                draggable={false}
              />
            ) : null}
          </div>
        </motion.div>

        <div className="relative lg:col-span-7 lg:pt-10">
          <motion.h1
            className="type-display text-[clamp(2.5rem,11vw,5.75rem)] text-ink"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.45 }}
          >
            {artist.name}
          </motion.h1>

          {artistGenres(artist).length > 0 && (
            <motion.div
              className="mt-3 flex flex-wrap gap-2 sm:mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
            >
              {artistGenres(artist).map((genre) => (
                <span
                  key={genre}
                  className="type-ui inline-flex rounded-full border border-ink/70 px-3.5 py-1.5 text-[0.65rem] tracking-[0.1em] text-ink uppercase"
                >
                  {genre}
                </span>
              ))}
            </motion.div>
          )}

          {artist.socials && (
            <motion.div
              className="mt-4 sm:mt-5"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <SocialLinks links={artist.socials} />
            </motion.div>
          )}

          {artist.bio && (
            <motion.p
              className="type-body mt-5 max-w-xl text-[0.95rem] text-ink/80 line-clamp-5 sm:mt-8 sm:text-base lg:line-clamp-none"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28, duration: 0.45 }}
            >
              {artist.bio}
            </motion.p>
          )}

          <motion.div
            className="mt-6 sm:mt-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.4 }}
          >
            <div className="flex flex-wrap items-center gap-2.5">
              <PillButton href={bookingHref}>Book now</PillButton>
              <PillButton
                href={whatsappHref}
                variant="ghost"
                target="_blank"
                rel="noreferrer"
              >
                <WhatsAppIcon />
                WhatsApp
              </PillButton>
              {hasPresskit ? (
                <PillButton
                  href={presskitHref}
                  variant="ghost"
                  target="_blank"
                  rel="noreferrer"
                  className="hidden lg:inline-flex"
                >
                  Presskit
                </PillButton>
              ) : null}
            </div>

            {hasPresskit ? (
              <a
                href={presskitHref}
                target="_blank"
                rel="noreferrer"
                className="type-label mt-4 inline-flex items-center gap-1 text-[0.65rem] tracking-[0.14em] text-ink/55 uppercase transition-colors hover:text-ink lg:hidden"
              >
                Download Press Kit
                <span aria-hidden>→</span>
              </a>
            ) : null}
          </motion.div>
        </div>
      </div>
    </section>
  )
}

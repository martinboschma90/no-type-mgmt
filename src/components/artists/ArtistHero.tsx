import { motion } from 'framer-motion'
import { PillButton } from '@/components/ui/PillButton'
import { SocialLinks } from '@/components/artists/SocialLinks'
import type { Artist } from '@/types/artist'
import { useCms } from '@/cms/CmsProvider'
import { portraitImageStyle } from '@/cms/imageFocus'
import { useArtistImageUrl } from '@/cms/media/useArtistImageUrl'

type ArtistHeroProps = {
  artist: Artist
}

export function ArtistHero({ artist }: ArtistHeroProps) {
  const { content } = useCms()
  const bookingMail = content.site.contact[0]?.email ?? 'bookings@notype.be'
  const imageUrl = useArtistImageUrl(artist)
  const frame = portraitImageStyle(artist)

  return (
    <section className="px-4 pb-8 pt-20 sm:px-6 sm:pt-24 lg:px-8 lg:pb-12">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-10">
        <motion.div
          className="relative lg:col-span-5"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <div
            className="relative w-full overflow-hidden rounded-[2rem] bg-card"
            style={{ aspectRatio: '3 / 4' }}
          >
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={artist.imageAlt}
                className="absolute object-cover"
                style={frame}
                draggable={false}
              />
            ) : null}
          </div>
        </motion.div>

        <div className="relative lg:col-span-7">
          {artist.socials && (
            <div className="mb-6 flex justify-start lg:absolute lg:right-0 lg:top-0 lg:mb-0 lg:justify-end">
              <SocialLinks links={artist.socials} />
            </div>
          )}

          <div className="relative pt-6 lg:pt-10">
            <motion.h1
              className="type-display text-[clamp(2.75rem,8vw,5.75rem)] text-ink"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.45 }}
            >
              {artist.name}
            </motion.h1>

            {artist.genre && (
              <motion.p
                className="type-label mt-3 text-ink/50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {artist.genre}
              </motion.p>
            )}

            <motion.div
              className="mt-5 flex flex-wrap gap-2.5"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <PillButton href={`mailto:${bookingMail}?subject=Booking%20${encodeURIComponent(artist.name)}`}>
                Book now
              </PillButton>
              <PillButton href={artist.presskitUrl ?? '#'} variant="solid">
                Presskit
              </PillButton>
            </motion.div>

            {artist.bio && (
              <motion.p
                className="type-body mt-8 max-w-xl text-[0.95rem] text-ink/80 sm:text-base"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
              >
                {artist.bio}
              </motion.p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, type PanInfo } from 'framer-motion'
import {
  instagramPostsFromArtist,
  resolveInstagramProfileUrl,
  type InstagramEmbed,
} from '@/cms/artistInstagram'
import type { Artist } from '@/types/artist'

const CINEMA_EASE = [0.22, 1, 0.36, 1] as const
const CINEMA_DURATION = 0.85
const DRAG_THRESHOLD = 64

type ArtistInstagramCarouselProps = {
  artist: Artist
  showEmptyState?: boolean
}

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

function InstagramSlide({
  post,
  active,
}: {
  post: InstagramEmbed
  active: boolean
}) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-[#0a090c]">
      {active ? (
        <iframe
          title="Instagram post"
          src={post.embedSrc}
          className="absolute inset-0 h-full w-full border-0 pointer-events-none"
          loading="lazy"
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <div className="absolute inset-0 bg-[#121014]" aria-hidden />
      )}
    </div>
  )
}

export function ArtistInstagramCarousel({
  artist,
  showEmptyState = false,
}: ArtistInstagramCarouselProps) {
  const posts = instagramPostsFromArtist(artist.instagramFeed)
  const profileUrl = resolveInstagramProfileUrl(artist)
  const [index, setIndex] = useState(0)
  const [hovered, setHovered] = useState(false)
  const count = posts.length

  const goTo = useCallback(
    (next: number) => {
      if (count === 0) return
      setIndex(Math.max(0, Math.min(count - 1, next)))
    },
    [count],
  )

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const { offset, velocity } = info
    const swipe =
      Math.abs(offset.x) > DRAG_THRESHOLD || Math.abs(velocity.x) > 420
    if (!swipe) return
    if (offset.x < 0 || velocity.x < -420) goTo(index + 1)
    else goTo(index - 1)
  }

  if (count === 0) {
    if (!showEmptyState) return null
    return (
      <section
        className="px-4 py-12 sm:px-6 sm:py-16 lg:px-8"
        aria-label={`${artist.name} Instagram`}
      >
        <div className="mx-auto max-w-[480px] text-center">
          <p className="type-label mb-5 text-[0.65rem] tracking-[0.22em] text-ink/40 uppercase">
            Instagram
          </p>
          <div className="mx-auto aspect-square max-w-[340px] overflow-hidden rounded-[1.5rem] border border-white/8 bg-[#121014]">
            <div className="flex h-full flex-col items-center justify-center gap-3 px-6">
              <p className="type-headline text-sm text-[#F5F5F5]/75">
                Instagram feed
              </p>
              <p className="type-body max-w-sm text-xs text-[#F5F5F5]/40">
                Koppel tot 6 post- of reel-links in het CMS.
              </p>
              <Link
                to={`/cms/artists/${artist.slug}`}
                className="type-ui mt-1 rounded-full border border-[#D8FF3E]/35 bg-[#D8FF3E]/12 px-4 py-2 text-[0.65rem] text-[#D8FF3E] transition-opacity hover:opacity-80"
              >
                Links toevoegen →
              </Link>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section
      className="px-4 py-12 sm:px-6 sm:py-16 lg:px-8"
      aria-label={`${artist.name} Instagram`}
    >
      <motion.div
        className="mx-auto max-w-[640px]"
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.12 }}
        transition={{ duration: 0.8, ease: CINEMA_EASE }}
      >
        <div className="mb-6 flex items-end justify-between gap-4 px-1 sm:mb-8">
          <div>
            <p className="type-label text-[0.65rem] tracking-[0.22em] text-ink/40 uppercase">
              Instagram
            </p>
            {profileUrl ? (
              <a
                href={profileUrl}
                target="_blank"
                rel="noreferrer"
                className="type-ui mt-1 inline-block text-[0.7rem] tracking-[0.08em] text-ink/55 transition-colors hover:text-[#D8FF3E]"
              >
                View profile →
              </a>
            ) : null}
          </div>
          {count > 1 ? (
            <p
              className="type-label text-[0.7rem] tracking-[0.2em] text-ink/55 tabular-nums uppercase"
              aria-live="polite"
            >
              <span className="text-ink">{pad2(index + 1)}</span>
              <span className="text-ink/25"> / </span>
              <span className="text-ink/40">{pad2(count)}</span>
            </p>
          ) : null}
        </div>

        <div
          className="relative mx-auto w-full max-w-[420px] touch-pan-y"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <div className="relative mx-auto aspect-[4/5] max-h-[min(72vh,620px)] w-[min(100%,360px)]">
            {posts.map((post, i) => {
              const offset = i - index
              const abs = Math.abs(offset)
              if (abs > 2) return null
              const isActive = offset === 0
              const peekX = offset * (hovered ? 58 : 48)

              return (
                <motion.div
                  key={post.permalink}
                  className={[
                    'absolute inset-0 origin-center overflow-hidden rounded-[1.5rem]',
                    isActive
                      ? 'cursor-grab active:cursor-grabbing'
                      : 'pointer-events-none',
                  ].join(' ')}
                  style={{
                    zIndex: 30 - abs,
                    boxShadow: isActive
                      ? '0 28px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06)'
                      : '0 16px 40px rgba(0,0,0,0.35)',
                  }}
                  initial={false}
                  animate={{
                    x: isActive ? 0 : peekX,
                    scale: isActive ? 1.02 : abs === 1 ? 0.88 : 0.8,
                    opacity: isActive ? 1 : abs === 1 ? 0.42 : 0.18,
                    y: isActive ? 0 : abs * 10,
                    filter: isActive
                      ? 'brightness(1)'
                      : 'brightness(0.55)',
                  }}
                  transition={{
                    duration: CINEMA_DURATION,
                    ease: CINEMA_EASE,
                  }}
                  drag={isActive && count > 1 ? 'x' : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.22}
                  dragDirectionLock
                  onDragEnd={onDragEnd}
                  aria-hidden={!isActive}
                >
                  <InstagramSlide post={post} active={isActive} />
                </motion.div>
              )
            })}
          </div>

          {count > 1 ? (
            <>
              <NavButton
                dir="prev"
                disabled={index === 0}
                onClick={() => goTo(index - 1)}
                visible={hovered}
              />
              <NavButton
                dir="next"
                disabled={index === count - 1}
                onClick={() => goTo(index + 1)}
                visible={hovered}
              />
            </>
          ) : null}
        </div>

        {count > 1 ? (
          <p className="type-label mt-6 text-center text-[0.55rem] tracking-[0.16em] text-ink/30 uppercase md:hidden">
            Swipe
          </p>
        ) : null}

        <p className="mt-4 text-center">
          <a
            href={posts[index]?.permalink}
            target="_blank"
            rel="noreferrer"
            className="type-ui text-[0.7rem] tracking-[0.08em] text-ink/45 transition-colors hover:text-[#D8FF3E]"
          >
            Open post →
          </a>
        </p>
      </motion.div>
    </section>
  )
}

function NavButton({
  dir,
  onClick,
  disabled,
  visible,
}: {
  dir: 'prev' | 'next'
  onClick: () => void
  disabled: boolean
  visible: boolean
}) {
  return (
    <motion.button
      type="button"
      aria-label={dir === 'prev' ? 'Previous post' : 'Next post'}
      disabled={disabled}
      onClick={onClick}
      className={[
        'absolute top-1/2 z-40 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-[#0c0b0d]/75 text-ink backdrop-blur-md md:flex',
        dir === 'prev' ? 'left-0 -translate-x-1/2' : 'right-0 translate-x-1/2',
        disabled ? 'opacity-0' : '',
      ].join(' ')}
      initial={false}
      animate={{
        opacity: disabled ? 0 : visible ? 1 : 0.35,
        scale: visible && !disabled ? 1 : 0.94,
      }}
      whileHover={
        disabled ? undefined : { scale: 1.06, borderColor: 'rgba(216,255,62,0.35)' }
      }
      whileTap={disabled ? undefined : { scale: 0.96 }}
      transition={{ duration: 0.35, ease: CINEMA_EASE }}
    >
      <svg
        viewBox="0 0 20 20"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        aria-hidden
      >
        {dir === 'prev' ? (
          <path d="M12 5 7 10l5 5" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <path d="m8 5 5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
        )}
      </svg>
    </motion.button>
  )
}

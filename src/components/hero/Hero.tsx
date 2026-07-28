import { motion } from 'framer-motion'
import { Logo } from '@/components/ui/Logo'
import { BrandMark } from '@/components/ui/BrandMark'
import { useCms } from '@/cms/CmsProvider'

export function Hero() {
  const { content } = useCms()

  return (
    <section
      className="relative overflow-hidden px-4 pb-6 pt-6 sm:px-6 sm:pb-8 sm:pt-8 lg:px-8 lg:pb-10 lg:pt-10"
      aria-label="Hero"
    >
      <div className="relative mx-auto grid max-w-[1600px] grid-cols-1 items-start lg:grid-cols-12 lg:gap-2">
        <motion.div
          className="relative z-10 max-w-xl py-4 lg:col-span-7 lg:py-8 lg:pr-8"
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1 className="m-0">
            <span className="sr-only">{content.site.name}</span>
            <Logo
              variant="auto"
              className="h-[clamp(2.75rem,7vw,5.25rem)] w-auto"
            />
          </h1>
          <motion.p
            className="type-label mt-8 max-w-[18rem] text-ink/50 sm:mt-10"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
          >
            {content.site.tagline}
          </motion.p>
        </motion.div>

        <div className="relative mt-6 flex h-[140px] items-center justify-end sm:mt-8 sm:h-[160px] lg:col-span-5 lg:mt-0 lg:h-[280px] lg:items-start lg:justify-end lg:pt-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
          >
            <div className="opacity-[0.72] transition-opacity duration-500 hover:opacity-100">
              <BrandMark
                duration={52}
                className="h-[110px] w-[110px] sm:h-[128px] sm:w-[128px] lg:h-[148px] lg:w-[148px]"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

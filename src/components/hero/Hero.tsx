import { Logo } from '@/components/ui/Logo'
import { BrandMark } from '@/components/ui/BrandMark'
import { useCms } from '@/cms/CmsContext'

export function Hero() {
  const { content } = useCms()

  return (
    <section
      className="relative overflow-hidden px-4 pb-6 pt-6 sm:px-6 sm:pb-8 sm:pt-8 lg:px-8 lg:pb-10 lg:pt-10"
      aria-label="Hero"
    >
      <div className="relative mx-auto grid max-w-[1600px] grid-cols-1 items-start lg:grid-cols-12 lg:gap-2">
        <div className="relative z-10 max-w-xl py-4 lg:col-span-7 lg:py-8 lg:pr-8">
          <h1 className="m-0">
            <span className="sr-only">{content.site.name}</span>
            <Logo
              variant="auto"
              className="h-[clamp(2.75rem,7vw,5.25rem)] w-auto"
              fetchPriority="high"
            />
          </h1>
          <p className="type-label mt-8 max-w-[18rem] whitespace-pre-line text-ink/50 sm:mt-10">
            {content.site.tagline}
          </p>
        </div>

        <div className="relative mt-6 flex h-[140px] items-center justify-end sm:mt-8 sm:h-[160px] lg:col-span-5 lg:mt-0 lg:h-[280px] lg:items-start lg:justify-end lg:pt-6">
          <div className="opacity-[0.72] transition-opacity duration-500 hover:opacity-100">
            <BrandMark
              duration={52}
              className="h-[110px] w-[110px] sm:h-[128px] sm:w-[128px] lg:h-[148px] lg:w-[148px]"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

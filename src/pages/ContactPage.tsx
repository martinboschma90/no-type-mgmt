import { motion } from 'framer-motion'
import { AppShell } from '@/components/layout/AppShell'
import { Logo } from '@/components/ui/Logo'
import { SectionRow } from '@/components/ui/SectionRow'
import { PillButton } from '@/components/ui/PillButton'
import { useCms } from '@/cms/CmsProvider'

export function ContactPage() {
  const { content } = useCms()
  const { site } = content

  return (
    <AppShell navVariant="wordmark">
      <div className="px-4 pb-20 pt-24 sm:px-6 sm:pt-28 lg:px-8">
        <div className="mx-auto max-w-[1200px]">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <h1 className="m-0 mb-4">
              <span className="sr-only">Contact No Type</span>
              <Logo
                variant="auto"
                className="h-[clamp(2.5rem,7vw,4.5rem)] w-auto"
              />
            </h1>
            <p className="type-body mb-10 max-w-md text-base text-ink/60 sm:mb-14">
              {site.contactIntro}
            </p>
          </motion.div>

          <SectionRow label="Contact">
            <ul className="type-body space-y-3 text-[0.95rem] sm:text-base">
              {site.contact.map((item) => (
                <li key={item.email}>
                  <span className="text-ink/70">{item.label}: </span>
                  <a
                    href={`mailto:${item.email}`}
                    className="font-semibold text-ink underline-offset-2 hover:underline"
                  >
                    {item.email}
                  </a>
                </li>
              ))}
            </ul>
          </SectionRow>

          <SectionRow label="Social">
            <PillButton href={site.instagram} target="_blank" rel="noreferrer">
              Instagram
            </PillButton>
          </SectionRow>
        </div>
      </div>
    </AppShell>
  )
}

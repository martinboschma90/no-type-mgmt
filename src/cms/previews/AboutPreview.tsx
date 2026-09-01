import { motion } from 'framer-motion'
import { TeamSection } from '@/components/about/TeamSection'
import { AppShell } from '@/components/layout/AppShell'
import { Logo } from '@/components/ui/Logo'
import { SectionRow } from '@/components/ui/SectionRow'
import { useCms } from '@/cms/CmsProvider'
import { PreviewFrame } from '@/cms/previews/PreviewFrame'

export function AboutPreview() {
  const { content } = useCms()
  const { site, team } = content

  return (
    <PreviewFrame label="About">
      <AppShell navVariant="wordmark">
      <div className="px-4 pb-6 pt-24 sm:px-6 sm:pt-28 lg:px-8">
        <div className="mx-auto max-w-[1200px]">
          <motion.div
            className="mb-10"
            initial={false}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="m-0">
              <span className="sr-only">{site.aboutTitle || 'About NOTYPE'}</span>
              <Logo variant="auto" className="h-[clamp(2.5rem,7vw,4.5rem)] w-auto" />
            </h1>
          </motion.div>

          <SectionRow label="About us">
            <div className="type-body space-y-4 text-[0.95rem] text-ink/85">
              {site.about.map((paragraph, index) => (
                <p key={`about-preview-${index}`}>{paragraph}</p>
              ))}
              <p className="type-label pt-2 text-ink/40">{site.photoCredits}</p>
            </div>
          </SectionRow>

          <SectionRow label="Legal">
            <div className="type-body space-y-1 text-[0.95rem] text-ink/85">
              <p>{site.legal.company}</p>
              <p>{site.legal.vat}</p>
              {site.legal.addressLines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </SectionRow>
        </div>
      </div>
      {site.teamVisible !== false ? <TeamSection members={team} /> : null}
      </AppShell>
    </PreviewFrame>
  )
}

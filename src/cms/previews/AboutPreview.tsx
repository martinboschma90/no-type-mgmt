import { AboutVideoBanner } from '@/components/about/AboutVideoBanner'
import { AppShell } from '@/components/layout/AppShell'
import { SectionRow } from '@/components/ui/SectionRow'
import { TeamSection } from '@/components/about/TeamSection'
import { useCms } from '@/cms/CmsProvider'
import { PreviewFrame } from '@/cms/previews/PreviewFrame'

export function AboutPreview() {
  const { content } = useCms()
  const { site, team } = content

  return (
    <PreviewFrame label="About">
      <AppShell navVariant="wordmark">
      <AboutVideoBanner
        url={site.aboutHeroVideoUrl}
        title={site.aboutTitle || 'About NOTYPE'}
      />
      <div className="px-4 pb-6 pt-10 sm:px-6 sm:pt-12 lg:px-8">
        <div className="mx-auto max-w-[1200px]">
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

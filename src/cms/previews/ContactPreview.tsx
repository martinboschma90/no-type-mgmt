import { Logo } from '@/components/ui/Logo'
import { PillButton } from '@/components/ui/PillButton'
import { SectionRow } from '@/components/ui/SectionRow'
import { useCms } from '@/cms/CmsProvider'
import { PreviewFrame } from '@/cms/previews/PreviewFrame'

export function ContactPreview() {
  const { content } = useCms()
  const { site } = content

  return (
    <PreviewFrame label="Contact">
      <div className="px-4 pb-20 pt-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1200px]">
          <h1 className="m-0 mb-4">
            <span className="sr-only">Contact No Type</span>
            <Logo variant="auto" className="h-[clamp(2.5rem,7vw,4.5rem)] w-auto" />
          </h1>
          <p className="type-body mb-10 max-w-md text-base text-ink/60">
            {site.contactIntro}
          </p>

          <SectionRow label="Contact">
            <ul className="type-body space-y-3 text-[0.95rem]">
              {site.contact.map((item) => (
                <li key={item.email}>
                  <span className="text-ink/70">{item.label}: </span>
                  <span className="font-semibold text-ink">{item.email}</span>
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
    </PreviewFrame>
  )
}

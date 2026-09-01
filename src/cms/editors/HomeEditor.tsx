import { useCms } from '@/cms/CmsProvider'
import { EditorSection, TextArea, TextInput } from '@/cms/fields'

export function HomeEditor() {
  const { content, setSite } = useCms()
  const { site } = content

  return (
    <div className="space-y-3">
      <EditorSection
        sectionKey="hero"
        title="Hero"
        description="Primary brand mark and tagline on the homepage."
        defaultOpen
        badge="Content"
        visible={site.homeHeroVisible !== false}
        onVisibleChange={(homeHeroVisible) =>
          setSite((current) => ({ ...current, homeHeroVisible }))
        }
      >
        <TextInput
          label="Site name"
          value={site.name}
          onChange={(name) => setSite((current) => ({ ...current, name }))}
        />
        <TextInput
          label="Full name"
          value={site.fullName}
          onChange={(fullName) => setSite((current) => ({ ...current, fullName }))}
        />
        <TextArea
          label="Tagline"
          value={site.tagline}
          rows={2}
          onChange={(tagline) => setSite((current) => ({ ...current, tagline }))}
        />
      </EditorSection>
    </div>
  )
}

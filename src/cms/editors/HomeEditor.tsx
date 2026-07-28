import { useCms } from '@/cms/CmsProvider'
import { EditorSection, TextArea, TextInput } from '@/cms/fields'

export function HomeEditor() {
  const { content, setSite } = useCms()
  const { site } = content

  return (
    <>
      <EditorSection
        title="Hero"
        description="Primary brand mark and tagline on the homepage."
        defaultOpen
        badge="Content"
        tabs={[
          {
            id: 'content',
            label: 'Content',
            children: (
              <>
                <TextInput
                  label="Site name"
                  value={site.name}
                  onChange={(name) => setSite((s) => ({ ...s, name }))}
                />
                <TextInput
                  label="Full name"
                  value={site.fullName}
                  onChange={(fullName) => setSite((s) => ({ ...s, fullName }))}
                />
                <TextArea
                  label="Tagline"
                  value={site.tagline}
                  rows={2}
                  onChange={(tagline) => setSite((s) => ({ ...s, tagline }))}
                />
              </>
            ),
          },
        ]}
      />

      <EditorSection
        title="Footer"
        description="Copyright year in the site footer."
        badge="Settings"
      >
        <TextInput
          label="Year"
          value={String(site.year)}
          onChange={(value) => {
            const year = Number.parseInt(value, 10)
            if (!Number.isNaN(year)) {
              setSite((s) => ({ ...s, year }))
            }
          }}
        />
      </EditorSection>
    </>
  )
}

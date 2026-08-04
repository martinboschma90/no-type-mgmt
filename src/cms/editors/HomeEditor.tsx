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

    </>
  )
}

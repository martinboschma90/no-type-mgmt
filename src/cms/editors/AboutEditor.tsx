import { useCms } from '@/cms/CmsProvider'
import { EditorSection, TextArea, TextInput } from '@/cms/fields'
import { MediaUrlField } from '@/cms/media/MediaUrlField'

export function AboutEditor() {
  const { content, setSite, setTeam } = useCms()
  const { site, team } = content

  return (
    <>
      <EditorSection
        title="About"
        description="Paragraphs on the About page."
        defaultOpen
        badge="Content"
      >
        {site.about.map((paragraph, index) => (
          <TextArea
            key={`about-${index}`}
            label={`Paragraph ${index + 1}`}
            value={paragraph}
            rows={3}
            onChange={(value) =>
              setSite((s) => ({
                ...s,
                about: s.about.map((p, i) => (i === index ? value : p)),
              }))
            }
          />
        ))}
        <TextInput
          label="Photo credits"
          value={site.photoCredits}
          onChange={(photoCredits) => setSite((s) => ({ ...s, photoCredits }))}
        />
      </EditorSection>

      <EditorSection title="Legal" description="Company details on About and in the footer.">
        <TextInput
          label="Company"
          value={site.legal.company}
          onChange={(company) =>
            setSite((s) => ({ ...s, legal: { ...s.legal, company } }))
          }
        />
        <TextInput
          label="VAT"
          value={site.legal.vat}
          onChange={(vat) => setSite((s) => ({ ...s, legal: { ...s.legal, vat } }))}
        />
        {site.legal.addressLines.map((line, index) => (
          <TextInput
            key={`address-${index}`}
            label={`Address line ${index + 1}`}
            value={line}
            onChange={(value) =>
              setSite((s) => ({
                ...s,
                legal: {
                  ...s.legal,
                  addressLines: s.legal.addressLines.map((l, i) =>
                    i === index ? value : l,
                  ),
                },
              }))
            }
          />
        ))}
      </EditorSection>

      <EditorSection
        title="Team"
        description="People in the About team strip."
        badge="Media"
        tabs={[
          {
            id: 'content',
            label: 'Content',
            children: (
              <>
                {team.map((member, index) => (
                  <div
                    key={member.id}
                    className="space-y-3 rounded-xl border border-ink/8 bg-ink/[0.03] p-3.5"
                  >
                    <p className="type-label text-[0.65rem] tracking-[0.14em] text-ink/40 uppercase">
                      Member {index + 1}
                    </p>
                    <TextInput
                      label="Name"
                      value={member.name}
                      onChange={(name) =>
                        setTeam((list) =>
                          list.map((m, i) => (i === index ? { ...m, name } : m)),
                        )
                      }
                    />
                    <TextInput
                      label="Role"
                      value={member.role}
                      onChange={(role) =>
                        setTeam((list) =>
                          list.map((m, i) => (i === index ? { ...m, role } : m)),
                        )
                      }
                    />
                  </div>
                ))}
              </>
            ),
          },
          {
            id: 'media',
            label: 'Media',
            children: (
              <>
                {team.map((member, index) => (
                  <MediaUrlField
                    key={member.id}
                    label={member.name}
                    kind="image"
                    value={member.imageUrl}
                    onChange={(imageUrl) =>
                      setTeam((list) =>
                        list.map((m, i) => (i === index ? { ...m, imageUrl } : m)),
                      )
                    }
                  />
                ))}
              </>
            ),
          },
        ]}
      />
    </>
  )
}

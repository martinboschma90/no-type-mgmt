import { useCms } from '@/cms/CmsProvider'
import { EditorSection, TextArea, TextInput } from '@/cms/fields'

export function ContactEditor() {
  const { content, setSite } = useCms()
  const { site } = content

  return (
    <>
      <EditorSection
        title="Intro"
        description="Lead copy at the top of the Contact page."
        defaultOpen
      >
        <TextArea
          label="Intro text"
          value={site.contactIntro}
          rows={3}
          onChange={(contactIntro) => setSite((s) => ({ ...s, contactIntro }))}
        />
      </EditorSection>

      <EditorSection title="Inboxes" description="Booking and ops contact emails.">
        {site.contact.map((item, index) => (
          <div
            key={`contact-${index}`}
            className="space-y-3 rounded-xl border border-ink/8 bg-ink/[0.03] p-3.5"
          >
            <p className="type-label text-[0.65rem] tracking-[0.14em] text-ink/40 uppercase">
              Contact {index + 1}
            </p>
            <TextInput
              label="Label"
              value={item.label}
              onChange={(label) =>
                setSite((s) => ({
                  ...s,
                  contact: s.contact.map((c, i) =>
                    i === index ? { ...c, label } : c,
                  ),
                }))
              }
            />
            <TextInput
              label="Email"
              value={item.email}
              onChange={(email) =>
                setSite((s) => ({
                  ...s,
                  contact: s.contact.map((c, i) =>
                    i === index ? { ...c, email } : c,
                  ),
                }))
              }
            />
          </div>
        ))}
      </EditorSection>

      <EditorSection title="Social" description="Primary social link across Contact and footer.">
        <TextInput
          label="Instagram URL"
          value={site.instagram}
          onChange={(instagram) => setSite((s) => ({ ...s, instagram }))}
        />
      </EditorSection>
    </>
  )
}

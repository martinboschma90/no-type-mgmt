import { useCms } from '@/cms/CmsProvider'
import { EditorSection, TextArea, TextInput } from '@/cms/fields'
import { MediaUrlField } from '@/cms/media/MediaUrlField'

const listBtnClass =
  'type-label rounded-full border border-ink/12 px-3 py-1.5 text-[0.65rem] tracking-[0.1em] text-ink/55 uppercase transition-colors hover:border-ink/25 hover:text-ink'

export function FooterEditor() {
  const { content, setSite } = useCms()
  const { site } = content

  return (
    <>
      <EditorSection
        title="Brand"
        description="Logo and footer copy shown on every page."
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
                  label="Footer tekst"
                  value={site.tagline}
                  rows={3}
                  hint="Supports line breaks."
                  onChange={(tagline) => setSite((s) => ({ ...s, tagline }))}
                />
              </>
            ),
          },
          {
            id: 'media',
            label: 'Logo',
            children: (
              <MediaUrlField
                label="Custom logo"
                kind="image"
                value={site.logoUrl}
                hint="Leave empty to keep the default No Type logo."
                onChange={(logoUrl) => setSite((s) => ({ ...s, logoUrl }))}
              />
            ),
          },
        ]}
      />

      <EditorSection
        title="Contact"
        description="Contact labels and emails in the footer."
      >
        {site.contact.map((item, index) => (
          <div
            key={`footer-contact-${index}`}
            className="space-y-3 rounded-xl border border-ink/8 bg-ink/[0.03] p-3.5"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="type-label text-[0.65rem] tracking-[0.14em] text-ink/40 uppercase">
                Contact {index + 1}
              </p>
              <button
                type="button"
                className={listBtnClass}
                onClick={() =>
                  setSite((s) => ({
                    ...s,
                    contact: s.contact.filter((_, i) => i !== index),
                  }))
                }
              >
                Remove
              </button>
            </div>
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
        <button
          type="button"
          className={listBtnClass}
          onClick={() =>
            setSite((s) => ({
              ...s,
              contact: [...s.contact, { label: 'Contact', email: '' }],
            }))
          }
        >
          + Add contact
        </button>
      </EditorSection>

      <EditorSection title="Social media" description="Follow links in the footer.">
        <TextInput
          label="Instagram URL"
          value={site.instagram}
          onChange={(instagram) => setSite((s) => ({ ...s, instagram }))}
        />
      </EditorSection>

      <EditorSection
        title="Navigatie links"
        description="Links in the footer bottom bar (Privacy, Terms, …)."
      >
        {site.legalLinks.map((link, index) => (
          <div
            key={`footer-nav-${index}`}
            className="space-y-3 rounded-xl border border-ink/8 bg-ink/[0.03] p-3.5"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="type-label text-[0.65rem] tracking-[0.14em] text-ink/40 uppercase">
                Link {index + 1}
              </p>
              <button
                type="button"
                className={listBtnClass}
                onClick={() =>
                  setSite((s) => ({
                    ...s,
                    legalLinks: s.legalLinks.filter((_, i) => i !== index),
                  }))
                }
              >
                Remove
              </button>
            </div>
            <TextInput
              label="Label"
              value={link.label}
              onChange={(label) =>
                setSite((s) => ({
                  ...s,
                  legalLinks: s.legalLinks.map((l, i) =>
                    i === index ? { ...l, label } : l,
                  ),
                }))
              }
            />
            <TextInput
              label="URL"
              value={link.href}
              onChange={(href) =>
                setSite((s) => ({
                  ...s,
                  legalLinks: s.legalLinks.map((l, i) =>
                    i === index ? { ...l, href } : l,
                  ),
                }))
              }
            />
          </div>
        ))}
        <button
          type="button"
          className={listBtnClass}
          onClick={() =>
            setSite((s) => ({
              ...s,
              legalLinks: [...s.legalLinks, { label: 'Link', href: '#' }],
            }))
          }
        >
          + Add link
        </button>
      </EditorSection>

      <EditorSection
        title="Copyright"
        description="Bottom bar copyright line."
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
        <TextInput
          label="Copyright tekst"
          value={site.copyrightText}
          hint="Optional override. Empty uses ©{year} {full name}."
          placeholder={`©${site.year} ${site.fullName || site.name}`}
          onChange={(copyrightText) =>
            setSite((s) => ({ ...s, copyrightText }))
          }
        />
      </EditorSection>

      <EditorSection
        title="Legal block"
        description="Company block in the footer Legal column."
      >
        <TextInput
          label="Company"
          value={site.legal.company}
          onChange={(company) =>
            setSite((s) => ({ ...s, legal: { ...s.legal, company } }))
          }
        />
        <TextInput
          label="VAT / domain"
          value={site.legal.vat}
          onChange={(vat) =>
            setSite((s) => ({ ...s, legal: { ...s.legal, vat } }))
          }
        />
        {(site.legal.addressLines.length
          ? site.legal.addressLines
          : ['']
        ).map((line, index) => (
          <TextInput
            key={`footer-address-${index}`}
            label={`Address line ${index + 1}`}
            value={line}
            onChange={(value) =>
              setSite((s) => {
                const lines =
                  s.legal.addressLines.length > 0
                    ? [...s.legal.addressLines]
                    : ['']
                lines[index] = value
                return {
                  ...s,
                  legal: {
                    ...s.legal,
                    addressLines: lines.filter((l) => l.trim().length > 0),
                  },
                }
              })
            }
          />
        ))}
      </EditorSection>
    </>
  )
}

import { useCms } from '@/cms/CmsProvider'
import { ArtistVisibilityToggle } from '@/cms/editors/ArtistVisibilityToggle'
import { EditorSection, TextArea, TextInput } from '@/cms/fields'
import { MediaUrlField } from '@/cms/media/MediaUrlField'

const listBtnClass =
  'cms-secondary-action rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-[11px] font-medium text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-900'

function newTeamId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `t-${Date.now()}`
}

export function AboutEditor() {
  const { content, setSite, setTeam } = useCms()
  const { site, team } = content
  const intro = site.about[0] ?? ''
  const description = site.about.slice(1)

  return (
    <>
      <EditorSection
        title="About"
        description="Content on the About page. Layout stays the same."
        defaultOpen
        badge="Content"
      >
        <TextInput
          label="Title"
          value={site.aboutTitle}
          hint="Used for accessibility; the logo remains the visual mark."
          onChange={(aboutTitle) => setSite((s) => ({ ...s, aboutTitle }))}
        />
        <TextArea
          label="Intro tekst"
          value={intro}
          rows={3}
          onChange={(value) =>
            setSite((s) => ({
              ...s,
              about: [value, ...s.about.slice(1)],
            }))
          }
        />
        {description.map((paragraph, index) => (
          <div key={`about-desc-${index}`} className="space-y-2">
            <TextArea
              label={`Beschrijving ${index + 1}`}
              value={paragraph}
              rows={3}
              onChange={(value) =>
                setSite((s) => ({
                  ...s,
                  about: s.about.map((p, i) =>
                    i === index + 1 ? value : p,
                  ),
                }))
              }
            />
            <button
              type="button"
              className={listBtnClass}
              onClick={() =>
                setSite((s) => ({
                  ...s,
                  about: s.about.filter((_, i) => i !== index + 1),
                }))
              }
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          className={listBtnClass}
          onClick={() =>
            setSite((s) => ({
              ...s,
              about: s.about.length ? [...s.about, ''] : ['', ''],
            }))
          }
        >
          + Add paragraph
        </button>
        <TextInput
          label="Photo credits"
          value={site.photoCredits}
          onChange={(photoCredits) => setSite((s) => ({ ...s, photoCredits }))}
        />
      </EditorSection>

      <EditorSection
        title="Social links"
        description="Optional. Shared with Contact and Footer."
      >
        <TextInput
          label="Instagram URL"
          value={site.instagram}
          onChange={(instagram) => setSite((s) => ({ ...s, instagram }))}
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
          label="VAT / domain"
          value={site.legal.vat}
          onChange={(vat) => setSite((s) => ({ ...s, legal: { ...s.legal, vat } }))}
        />
        {(site.legal.addressLines.length
          ? site.legal.addressLines
          : ['']
        ).map((line, index) => (
          <div key={`address-${index}`} className="space-y-2">
            <TextInput
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
          </div>
        ))}
        <button
          type="button"
          className={listBtnClass}
          onClick={() =>
            setSite((s) => ({
              ...s,
              legal: {
                ...s.legal,
                addressLines: [...s.legal.addressLines, ''],
              },
            }))
          }
        >
          + Add address line
        </button>
      </EditorSection>

      <EditorSection
        title="Team"
        description="Optional team strip on the About page. Content is kept when hidden."
        badge="Media"
        defaultOpen
        tabs={[
          {
            id: 'content',
            label: 'Content',
            children: (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink/8 bg-ink/[0.03] px-3.5 py-3">
                  <div>
                    <p className="type-label text-[0.65rem] tracking-[0.14em] text-ink/45 uppercase">
                      Team sectie
                    </p>
                    <p className="type-body mt-1 text-xs text-ink/45">
                      {site.teamVisible !== false
                        ? 'Zichtbaar op de About pagina'
                        : 'Verborgen — teamdata blijft bewaard'}
                    </p>
                  </div>
                  <ArtistVisibilityToggle
                    visible={site.teamVisible !== false}
                    onChange={(teamVisible) =>
                      setSite((s) => ({ ...s, teamVisible }))
                    }
                  />
                </div>
                {team.map((member, index) => (
                  <div
                    key={member.id}
                    className="space-y-3 rounded-xl border border-ink/8 bg-ink/[0.03] p-3.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="type-label text-[0.65rem] tracking-[0.14em] text-ink/40 uppercase">
                        Member {index + 1}
                      </p>
                      <button
                        type="button"
                        className={listBtnClass}
                        onClick={() =>
                          setTeam((list) =>
                            list.filter((_, i) => i !== index),
                          )
                        }
                      >
                        Remove
                      </button>
                    </div>
                    <TextInput
                      label="Name"
                      value={member.name}
                      onChange={(name) =>
                        setTeam((list) =>
                          list.map((m, i) =>
                            i === index ? { ...m, name } : m,
                          ),
                        )
                      }
                    />
                    <TextInput
                      label="Role"
                      value={member.role}
                      onChange={(role) =>
                        setTeam((list) =>
                          list.map((m, i) =>
                            i === index ? { ...m, role } : m,
                          ),
                        )
                      }
                    />
                  </div>
                ))}
                <button
                  type="button"
                  className={listBtnClass}
                  onClick={() =>
                    setTeam((list) => [
                      ...list,
                      {
                        id: newTeamId(),
                        name: 'New member',
                        role: 'Role',
                        imageUrl: '',
                      },
                    ])
                  }
                >
                  + Add team member
                </button>
              </>
            ),
          },
          {
            id: 'media',
            label: 'Media',
            children: (
              <>
                {team.length === 0 ? (
                  <p className="type-body text-sm text-ink/45">
                    No team members yet.
                  </p>
                ) : (
                  team.map((member, index) => (
                    <MediaUrlField
                      key={member.id}
                      label={member.name || `Member ${index + 1}`}
                      kind="image"
                      value={member.imageUrl}
                      onChange={(imageUrl) =>
                        setTeam((list) =>
                          list.map((m, i) =>
                            i === index ? { ...m, imageUrl } : m,
                          ),
                        )
                      }
                    />
                  ))
                )}
              </>
            ),
          },
        ]}
      />
    </>
  )
}

import { useCms } from '@/cms/CmsProvider'
import type { FaqCategory, FaqItem } from '@/cms/content'
import { ArtistVisibilityToggle } from '@/cms/editors/ArtistVisibilityToggle'
import { EditorSection, TextArea, TextInput } from '@/cms/fields'

function newId(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function moveItem<T>(list: T[], index: number, direction: -1 | 1): T[] {
  const next = index + direction
  if (next < 0 || next >= list.length) return list
  const copy = [...list]
  const [item] = copy.splice(index, 1)
  copy.splice(next, 0, item)
  return copy
}

function emptyItem(): FaqItem {
  return {
    id: newId('q'),
    question: 'New question',
    answer: '',
    visible: true,
  }
}

function emptyCategory(): FaqCategory {
  return {
    id: newId('cat'),
    title: 'New category',
    visible: true,
    items: [emptyItem()],
  }
}

export function FaqEditor() {
  const { content, setSite } = useCms()
  const { site } = content
  const visible = site.faqVisible !== false
  const categories = site.faqCategories

  function updateCategories(
    updater: (current: FaqCategory[]) => FaqCategory[],
  ) {
    setSite((s) => ({ ...s, faqCategories: updater(s.faqCategories) }))
  }

  return (
    <>
      <EditorSection
        title="Visibility"
        description="Show or hide the Promoter FAQ page, menu link and footer link."
        defaultOpen
        badge="Settings"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink/8 bg-ink/[0.03] px-3.5 py-3">
          <div>
            <p className="type-label text-[0.65rem] tracking-[0.14em] text-ink/45 uppercase">
              FAQ page
            </p>
            <p className="type-body mt-1 text-xs text-ink/45">
              {visible
                ? 'Visible at /faq'
                : 'Hidden — /faq redirects home'}
            </p>
          </div>
          <ArtistVisibilityToggle
            visible={visible}
            onChange={(faqVisible) => setSite((s) => ({ ...s, faqVisible }))}
          />
        </div>
      </EditorSection>

      <EditorSection
        title="Intro"
        description="Headline and supporting copy on the FAQ page."
        defaultOpen
        badge="Content"
      >
        <TextInput
          label="Title"
          value={site.faqTitle}
          onChange={(faqTitle) => setSite((s) => ({ ...s, faqTitle }))}
        />
        <TextArea
          label="Intro"
          value={site.faqIntro}
          rows={3}
          onChange={(faqIntro) => setSite((s) => ({ ...s, faqIntro }))}
        />
      </EditorSection>

      <EditorSection
        title="Categories & questions"
        description="Categories become page tabs. Add, edit, reorder and hide questions."
        defaultOpen
        badge="FAQ"
      >
        <div className="space-y-4">
          {categories.map((category, categoryIndex) => (
            <div
              key={category.id}
              className="rounded-2xl border border-ink/10 bg-ink/[0.02] p-3.5"
            >
              <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1 space-y-2">
                  <TextInput
                    label="Category title"
                    value={category.title}
                    onChange={(title) =>
                      updateCategories((list) =>
                        list.map((c) =>
                          c.id === category.id ? { ...c, title } : c,
                        ),
                      )
                    }
                  />
                </div>
                <ArtistVisibilityToggle
                  compact
                  visible={category.visible}
                  onChange={(nextVisible) =>
                    updateCategories((list) =>
                      list.map((c) =>
                        c.id === category.id
                          ? { ...c, visible: nextVisible }
                          : c,
                      ),
                    )
                  }
                />
              </div>

              <div className="mb-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="type-label rounded-full border border-ink/12 px-3 py-1.5 text-[0.55rem] tracking-[0.12em] text-ink/55 uppercase hover:border-ink/25 hover:text-ink"
                  onClick={() =>
                    updateCategories((list) =>
                      moveItem(list, categoryIndex, -1),
                    )
                  }
                  disabled={categoryIndex === 0}
                >
                  Up
                </button>
                <button
                  type="button"
                  className="type-label rounded-full border border-ink/12 px-3 py-1.5 text-[0.55rem] tracking-[0.12em] text-ink/55 uppercase hover:border-ink/25 hover:text-ink"
                  onClick={() =>
                    updateCategories((list) =>
                      moveItem(list, categoryIndex, 1),
                    )
                  }
                  disabled={categoryIndex === categories.length - 1}
                >
                  Down
                </button>
                <button
                  type="button"
                  className="type-label rounded-full border border-ink/12 px-3 py-1.5 text-[0.55rem] tracking-[0.12em] text-ink/55 uppercase hover:border-ink/25 hover:text-ink"
                  onClick={() =>
                    updateCategories((list) =>
                      list.map((c) =>
                        c.id === category.id
                          ? { ...c, items: [...c.items, emptyItem()] }
                          : c,
                      ),
                    )
                  }
                >
                  Add question
                </button>
                <button
                  type="button"
                  className="type-label rounded-full border border-ink/12 px-3 py-1.5 text-[0.55rem] tracking-[0.12em] text-red-700/70 uppercase hover:border-red-700/30 hover:text-red-700"
                  onClick={() =>
                    updateCategories((list) =>
                      list.filter((c) => c.id !== category.id),
                    )
                  }
                >
                  Remove category
                </button>
              </div>

              <div className="space-y-3">
                {category.items.map((item, itemIndex) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-ink/8 bg-[var(--body-bg)] p-3"
                  >
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <p className="type-label text-[0.55rem] tracking-[0.12em] text-ink/40 uppercase">
                        Question {itemIndex + 1}
                      </p>
                      <ArtistVisibilityToggle
                        compact
                        visible={item.visible}
                        onChange={(nextVisible) =>
                          updateCategories((list) =>
                            list.map((c) =>
                              c.id === category.id
                                ? {
                                    ...c,
                                    items: c.items.map((q) =>
                                      q.id === item.id
                                        ? { ...q, visible: nextVisible }
                                        : q,
                                    ),
                                  }
                                : c,
                            ),
                          )
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <TextInput
                        label="Question"
                        value={item.question}
                        onChange={(question) =>
                          updateCategories((list) =>
                            list.map((c) =>
                              c.id === category.id
                                ? {
                                    ...c,
                                    items: c.items.map((q) =>
                                      q.id === item.id
                                        ? { ...q, question }
                                        : q,
                                    ),
                                  }
                                : c,
                            ),
                          )
                        }
                      />
                      <TextArea
                        label="Answer"
                        value={item.answer}
                        rows={3}
                        onChange={(answer) =>
                          updateCategories((list) =>
                            list.map((c) =>
                              c.id === category.id
                                ? {
                                    ...c,
                                    items: c.items.map((q) =>
                                      q.id === item.id ? { ...q, answer } : q,
                                    ),
                                  }
                                : c,
                            ),
                          )
                        }
                      />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="type-label rounded-full border border-ink/12 px-3 py-1.5 text-[0.55rem] tracking-[0.12em] text-ink/55 uppercase hover:border-ink/25 hover:text-ink"
                        onClick={() =>
                          updateCategories((list) =>
                            list.map((c) =>
                              c.id === category.id
                                ? {
                                    ...c,
                                    items: moveItem(c.items, itemIndex, -1),
                                  }
                                : c,
                            ),
                          )
                        }
                        disabled={itemIndex === 0}
                      >
                        Up
                      </button>
                      <button
                        type="button"
                        className="type-label rounded-full border border-ink/12 px-3 py-1.5 text-[0.55rem] tracking-[0.12em] text-ink/55 uppercase hover:border-ink/25 hover:text-ink"
                        onClick={() =>
                          updateCategories((list) =>
                            list.map((c) =>
                              c.id === category.id
                                ? {
                                    ...c,
                                    items: moveItem(c.items, itemIndex, 1),
                                  }
                                : c,
                            ),
                          )
                        }
                        disabled={itemIndex === category.items.length - 1}
                      >
                        Down
                      </button>
                      <button
                        type="button"
                        className="type-label rounded-full border border-ink/12 px-3 py-1.5 text-[0.55rem] tracking-[0.12em] text-red-700/70 uppercase hover:border-red-700/30 hover:text-red-700"
                        onClick={() =>
                          updateCategories((list) =>
                            list.map((c) =>
                              c.id === category.id
                                ? {
                                    ...c,
                                    items: c.items.filter(
                                      (q) => q.id !== item.id,
                                    ),
                                  }
                                : c,
                            ),
                          )
                        }
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <button
            type="button"
            className="type-label w-full rounded-full border border-ink/15 px-4 py-2.5 text-[0.65rem] tracking-[0.12em] text-ink/70 uppercase transition-colors hover:border-ink/30 hover:text-ink"
            onClick={() =>
              updateCategories((list) => [...list, emptyCategory()])
            }
          >
            Add category
          </button>
        </div>
      </EditorSection>
    </>
  )
}

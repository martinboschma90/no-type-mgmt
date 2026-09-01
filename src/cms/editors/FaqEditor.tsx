import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  ChevronDown,
  GripVertical,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'
import { useCms } from '@/cms/CmsProvider'
import type { FaqCategory, FaqItem } from '@/cms/content'
import { ArtistVisibilityToggle } from '@/cms/editors/ArtistVisibilityToggle'
import { EditorSection, Field, TextArea, TextInput } from '@/cms/fields'
import {
  Card,
  Modal,
  PrimaryButton,
  SecondaryButton,
  inputCls,
} from '@/cms/flow-mates/cms-ui'

function newId(prefix: string) {
  return `${prefix}-${
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  }`
}

type DialogState =
  | { kind: 'category'; category: FaqCategory | null }
  | { kind: 'question'; categoryId: string; item: FaqItem | null }
  | null

export function FaqEditor() {
  const { content, setSite } = useCms()
  const { site } = content
  const categories = site.faqCategories
  const [filter, setFilter] = useState<string>('all')
  const [dialog, setDialog] = useState<DialogState>(null)
  const [dragging, setDragging] = useState<{
    categoryId: string
    index: number
  } | null>(null)

  const rows = useMemo(
    () =>
      categories.flatMap((category) =>
        category.items.map((item, itemIndex) => ({
          category,
          item,
          itemIndex,
        })),
      ),
    [categories],
  )
  const filteredRows =
    filter === 'all'
      ? rows
      : rows.filter(({ category }) => category.id === filter)

  function updateCategories(updater: (current: FaqCategory[]) => FaqCategory[]) {
    setSite((current) => ({
      ...current,
      faqCategories: updater(current.faqCategories),
    }))
  }

  const openNewQuestion = () => {
    const categoryId =
      filter !== 'all' && categories.some((category) => category.id === filter)
        ? filter
        : categories[0]?.id
    if (categoryId) {
      setDialog({ kind: 'question', categoryId, item: null })
    } else {
      setDialog({ kind: 'category', category: null })
    }
  }

  return (
    <>
      <EditorSection
        title="FAQ-instellingen"
        description="Titel, introductie en zichtbaarheid van de pagina."
        tabs={[
          {
            id: 'content',
            label: 'Introductie',
            children: (
              <>
                <TextInput
                  label="Titel"
                  value={site.faqTitle}
                  onChange={(faqTitle) => setSite((s) => ({ ...s, faqTitle }))}
                />
                <TextArea
                  label="Introductie"
                  value={site.faqIntro}
                  rows={3}
                  onChange={(faqIntro) => setSite((s) => ({ ...s, faqIntro }))}
                />
              </>
            ),
          },
          {
            id: 'settings',
            label: 'Zichtbaarheid',
            children: (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3.5">
                <div>
                  <p className="text-sm font-semibold text-neutral-900">FAQ-pagina</p>
                  <p className="mt-1 text-xs text-neutral-500">
                    {site.faqVisible !== false
                      ? 'Zichtbaar in menu, footer en op /faq'
                      : 'Verborgen en niet publiek bereikbaar'}
                  </p>
                </div>
                <ArtistVisibilityToggle
                  visible={site.faqVisible !== false}
                  onChange={(faqVisible) =>
                    setSite((s) => ({ ...s, faqVisible }))
                  }
                />
              </div>
            ),
          },
        ]}
      />

      <Card className="p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-neutral-900">FAQ-vragen</p>
            <p className="mt-0.5 text-xs text-neutral-500">
              Filter per categorie en open een vraag om te bewerken.
            </p>
          </div>
          <PrimaryButton type="button" onClick={openNewQuestion}>
            <Plus className="h-3.5 w-3.5" /> Vraag toevoegen
          </PrimaryButton>
        </div>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        <FilterPill active={filter === 'all'} onClick={() => setFilter('all')}>
          Alle <span className="ml-1 opacity-55">({rows.length})</span>
        </FilterPill>
        {categories.map((category) => (
          <div key={category.id} className="inline-flex items-center">
            <FilterPill
              active={filter === category.id}
              onClick={() => setFilter(category.id)}
            >
              {category.title}{' '}
              <span className="ml-1 opacity-55">({category.items.length})</span>
            </FilterPill>
            {filter === category.id ? (
              <button
                type="button"
                aria-label={`${category.title} bewerken`}
                title="Categorie bewerken"
                onClick={() => setDialog({ kind: 'category', category })}
                className="-ml-1 rounded-full p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900"
              >
                <Pencil className="h-3 w-3" />
              </button>
            ) : null}
          </div>
        ))}
      </div>

      <div className="space-y-2">
        {filteredRows.map(({ category, item, itemIndex }) => (
          <div
            key={item.id}
            draggable
            onDragStart={() =>
              setDragging({ categoryId: category.id, index: itemIndex })
            }
            onDragEnd={() => setDragging(null)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => {
              if (!dragging || dragging.categoryId !== category.id) return
              updateCategories((list) =>
                list.map((current) => {
                  if (current.id !== category.id) return current
                  const items = [...current.items]
                  const [moved] = items.splice(dragging.index, 1)
                  items.splice(itemIndex, 0, moved)
                  return { ...current, items }
                }),
              )
              setDragging(null)
            }}
          >
          <Card hover>
            <div className="flex items-center gap-2 px-3 py-3 sm:px-4">
              <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-neutral-300" />
              <button
                type="button"
                className="min-w-0 flex-1 text-left"
                onClick={() =>
                  setDialog({ kind: 'question', categoryId: category.id, item })
                }
              >
                <div className="flex items-center gap-1.5">
                  <CategoryBadge>{category.title}</CategoryBadge>
                  <StatusBadge visible={item.visible} />
                </div>
                <p className="mt-1 truncate text-sm font-semibold text-neutral-900">
                  {item.question || 'Naamloze vraag'}
                </p>
                <p className="mt-0.5 line-clamp-1 text-xs text-neutral-500">
                  {item.answer || 'Nog geen antwoord ingevuld'}
                </p>
              </button>

              <ChevronDown className="h-4 w-4 shrink-0 text-neutral-400" />
              <ArtistVisibilityToggle
                compact
                visible={item.visible}
                onChange={(visible) =>
                  patchQuestion(updateCategories, category.id, item.id, {
                    visible,
                  })
                }
              />
              <IconButton
                label="Vraag verwijderen"
                danger
                onClick={() => {
                  if (!window.confirm('Deze vraag verwijderen?')) return
                  updateCategories((list) =>
                    list.map((current) =>
                      current.id === category.id
                        ? {
                            ...current,
                            items: current.items.filter(
                              (question) => question.id !== item.id,
                            ),
                          }
                        : current,
                    ),
                  )
                }}
              >
                <Trash2 />
              </IconButton>
            </div>
          </Card>
          </div>
        ))}

        {filteredRows.length === 0 ? (
          <Card className="px-5 py-12 text-center">
            <p className="text-sm font-semibold text-neutral-900">Geen vragen</p>
            <p className="mt-1 text-xs text-neutral-500">
              Voeg een vraag toe binnen deze categorie.
            </p>
          </Card>
        ) : null}
      </div>

      <SecondaryButton
        type="button"
        className="w-full"
        onClick={() => setDialog({ kind: 'category', category: null })}
      >
        <Plus className="h-3.5 w-3.5" /> Categorie toevoegen
      </SecondaryButton>

      {dialog?.kind === 'category' ? (
        <CategoryDialog
          category={dialog.category}
          onClose={() => setDialog(null)}
          onDelete={
            dialog.category
              ? () => {
                  if (
                    !window.confirm(
                      `Categorie “${dialog.category?.title}” met alle vragen verwijderen?`,
                    )
                  )
                    return
                  updateCategories((list) =>
                    list.filter((category) => category.id !== dialog.category?.id),
                  )
                  setFilter('all')
                  setDialog(null)
                }
              : undefined
          }
          onSave={(draft) => {
            updateCategories((list) =>
              dialog.category
                ? list.map((category) =>
                    category.id === dialog.category?.id
                      ? { ...category, ...draft }
                      : category,
                  )
                : [
                    ...list,
                    {
                      id: newId('cat'),
                      title: draft.title,
                      visible: draft.visible,
                      items: [],
                    },
                  ],
            )
            setDialog(null)
          }}
        />
      ) : null}

      {dialog?.kind === 'question' ? (
        <QuestionDialog
          categories={categories}
          categoryId={dialog.categoryId}
          item={dialog.item}
          onClose={() => setDialog(null)}
          onSave={(targetCategoryId, draft) => {
            updateCategories((list) =>
              list.map((category) => {
                if (
                  dialog.item &&
                  category.id === dialog.categoryId &&
                  targetCategoryId === dialog.categoryId
                ) {
                  return {
                    ...category,
                    items: category.items.map((item) =>
                      item.id === dialog.item?.id ? { ...item, ...draft } : item,
                    ),
                  }
                }
                const items = dialog.item
                  ? category.items.filter((item) => item.id !== dialog.item?.id)
                  : category.items
                if (category.id !== targetCategoryId) return { ...category, items }
                return {
                  ...category,
                  items: [
                    ...items,
                    dialog.item
                      ? { ...dialog.item, ...draft }
                      : { id: newId('q'), ...draft },
                  ],
                }
              }),
            )
            setDialog(null)
          }}
        />
      ) : null}
    </>
  )
}

function patchQuestion(
  updateCategories: (
    updater: (current: FaqCategory[]) => FaqCategory[],
  ) => void,
  categoryId: string,
  itemId: string,
  patch: Partial<FaqItem>,
) {
  updateCategories((list) =>
    list.map((category) =>
      category.id === categoryId
        ? {
            ...category,
            items: category.items.map((item) =>
              item.id === itemId ? { ...item, ...patch } : item,
            ),
          }
        : category,
    ),
  )
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? 'bg-neutral-900 text-white'
          : 'bg-white text-neutral-700 ring-1 ring-neutral-200 hover:bg-neutral-50'
      }`}
    >
      {children}
    </button>
  )
}

function CategoryBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex rounded-full bg-neutral-100 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-neutral-600 ring-1 ring-inset ring-neutral-200">
      {children}
    </span>
  )
}

function StatusBadge({ visible }: { visible: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] ${
        visible
          ? 'bg-emerald-500/10 text-emerald-600'
          : 'bg-neutral-100 text-neutral-400'
      }`}
    >
      <span className="h-1 w-1 rounded-full bg-current" />
      {visible ? 'Live' : 'Verborgen'}
    </span>
  )
}

function CategoryDialog({
  category,
  onClose,
  onSave,
  onDelete,
}: {
  category: FaqCategory | null
  onClose: () => void
  onSave: (draft: Pick<FaqCategory, 'title' | 'visible'>) => void
  onDelete?: () => void
}) {
  const [title, setTitle] = useState(category?.title ?? '')
  const [visible, setVisible] = useState(category?.visible ?? true)
  return (
    <Modal
      title={category ? 'Categorie bewerken' : 'Categorie toevoegen'}
      onClose={onClose}
      footer={
        <div className="flex items-center justify-between gap-2">
          <div>
            {onDelete ? (
              <SecondaryButton className="text-red-500" onClick={onDelete}>
                Verwijderen
              </SecondaryButton>
            ) : null}
          </div>
          <div className="flex gap-2">
            <SecondaryButton onClick={onClose}>Annuleren</SecondaryButton>
            <PrimaryButton
              disabled={!title.trim()}
              onClick={() => onSave({ title: title.trim(), visible })}
            >
              Opslaan
            </PrimaryButton>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        <TextInput
          label="Categorienaam"
          value={title}
          placeholder="Bijvoorbeeld: Reguliere boekingen"
          onChange={setTitle}
        />
        <VisibilityRow visible={visible} onChange={setVisible} />
      </div>
    </Modal>
  )
}

function QuestionDialog({
  categories,
  categoryId,
  item,
  onClose,
  onSave,
}: {
  categories: FaqCategory[]
  categoryId: string
  item: FaqItem | null
  onClose: () => void
  onSave: (
    categoryId: string,
    draft: Pick<FaqItem, 'question' | 'answer' | 'visible'>,
  ) => void
}) {
  const [selectedCategory, setSelectedCategory] = useState(categoryId)
  const [question, setQuestion] = useState(item?.question ?? '')
  const [answer, setAnswer] = useState(item?.answer ?? '')
  const [visible, setVisible] = useState(item?.visible ?? true)

  useEffect(() => {
    if (!categories.some((category) => category.id === selectedCategory)) {
      setSelectedCategory(categories[0]?.id ?? '')
    }
  }, [categories, selectedCategory])

  return (
    <Modal
      title={item ? 'FAQ-vraag bewerken' : 'FAQ-vraag toevoegen'}
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <SecondaryButton onClick={onClose}>Annuleren</SecondaryButton>
          <PrimaryButton
            disabled={!question.trim() || !answer.trim() || !selectedCategory}
            onClick={() =>
              onSave(selectedCategory, {
                question: question.trim(),
                answer: answer.trim(),
                visible,
              })
            }
          >
            Opslaan
          </PrimaryButton>
        </div>
      }
    >
      <div className="space-y-5">
        <Field label="Categorie">
          <select
            value={selectedCategory}
            onChange={(event) => setSelectedCategory(event.target.value)}
            className={inputCls}
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.title}
              </option>
            ))}
          </select>
        </Field>
        <TextInput
          label="Vraag"
          value={question}
          placeholder="Welke vraag stellen bezoekers?"
          onChange={setQuestion}
        />
        <TextArea
          label="Antwoord"
          value={answer}
          rows={6}
          onChange={setAnswer}
        />
        <VisibilityRow visible={visible} onChange={setVisible} />
      </div>
    </Modal>
  )
}

function VisibilityRow({
  visible,
  onChange,
}: {
  visible: boolean
  onChange: (visible: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-neutral-200 bg-neutral-50 p-3.5">
      <div>
        <p className="text-sm font-semibold text-neutral-900">Publiek zichtbaar</p>
        <p className="mt-1 text-xs text-neutral-500">
          Verborgen inhoud blijft in het CMS bewaard.
        </p>
      </div>
      <ArtistVisibilityToggle visible={visible} onChange={onChange} />
    </div>
  )
}

function IconButton({
  label,
  danger = false,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string
  danger?: boolean
}) {
  return (
    <button
      {...props}
      type="button"
      aria-label={label}
      title={label}
      className={`rounded-lg p-1.5 transition-colors disabled:cursor-not-allowed disabled:opacity-25 ${
        danger
          ? 'text-neutral-400 hover:bg-red-500/10 hover:text-red-500'
          : 'text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900'
      }`}
    >
      <span className="[&>svg]:h-3.5 [&>svg]:w-3.5">{children}</span>
    </button>
  )
}

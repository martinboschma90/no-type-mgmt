import { useEffect, useMemo, useState } from 'react'
import type { FaqCategory, FaqItem } from '@/cms/content'

type FaqHubProps = {
  title: string
  intro: string
  categories: FaqCategory[]
}

function visibleCategories(categories: FaqCategory[]): FaqCategory[] {
  return categories
    .filter((category) => category.visible)
    .map((category) => ({
      ...category,
      items: category.items.filter((item) => item.visible),
    }))
    .filter((category) => category.items.length > 0)
}

function FaqAccordionItem({
  item,
  open,
  onToggle,
}: {
  item: FaqItem
  open: boolean
  onToggle: () => void
}) {
  return (
    <div className="border-b border-ink/10">
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-4 py-4 text-left transition-opacity hover:opacity-80"
      >
        <span className="type-body text-[0.95rem] font-medium text-ink sm:text-base">
          {item.question}
        </span>
        <span
          aria-hidden
          className={`type-ui mt-0.5 shrink-0 text-xs text-ink/45 transition-transform ${
            open ? 'rotate-45' : ''
          }`}
        >
          +
        </span>
      </button>
      {open ? (
        <div className="pb-4 pr-8">
          <p className="type-body text-sm text-ink/60 sm:text-[0.95rem]">
            {item.answer}
          </p>
        </div>
      ) : null}
    </div>
  )
}

/** Tabbed FAQ hub — one category visible at a time. */
export function FaqHub({ title, intro, categories }: FaqHubProps) {
  const tabs = useMemo(() => visibleCategories(categories), [categories])
  const [activeId, setActiveId] = useState(tabs[0]?.id ?? '')
  const [openId, setOpenId] = useState<string | null>(null)

  useEffect(() => {
    if (!tabs.some((tab) => tab.id === activeId)) {
      setActiveId(tabs[0]?.id ?? '')
    }
  }, [tabs, activeId])

  useEffect(() => {
    setOpenId(null)
  }, [activeId])

  const active = tabs.find((tab) => tab.id === activeId) ?? tabs[0]

  if (!active) {
    return (
      <p className="type-body text-sm text-ink/40">
        No FAQ content is available right now.
      </p>
    )
  }

  return (
    <div>
      <header className="mb-8 max-w-xl sm:mb-10">
        <h1 className="type-display text-[clamp(2rem,5vw,3.25rem)] text-ink">
          {title}
        </h1>
        {intro.trim() ? (
          <p className="type-body mt-4 text-base text-ink/60">{intro}</p>
        ) : null}
      </header>

      <div
        role="tablist"
        aria-label="FAQ categories"
        className="mb-8 flex flex-wrap gap-2.5"
      >
        {tabs.map((tab) => {
          const selected = tab.id === active.id
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              id={`faq-tab-${tab.id}`}
              aria-controls={`faq-panel-${tab.id}`}
              onClick={() => setActiveId(tab.id)}
              className={`type-ui rounded-full px-5 py-2.5 text-xs transition-colors ${
                selected
                  ? 'border border-accent bg-accent text-[#f5f5f5]'
                  : 'border border-ink/80 bg-transparent text-ink hover:border-accent hover:bg-accent/15 hover:text-ink'
              }`}
            >
              {tab.title}
            </button>
          )
        })}
      </div>

      <div
        role="tabpanel"
        id={`faq-panel-${active.id}`}
        aria-labelledby={`faq-tab-${active.id}`}
      >
        <h2 className="type-headline mb-3 text-[clamp(1.2rem,2.2vw,1.5rem)] text-ink">
          {active.title}
        </h2>
        <div className="border-t border-ink/10">
          {active.items.map((item) => (
            <FaqAccordionItem
              key={item.id}
              item={item}
              open={openId === item.id}
              onToggle={() =>
                setOpenId((current) => (current === item.id ? null : item.id))
              }
            />
          ))}
        </div>
      </div>
    </div>
  )
}

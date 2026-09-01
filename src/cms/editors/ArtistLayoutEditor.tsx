import { useState } from 'react'
import {
  ARTIST_SECTION_META,
  DEFAULT_ARTIST_SECTIONS,
  normalizeArtistSections,
  reorderSections,
  type ArtistSectionConfig,
} from '@/cms/artistSections'
import { ArtistVisibilityToggle } from '@/cms/editors/ArtistVisibilityToggle'
import { EditorSection } from '@/cms/fields'
import type { Artist } from '@/types/artist'

type ArtistLayoutEditorProps = {
  artist: Artist
  onChange: (sections: ArtistSectionConfig[]) => void
}

/** Page order + visibility for a single artist page. */
export function ArtistLayoutEditor({
  artist,
  onChange,
}: ArtistLayoutEditorProps) {
  const sections = normalizeArtistSections(artist.sections)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)

  return (
    <EditorSection
      title="Pagina-opbouw"
      description="Sleep blokken voor de volgorde. Zet een blok op verborgen — data blijft bewaard."
      defaultOpen
    >
      <ul className="space-y-2">
        {sections.map((section, index) => {
          const meta = ARTIST_SECTION_META[section.id]
          const isDragging = dragIndex === index
          const isOver = overIndex === index && dragIndex !== index

          return (
            <li
              key={section.id}
              onDragOver={(e) => {
                e.preventDefault()
                e.dataTransfer.dropEffect = 'move'
                if (overIndex !== index) setOverIndex(index)
              }}
              onDragLeave={() => {
                if (overIndex === index) setOverIndex(null)
              }}
              onDrop={(e) => {
                e.preventDefault()
                const from = Number(e.dataTransfer.getData('text/plain'))
                if (Number.isNaN(from)) return
                onChange(reorderSections(sections, from, index))
                setDragIndex(null)
                setOverIndex(null)
              }}
              className={[
                'flex items-center gap-2 rounded-2xl border bg-[var(--body-bg)] px-3 py-2.5 transition-colors',
                isDragging
                  ? 'border-neutral-500 opacity-45'
                  : isOver
                    ? 'border-neutral-500 bg-neutral-100'
                    : 'border-ink/10 hover:border-ink/25',
              ].join(' ')}
            >
              <span
                draggable
                role="button"
                tabIndex={0}
                aria-label={`Sleep ${meta.label} om te herschikken`}
                onDragStart={(e) => {
                  setDragIndex(index)
                  e.dataTransfer.effectAllowed = 'move'
                  e.dataTransfer.setData('text/plain', String(index))
                }}
                onDragEnd={() => {
                  setDragIndex(null)
                  setOverIndex(null)
                }}
                className="flex h-8 w-6 shrink-0 cursor-grab items-center justify-center text-lg leading-none text-ink/35 select-none active:cursor-grabbing"
              >
                ⠿
              </span>

              <div className="min-w-0 flex-1">
                <p className="flex min-w-0 items-baseline gap-2">
                  <span className="shrink-0 text-sm font-semibold text-neutral-900">
                    {meta.label}
                  </span>
                  <span className="type-body hidden min-w-0 truncate text-xs text-ink/40 sm:inline">
                    {meta.description}
                  </span>
                </p>
              </div>

              <div
                className="shrink-0"
                onPointerDown={(e) => e.stopPropagation()}
              >
                <ArtistVisibilityToggle
                  compact
                  visible={section.visible}
                  onChange={(visible) => {
                    onChange(
                      sections.map((s, i) =>
                        i === index ? { ...s, visible } : s,
                      ),
                    )
                  }}
                />
              </div>
            </li>
          )
        })}
      </ul>

      <button
        type="button"
        className="text-[11px] font-medium text-neutral-500 transition-colors hover:text-neutral-900"
        onClick={() => onChange(DEFAULT_ARTIST_SECTIONS.map((s) => ({ ...s })))}
      >
        Reset volgorde
      </button>
    </EditorSection>
  )
}

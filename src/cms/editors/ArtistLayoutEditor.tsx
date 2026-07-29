import { useState } from 'react'
import {
  ARTIST_SECTION_META,
  normalizeArtistSections,
  reorderSections,
  type ArtistSectionConfig,
} from '@/cms/artistSections'
import { EditorSection } from '@/cms/fields'
import type { Artist } from '@/types/artist'

type ArtistLayoutEditorProps = {
  artist: Artist
  onChange: (sections: ArtistSectionConfig[]) => void
}

/** Drag-and-drop page layout for a single artist page. */
export function ArtistLayoutEditor({
  artist,
  onChange,
}: ArtistLayoutEditorProps) {
  const sections = normalizeArtistSections(artist.sections)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)

  return (
    <EditorSection
      title="Page layout"
      description="Sleep blokken voor de volgorde. Reels beheer je in Video reels hieronder."
      defaultOpen
      badge="Layout"
    >
      <ul className="space-y-2">
        {sections.map((section, index) => {
          const meta = ARTIST_SECTION_META[section.id]
          const isDragging = dragIndex === index
          const isOver = overIndex === index && dragIndex !== index

          return (
            <li
              key={section.id}
              draggable
              onDragStart={(e) => {
                setDragIndex(index)
                e.dataTransfer.effectAllowed = 'move'
                e.dataTransfer.setData('text/plain', String(index))
              }}
              onDragEnd={() => {
                setDragIndex(null)
                setOverIndex(null)
              }}
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
                'flex cursor-grab items-center gap-3 rounded-2xl border bg-[var(--body-bg)] px-3 py-3 transition-colors active:cursor-grabbing',
                isDragging
                  ? 'border-brand/50 opacity-45'
                  : isOver
                    ? 'border-brand bg-brand/10'
                    : 'border-ink/10 hover:border-ink/25',
              ].join(' ')}
            >
              <span
                className="flex h-8 w-6 shrink-0 flex-col items-center justify-center gap-0.5 text-ink/30"
                aria-hidden
              >
                <span className="block h-0.5 w-3.5 rounded-full bg-current" />
                <span className="block h-0.5 w-3.5 rounded-full bg-current" />
                <span className="block h-0.5 w-3.5 rounded-full bg-current" />
              </span>

              <div className="min-w-0 flex-1">
                <p className="type-headline text-sm text-ink">{meta.label}</p>
                <p className="type-body mt-0.5 text-xs text-ink/40">
                  {meta.description}
                </p>
              </div>

              <button
                type="button"
                className={[
                  'type-label shrink-0 rounded-full px-2.5 py-1 text-[0.55rem] tracking-[0.12em] uppercase transition-colors',
                  section.visible
                    ? 'bg-brand/20 text-ink'
                    : 'bg-ink/8 text-ink/35',
                ].join(' ')}
                onClick={() => {
                  onChange(
                    sections.map((s, i) =>
                      i === index ? { ...s, visible: !s.visible } : s,
                    ),
                  )
                }}
              >
                {section.visible ? 'Zichtbaar' : 'Verborgen'}
              </button>

              <span className="type-label shrink-0 text-[0.55rem] tracking-[0.12em] text-ink/30 uppercase">
                {index + 1}
              </span>
            </li>
          )
        })}
      </ul>

      <button
        type="button"
        className="type-label text-[0.6rem] tracking-[0.12em] text-ink/40 uppercase transition-colors hover:text-ink"
        onClick={() =>
          onChange([
            { id: 'hero', visible: true },
            { id: 'video', visible: true },
            { id: 'tracks', visible: true },
          ])
        }
      >
        Reset volgorde
      </button>
    </EditorSection>
  )
}

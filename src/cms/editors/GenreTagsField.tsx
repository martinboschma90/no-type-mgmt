import { useState, type KeyboardEvent } from 'react'
import {
  GENRE_PRESETS,
  MAX_ARTIST_GENRES,
  uniqueGenres,
} from '@/cms/artistGenres'
import { Field } from '@/cms/fields'

type GenreTagsFieldProps = {
  value: string[]
  onChange: (genres: string[]) => void
}

export function GenreTagsField({ value, onChange }: GenreTagsFieldProps) {
  const [draft, setDraft] = useState('')
  const genres = uniqueGenres(value)
  const selectedKeys = new Set(genres.map((g) => g.toLowerCase()))
  const customGenres = genres.filter(
    (genre) =>
      !GENRE_PRESETS.some((preset) => preset.toLowerCase() === genre.toLowerCase()),
  )

  function add(raw: string) {
    const next = uniqueGenres([...genres, raw])
    if (next.length === genres.length) {
      setDraft('')
      return
    }
    onChange(next)
    setDraft('')
  }

  function toggle(label: string) {
    const key = label.toLowerCase()
    if (selectedKeys.has(key)) {
      onChange(genres.filter((g) => g.toLowerCase() !== key))
      return
    }
    onChange(uniqueGenres([...genres, label]))
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      add(draft)
    }
    if (e.key === 'Backspace' && !draft && genres.length) {
      onChange(genres.slice(0, -1))
    }
  }

  return (
    <Field
      label="Genres"
      hint="Tik een tag aan. Die verschijnt als knop op de artiestenpagina."
    >
      <div className="flex flex-wrap gap-1.5">
        {GENRE_PRESETS.map((preset) => {
          const on = selectedKeys.has(preset.toLowerCase())
          const full = !on && genres.length >= MAX_ARTIST_GENRES
          return (
            <button
              key={preset}
              type="button"
              disabled={full}
              onClick={() => toggle(preset)}
              className={`rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors ${
                on
                  ? 'border-neutral-900 bg-neutral-900 text-white'
                  : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400'
              } disabled:cursor-not-allowed disabled:opacity-35`}
            >
              {preset}
            </button>
          )
        })}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {customGenres.map((genre) => (
          <button
            key={genre}
            type="button"
            className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-100 px-2.5 py-1 text-[10px] font-medium text-neutral-700"
            onClick={() => onChange(genres.filter((g) => g !== genre))}
            aria-label={`Verwijder ${genre}`}
          >
            {genre}
            <span aria-hidden className="text-ink/40">
              ×
            </span>
          </button>
        ))}
        {genres.length < MAX_ARTIST_GENRES ? (
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            onBlur={() => {
              if (draft.trim()) add(draft)
            }}
            placeholder="Eigen genre…"
            className="min-w-[8rem] flex-1 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-500 focus:ring-4 focus:ring-neutral-500/10"
          />
        ) : null}
      </div>
    </Field>
  )
}

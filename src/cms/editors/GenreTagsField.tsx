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
              className={`type-ui rounded-full border px-3 py-1.5 text-[0.62rem] tracking-[0.06em] transition-colors ${
                on
                  ? 'border-ink bg-ink text-[var(--body-bg)]'
                  : 'border-ink/25 text-ink hover:border-ink/55'
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
            className="type-ui inline-flex items-center gap-1.5 rounded-full border border-ink/25 bg-ink/5 px-2.5 py-1 text-[0.6rem] text-ink"
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
            className="min-w-[8rem] flex-1 rounded-lg border border-ink/12 bg-[var(--body-bg)] px-2.5 py-1.5 type-body text-sm text-ink outline-none placeholder:text-ink/30 focus:border-accent/60"
          />
        ) : null}
      </div>
    </Field>
  )
}

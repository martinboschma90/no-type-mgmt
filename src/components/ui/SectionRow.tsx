import type { ReactNode } from 'react'

type SectionRowProps = {
  id?: string
  label: string
  children: ReactNode
}

/** Two-column info row: label left, content right (About / Contact / Legal). */
export function SectionRow({ id, label, children }: SectionRowProps) {
  return (
    <section
      id={id}
      className="grid grid-cols-1 gap-4 border-b border-ink/5 py-10 last:border-b-0 sm:gap-8 md:grid-cols-12 md:py-14"
    >
      <h2 className="type-headline text-[clamp(1.35rem,2.5vw,1.75rem)] text-ink md:col-span-3">
        {label}
      </h2>
      <div className="md:col-span-8 md:col-start-5">{children}</div>
    </section>
  )
}

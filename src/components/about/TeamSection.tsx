import type { TeamMember } from '@/types/artist'
import { ResolvedImg } from '@/components/ui/ResolvedMedia'

type TeamSectionProps = {
  members: TeamMember[]
}

export function TeamSection({ members }: TeamSectionProps) {
  return (
    <section
      className="mx-auto max-w-[1200px] px-4 pb-8 pt-4 sm:px-6 lg:px-8"
      aria-label="Our Team"
    >
      <h2 className="type-headline mb-6 text-[clamp(1.35rem,2.5vw,1.75rem)] text-ink md:mb-8">
        Our Team
      </h2>

      <div className="flex gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-3 sm:overflow-visible md:grid-cols-5 md:gap-4">
        {members.map((member) => (
          <article key={member.id} className="w-[42vw] shrink-0 sm:w-auto">
            <div className="aspect-[3/4] overflow-hidden rounded-[1.5rem] bg-card">
              <ResolvedImg
                src={member.imageUrl}
                alt={member.name}
                className="h-full w-full object-cover"
                loading="lazy"
                fetchPriority="low"
                size="team"
                sizes="(max-width: 640px) 42vw, 18vw"
              />
            </div>
            <p className="type-headline mt-2.5 text-sm text-ink">{member.name}</p>
            <p className="type-label mt-1 text-ink/45">{member.role}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

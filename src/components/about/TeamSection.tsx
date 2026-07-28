import { motion } from 'framer-motion'
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
      <motion.h2
        className="type-headline mb-6 text-[clamp(1.35rem,2.5vw,1.75rem)] text-ink md:mb-8"
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        Our Team
      </motion.h2>

      <div className="flex gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-3 sm:overflow-visible md:grid-cols-5 md:gap-4">
        {members.map((member, index) => (
          <motion.article
            key={member.id}
            className="w-[42vw] shrink-0 sm:w-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05, duration: 0.4 }}
          >
            <div className="aspect-[3/4] overflow-hidden rounded-[1.5rem] bg-card">
              <ResolvedImg
                src={member.imageUrl}
                alt={member.name}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
            <p className="type-headline mt-2.5 text-sm text-ink">{member.name}</p>
            <p className="type-label mt-1 text-ink/45">{member.role}</p>
          </motion.article>
        ))}
      </div>
    </section>
  )
}

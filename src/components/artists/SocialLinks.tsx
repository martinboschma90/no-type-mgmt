import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import type { SocialLink } from '@/types/artist'

const icons: Record<SocialLink['platform'], ReactNode> = {
  website: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.8 3.8 5.8 3.8 9S14.5 18.2 12 21c-2.5-2.8-3.8-5.8-3.8-9S9.5 5.8 12 3Z" />
    </svg>
  ),
  instagram: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
      <path d="M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9A5.5 5.5 0 0 1 16.5 22h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2Zm0 2A3.5 3.5 0 0 0 4 7.5v9A3.5 3.5 0 0 0 7.5 20h9a3.5 3.5 0 0 0 3.5-3.5v-9A3.5 3.5 0 0 0 16.5 4h-9Zm9.25 1.75a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
    </svg>
  ),
  tiktok: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
      <path d="M14.5 3c.4 2.4 2 4.2 4.5 4.6v2.4c-1.5-.1-2.9-.6-4.1-1.5v6.3A5.8 5.8 0 1 1 9 9.1v2.5a3.3 3.3 0 1 0 2.4 3.2V3h3.1Z" />
    </svg>
  ),
  facebook: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
      <path d="M13.5 21v-7h2.4l.4-3H13.5V9.2c0-.9.3-1.5 1.6-1.5H16.5V5.1C16.1 5 15 5 13.8 5 11.3 5 9.6 6.5 9.6 9v2H7.2v3H9.6v7h3.9Z" />
    </svg>
  ),
  soundcloud: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
      <path d="M17.4 10.2a3.7 3.7 0 0 1 3.6 3.7c0 2-1.6 3.6-3.6 3.6H9.1V8.8c1.2-1.8 3.3-2.9 5.5-2.6a5.5 5.5 0 0 1 2.8 4Zm-9.9.4v6.9H6.2v-6.9h1.3Zm-2.2.9v6H4v-6h1.3Zm-2.1 1.5v4.5H1.9v-4.5H3.2Z" />
    </svg>
  ),
  spotify: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm4.6 14.4a.7.7 0 0 1-1 .2c-2.6-1.6-5.9-2-9.8-1.1a.7.7 0 1 1-.3-1.4c4.2-1 7.9-.5 10.9 1.3a.7.7 0 0 1 .2 1Zm1.3-2.9a.9.9 0 0 1-1.2.3c-3-1.8-7.5-2.3-11-1.3a.9.9 0 1 1-.5-1.7c4-.1 8.9.5 12.4 2.6a.9.9 0 0 1 .3 1.1Zm.1-3a1 1 0 0 1-1.4.4c-3.4-2-9-2.2-12.2-1.2a1 1 0 1 1-.6-1.9c3.7-1.1 9.8-.9 13.8 1.4a1 1 0 0 1 .4 1.3Z" />
    </svg>
  ),
  youtube: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
      <path d="M22 12.2c0-2.3-.3-3.9-.5-4.7-.3-.9-1-1.6-1.9-1.8C18.1 5.4 12 5.4 12 5.4s-6.1 0-7.6.3c-.9.2-1.6.9-1.9 1.8-.2.8-.5 2.4-.5 4.7s.3 3.9.5 4.7c.3.9 1 1.6 1.9 1.8 1.5.3 7.6.3 7.6.3s6.1 0 7.6-.3c.9-.2 1.6-.9 1.9-1.8.2-.8.5-2.4.5-4.7ZM10.2 15.1V9.3l5.1 2.9-5.1 2.9Z" />
    </svg>
  ),
}

type SocialLinksProps = {
  links: SocialLink[]
  className?: string
}

function isActiveSocialUrl(url: string) {
  const trimmed = url.trim()
  if (!trimmed || trimmed === '#' || trimmed === 'https://' || trimmed === 'http://') {
    return false
  }
  return true
}

export function SocialLinks({ links, className = '' }: SocialLinksProps) {
  const active = links.filter((link) => isActiveSocialUrl(link.url))
  if (!active.length) return null

  return (
    <ul className={`flex flex-wrap items-center gap-2 ${className}`}>
      {active.map((link, i) => (
        <motion.li
          key={`${link.platform}-${i}`}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 + i * 0.05 }}
        >
          <a
            href={link.url}
            target="_blank"
            rel="noreferrer"
            aria-label={link.label}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-ink-inverse transition-colors duration-300 ease-out hover:text-brand"
          >
            {icons[link.platform]}
          </a>
        </motion.li>
      ))}
    </ul>
  )
}

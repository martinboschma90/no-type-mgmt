import { artists as defaultArtists } from '@/data/artists'
import { getArtistBySlug } from '@/data/artistDetails'
import { withArtDirection } from '@/cms/imageFocus'
import { site as defaultSite, team as defaultTeam } from '@/data/site'
import type { Artist, TeamMember } from '@/types/artist'

export type ContactItem = {
  label: string
  email: string
}

export type LegalInfo = {
  company: string
  vat: string
  addressLines: string[]
}

export type LegalLink = {
  label: string
  href: string
}

export type SiteContent = {
  name: string
  fullName: string
  tagline: string
  instagram: string
  year: number
  contactIntro: string
  contact: ContactItem[]
  legal: LegalInfo
  about: string[]
  photoCredits: string
  legalLinks: LegalLink[]
}

export type CmsContent = {
  site: SiteContent
  team: TeamMember[]
  artists: Artist[]
}

export const CMS_STORAGE_KEY = 'notype-cms-content-v1'

export function createDefaultContent(): CmsContent {
  const artists = defaultArtists.map((artist) => {
    const full = getArtistBySlug(artist.slug)
    const base = withArtDirection(full ?? { ...artist })
    return {
      ...base,
      status: 'published' as const,
      visible: true,
      publishedAt: base.publishedAt ?? new Date().toISOString(),
    }
  })

  return {
    site: {
      name: defaultSite.name,
      fullName: defaultSite.fullName,
      tagline: defaultSite.tagline,
      instagram: defaultSite.instagram,
      year: defaultSite.year,
      contactIntro:
        'Bookings, production and everything in between — reach the right inbox.',
      contact: defaultSite.contact.map((item) => ({ ...item })),
      legal: {
        company: defaultSite.legal.company,
        vat: defaultSite.legal.vat,
        addressLines: [...defaultSite.legal.addressLines],
      },
      about: [...defaultSite.about],
      photoCredits: defaultSite.photoCredits,
      legalLinks: defaultSite.legalLinks.map((link) => ({ ...link })),
    },
    team: defaultTeam.map((member) => ({ ...member })),
    artists,
  }
}

export function loadStoredContent(): CmsContent | null {
  try {
    const raw = localStorage.getItem(CMS_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CmsContent
    if (!parsed?.site || !Array.isArray(parsed.artists) || !Array.isArray(parsed.team)) {
      return null
    }
    return {
      ...parsed,
      artists: parsed.artists.map((artist) => withArtDirection(artist)),
    }
  } catch {
    return null
  }
}

/**
 * Persist CMS content to localStorage.
 * Phase 3.1: when `persistArtists` is false, artists are omitted from the
 * write (Supabase is source of truth). Site + team still persist locally.
 */
export function persistContent(
  content: CmsContent,
  options?: { persistArtists?: boolean },
) {
  const persistArtists = options?.persistArtists !== false
  try {
    const payload: CmsContent = persistArtists
      ? content
      : {
          site: content.site,
          team: content.team,
          // Empty array keeps schema valid; seed/Supabase hydrate artists on load
          artists: [],
        }
    localStorage.setItem(CMS_STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // Ignore quota / private-mode failures
  }
}

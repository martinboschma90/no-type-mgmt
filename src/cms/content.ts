import { artists as defaultArtists } from '@/data/artists'
import { getArtistBySlug } from '@/data/artistDetails'
import { withArtDirection } from '@/cms/imageFocus'
import {
  DEFAULT_ROSTER_GLOW_CUSTOM,
  DEFAULT_ROSTER_GLOW_PRESET,
  isRosterGlowPreset,
  type RosterGlowPreset,
} from '@/cms/rosterGlow'
import { site as defaultSite, team as defaultTeam } from '@/data/site'
import type { Artist, TeamMember } from '@/types/artist'

export type { RosterGlowPreset }

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
  /** Accessible / CMS title for the About page (logo remains the visual mark). */
  aboutTitle: string
  about: string[]
  /** Optional About media URLs (CMS); public layout unchanged when empty. */
  aboutImages: string[]
  photoCredits: string
  legalLinks: LegalLink[]
  /** Optional custom footer logo URL; empty keeps the brand Logo component. */
  logoUrl: string
  /** Optional copyright override; empty uses `©{year} {fullName||name}`. */
  copyrightText: string
  /** When false, Team section is omitted from the About page. */
  teamVisible: boolean
  /** Desktop (lg+) artist cards per row on the homepage roster. */
  rosterDesktopColumns: 3 | 4
  /** Hover glow color preset on roster artist cards. */
  rosterGlowPreset: RosterGlowPreset
  /** Hex used when `rosterGlowPreset` is `custom`. */
  rosterGlowCustom: string
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
      aboutTitle: 'About No Type',
      about: [...defaultSite.about],
      aboutImages: [],
      photoCredits: defaultSite.photoCredits,
      legalLinks: defaultSite.legalLinks.map((link) => ({ ...link })),
      logoUrl: '',
      copyrightText: '',
      teamVisible: true,
      rosterDesktopColumns: 4,
      rosterGlowPreset: DEFAULT_ROSTER_GLOW_PRESET,
      rosterGlowCustom: DEFAULT_ROSTER_GLOW_CUSTOM,
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
    const defaults = createDefaultContent()
    return {
      ...parsed,
      site: {
        ...defaults.site,
        ...parsed.site,
        contact: Array.isArray(parsed.site.contact)
          ? parsed.site.contact
          : defaults.site.contact,
        legal: {
          ...defaults.site.legal,
          ...(parsed.site.legal ?? {}),
          addressLines: Array.isArray(parsed.site.legal?.addressLines)
            ? parsed.site.legal.addressLines
            : defaults.site.legal.addressLines,
        },
        about: Array.isArray(parsed.site.about)
          ? parsed.site.about
          : defaults.site.about,
        aboutImages: Array.isArray(parsed.site.aboutImages)
          ? parsed.site.aboutImages
          : defaults.site.aboutImages,
        legalLinks: Array.isArray(parsed.site.legalLinks)
          ? parsed.site.legalLinks
          : defaults.site.legalLinks,
        aboutTitle: parsed.site.aboutTitle ?? defaults.site.aboutTitle,
        logoUrl: parsed.site.logoUrl ?? defaults.site.logoUrl,
        copyrightText: parsed.site.copyrightText ?? defaults.site.copyrightText,
        teamVisible:
          typeof parsed.site.teamVisible === 'boolean'
            ? parsed.site.teamVisible
            : defaults.site.teamVisible,
        rosterDesktopColumns:
          parsed.site.rosterDesktopColumns === 3 ||
          parsed.site.rosterDesktopColumns === 4
            ? parsed.site.rosterDesktopColumns
            : defaults.site.rosterDesktopColumns,
        rosterGlowPreset: isRosterGlowPreset(parsed.site.rosterGlowPreset)
          ? parsed.site.rosterGlowPreset
          : defaults.site.rosterGlowPreset,
        rosterGlowCustom:
          typeof parsed.site.rosterGlowCustom === 'string'
            ? parsed.site.rosterGlowCustom
            : defaults.site.rosterGlowCustom,
      },
      artists: parsed.artists.map((artist) => withArtDirection(artist)),
    }
  } catch {
    return null
  }
}

/**
 * Persist CMS content to localStorage (local cache).
 * When Supabase is configured, artists are omitted; site + team still cache
 * locally while Supabase remains the source of truth after hydrate.
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

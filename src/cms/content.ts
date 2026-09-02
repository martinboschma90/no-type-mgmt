import { createDefaultFaqCategories } from '@/data/faq'
import { withArtDirection } from '@/cms/imageFocus'
import { normalizeSiteContent } from '@/cms/mappers/site'
import { storageGet, storageSet } from '@/lib/safeStorage'
import { CMS_CONTENT_TS_KEY, CMS_STORAGE_KEY } from '@/cms/storageKeys'
export { CMS_STORAGE_KEY }
import {
  DEFAULT_ROSTER_GLOW_CUSTOM,
  DEFAULT_ROSTER_GLOW_PRESET,
  DEFAULT_ROSTER_GLOW_SECONDARY,
  type RosterGlowPreset,
} from '@/cms/rosterGlow'
import { site as defaultSite } from '@/data/site'
import { DEFAULT_WHATSAPP_NUMBER } from '@/data/whatsapp'
import type { Artist, TeamMember } from '@/types/artist'

const DEFAULT_PHONE_NUMBER = DEFAULT_WHATSAPP_NUMBER

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

export type FaqItem = {
  id: string
  question: string
  answer: string
  visible: boolean
}

export type FaqCategory = {
  id: string
  title: string
  visible: boolean
  items: FaqItem[]
}

export type SiteContent = {
  name: string
  fullName: string
  tagline: string
  /** When false, the homepage hero is hidden while the roster remains visible. */
  homeHeroVisible: boolean
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
  /** Header video on About (YouTube or mp4/webm). */
  aboutHeroVideoUrl: string
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
  /** Primary hover glow color on roster artist cards. */
  rosterGlowPreset: RosterGlowPreset
  /** Secondary hover glow color — blends with primary. */
  rosterGlowSecondary: RosterGlowPreset
  /** Hex used when primary glow is `custom`. */
  rosterGlowCustom: string
  /** Hex used when secondary glow is `custom`. */
  rosterGlowCustomSecondary: string
  /** Booking request page (`/booking`) headline. */
  bookingTitle: string
  /** Booking request page intro copy. */
  bookingIntro: string
  /** When false, `/booking` redirects home and the nav link is hidden. */
  bookingVisible: boolean
  /** Public phone number (footer + contact). */
  phoneNumber: string
  /** WhatsApp number for artist CTAs and footer (display or E.164). */
  whatsappNumber: string
  /** Promoter FAQ page (`/faq`) headline. */
  faqTitle: string
  /** Optional intro under the FAQ title. */
  faqIntro: string
  /** When false, `/faq` redirects home and FAQ nav links are omitted. */
  faqVisible: boolean
  /** Ordered FAQ categories (tabs) with questions. */
  faqCategories: FaqCategory[]
}

export type CmsContent = {
  site: SiteContent
  team: TeamMember[]
  artists: Artist[]
}

/** Site/team defaults without the seed roster — safe on the public bundle. */
export function createDefaultSiteContent(): SiteContent {
  return {
    name: defaultSite.name,
    fullName: defaultSite.fullName,
    tagline: defaultSite.tagline,
    homeHeroVisible: true,
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
    aboutTitle: 'About NOTYPE',
    about: [...defaultSite.about],
    aboutImages: [],
    aboutHeroVideoUrl:
      'https://www.youtube.com/watch?v=xXt3erMFs8w&t=14m11s',
    photoCredits: defaultSite.photoCredits,
    legalLinks: defaultSite.legalLinks.map((link) => ({ ...link })),
    logoUrl: '',
    copyrightText: '',
    teamVisible: true,
    rosterDesktopColumns: 4,
    rosterGlowPreset: DEFAULT_ROSTER_GLOW_PRESET,
    rosterGlowSecondary: DEFAULT_ROSTER_GLOW_SECONDARY,
    rosterGlowCustom: DEFAULT_ROSTER_GLOW_CUSTOM,
    rosterGlowCustomSecondary: '#a8487a',
    bookingTitle: 'Booking Request',
    bookingIntro: "Send us your booking request and we'll get back to you.",
    bookingVisible: true,
    phoneNumber: DEFAULT_PHONE_NUMBER,
    whatsappNumber: DEFAULT_WHATSAPP_NUMBER,
    faqTitle: 'Promoter FAQ',
    faqIntro:
      'Answers for promoters, festivals, clubs, brands and event organisers.',
    faqVisible: true,
    faqCategories: createDefaultFaqCategories(),
  }
}

export function loadStoredContent(): CmsContent | null {
  const raw = storageGet(CMS_STORAGE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as CmsContent
    if (!parsed?.site || !Array.isArray(parsed.artists) || !Array.isArray(parsed.team)) {
      return null
    }
    return {
      ...parsed,
      site: normalizeSiteContent(parsed.site),
      artists: parsed.artists.map((artist) => withArtDirection(artist)),
    }
  } catch {
    return null
  }
}

export function loadStoredContentUpdatedAt(): number {
  const raw = storageGet(CMS_CONTENT_TS_KEY)
  const n = raw ? Number(raw) : 0
  return Number.isFinite(n) ? n : 0
}

export function persistContent(
  content: CmsContent,
  options?: { persistArtists?: boolean; updatedAt?: number },
) {
  const persistArtists = options?.persistArtists !== false
  const payload: CmsContent = persistArtists
    ? content
    : {
        site: content.site,
        team: content.team,
        artists: [],
      }
  storageSet(CMS_STORAGE_KEY, JSON.stringify(payload))
  storageSet(CMS_CONTENT_TS_KEY, String(options?.updatedAt ?? Date.now()))
}

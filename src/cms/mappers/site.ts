import {
  createDefaultContent,
  type ContactItem,
  type LegalInfo,
  type LegalLink,
  type SiteContent,
} from '@/cms/content'
import { isRosterGlowPreset } from '@/cms/rosterGlow'
import type { Json } from '@/lib/database.types'

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
}

function asRosterColumns(value: unknown, fallback: 3 | 4): 3 | 4 {
  if (value === 3 || value === '3') return 3
  if (value === 4 || value === '4') return 4
  return fallback
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string')
}

function asContact(value: unknown): ContactItem[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const row = item as Record<string, unknown>
      return {
        label: asString(row.label),
        email: asString(row.email),
      }
    })
    .filter((item): item is ContactItem => Boolean(item))
}

function asLegalLinks(value: unknown): LegalLink[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const row = item as Record<string, unknown>
      return {
        label: asString(row.label),
        href: asString(row.href),
      }
    })
    .filter((item): item is LegalLink => Boolean(item))
}

function asLegal(value: unknown, fallback: LegalInfo): LegalInfo {
  if (!value || typeof value !== 'object') return { ...fallback, addressLines: [...fallback.addressLines] }
  const row = value as Record<string, unknown>
  return {
    company: asString(row.company, fallback.company),
    vat: asString(row.vat, fallback.vat),
    addressLines: asStringArray(row.addressLines),
  }
}

/** Merge partial/jsonb site content with shipped defaults. */
export function normalizeSiteContent(raw: unknown): SiteContent {
  const defaults = createDefaultContent().site
  if (!raw || typeof raw !== 'object') {
    return {
      ...defaults,
      contact: defaults.contact.map((c) => ({ ...c })),
      legal: {
        ...defaults.legal,
        addressLines: [...defaults.legal.addressLines],
      },
      about: [...defaults.about],
      aboutImages: [...defaults.aboutImages],
      legalLinks: defaults.legalLinks.map((l) => ({ ...l })),
    }
  }

  const row = raw as Record<string, unknown>
  const contact = asContact(row.contact)
  const legalLinks = asLegalLinks(row.legalLinks)
  const about = asStringArray(row.about)
  const aboutImages = asStringArray(row.aboutImages)

  return {
    name: asString(row.name, defaults.name),
    fullName: asString(row.fullName, defaults.fullName),
    tagline: asString(row.tagline, defaults.tagline),
    instagram: asString(row.instagram, defaults.instagram),
    year: asNumber(row.year, defaults.year),
    contactIntro: asString(row.contactIntro, defaults.contactIntro),
    contact: contact.length ? contact : defaults.contact.map((c) => ({ ...c })),
    legal: asLegal(row.legal, defaults.legal),
    about: about.length ? about : [...defaults.about],
    aboutTitle: asString(row.aboutTitle, defaults.aboutTitle),
    aboutImages: aboutImages.length ? aboutImages : [...defaults.aboutImages],
    photoCredits: asString(row.photoCredits, defaults.photoCredits),
    legalLinks: legalLinks.length
      ? legalLinks
      : defaults.legalLinks.map((l) => ({ ...l })),
    logoUrl: asString(row.logoUrl, defaults.logoUrl),
    copyrightText: asString(row.copyrightText, defaults.copyrightText),
    teamVisible: asBoolean(row.teamVisible, defaults.teamVisible),
    rosterDesktopColumns: asRosterColumns(
      row.rosterDesktopColumns,
      defaults.rosterDesktopColumns,
    ),
    rosterGlowPreset: isRosterGlowPreset(row.rosterGlowPreset)
      ? row.rosterGlowPreset
      : defaults.rosterGlowPreset,
    rosterGlowCustom: asString(row.rosterGlowCustom, defaults.rosterGlowCustom),
  }
}

export function siteContentToJson(site: SiteContent): Json {
  return site as unknown as Json
}

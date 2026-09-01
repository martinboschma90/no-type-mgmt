import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { CmsContext } from '@/cms/CmsContext'
import {
  createDefaultSiteContent,
  type CmsContent,
  type SiteContent,
} from '@/cms/content'
import { fetchPublicSite, fetchPublicTeam } from '@/cms/api/publicRead'
import {
  CMS_STORAGE_KEY,
  PUBLIC_SITE_STORAGE_KEY,
  PUBLIC_TEAM_STORAGE_KEY,
} from '@/cms/storageKeys'
import { normalizeSiteContent } from '@/cms/mappers/site'
import { isSupabaseConfigured } from '@/lib/supabaseEnv'
import { storageGet, storageSet } from '@/lib/safeStorage'
import { createBlankArtist } from '@/cms/createArtist'
import type { TeamMember } from '@/types/artist'

function readJson<T>(key: string): T | null {
  const raw = storageGet(key)
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function initialPublicContent(): CmsContent {
  const cmsCache = !isSupabaseConfigured
    ? readJson<Partial<CmsContent>>(CMS_STORAGE_KEY)
    : null
  const site =
    cmsCache?.site ?? readJson<SiteContent>(PUBLIC_SITE_STORAGE_KEY)
  const team =
    cmsCache?.team ?? readJson<TeamMember[]>(PUBLIC_TEAM_STORAGE_KEY)
  const siteLooksValid =
    site &&
    typeof site === 'object' &&
    typeof site.name === 'string' &&
    typeof site.tagline === 'string'
  return {
    site: siteLooksValid ? normalizeSiteContent(site) : createDefaultSiteContent(),
    team: Array.isArray(team) ? team : [],
    artists: [],
  }
}

const noopAsync = async () => ({ error: null as string | null })

/** Read-only site/team for the public app — no Auth, no supabase-js. */
export function PublicContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<CmsContent>(initialPublicContent)

  useEffect(() => {
    if (!isSupabaseConfigured) return
    let cancelled = false
    void Promise.all([fetchPublicSite(), fetchPublicTeam()])
      .then(([site, team]) => {
        if (cancelled) return
        if (site) storageSet(PUBLIC_SITE_STORAGE_KEY, JSON.stringify(site))
        if (team && team.length > 0) {
          storageSet(PUBLIC_TEAM_STORAGE_KEY, JSON.stringify(team))
        }
        setContent((prev) => ({
          ...prev,
          site: site ?? prev.site,
          team: team && team.length > 0 ? team : prev.team,
        }))
      })
      .catch((error) => {
        console.warn('[public] site/team hydrate failed', error)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const value = useMemo(
    () => ({
      content,
      savedAt: null,
      contentSyncStatus: 'synced' as const,
      artistSyncError: null,
      siteSyncError: null,
      dirtyArtistIds: new Set<string>(),
      artistSaving: false,
      setSite: () => undefined,
      setTeam: () => undefined,
      setArtists: () => undefined,
      updateArtist: () => undefined,
      addArtist: (name: string) => createBlankArtist(name, []),
      removeArtist: () => undefined,
      saveArtist: noopAsync,
      publishArtist: noopAsync,
      unpublishArtist: noopAsync,
      resetContent: () => undefined,
      getArtistBySlug: (slug: string) =>
        content.artists.find((a) => a.slug === slug),
      isArtistDirty: () => false,
    }),
    [content],
  )

  return <CmsContext.Provider value={value}>{children}</CmsContext.Provider>
}

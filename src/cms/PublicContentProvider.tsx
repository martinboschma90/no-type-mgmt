import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { CmsContext } from '@/cms/CmsContext'
import {
  createDefaultSiteContent,
  type CmsContent,
} from '@/cms/content'
import { fetchPublicSite, fetchPublicTeam } from '@/cms/api/publicRead'
import { isSupabaseConfigured } from '@/lib/supabaseEnv'
import { createBlankArtist } from '@/cms/createArtist'

function initialPublicContent(): CmsContent {
  return {
    site: createDefaultSiteContent(),
    team: [],
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
    void Promise.all([fetchPublicSite(), fetchPublicTeam()]).then(
      ([site, team]) => {
        if (cancelled) return
        setContent((prev) => ({
          ...prev,
          site: site ?? prev.site,
          team: team && team.length > 0 ? team : prev.team,
        }))
      },
    )
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

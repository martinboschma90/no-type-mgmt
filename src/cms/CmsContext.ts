import { createContext, useContext } from 'react'
import type { Artist, TeamMember } from '@/types/artist'
import type { CmsContent, SiteContent } from '@/cms/content'

export type CmsContextValue = {
  content: CmsContent
  savedAt: number | null
  artistSyncError: string | null
  siteSyncError: string | null
  dirtyArtistIds: ReadonlySet<string>
  artistSaving: boolean
  setSite: (updater: (site: SiteContent) => SiteContent) => void
  setTeam: (updater: (team: TeamMember[]) => TeamMember[]) => void
  setArtists: (updater: (artists: Artist[]) => Artist[]) => void
  updateArtist: (slug: string, updater: (artist: Artist) => Artist) => void
  addArtist: (name: string) => Artist
  removeArtist: (slug: string) => void
  saveArtist: (slug: string) => Promise<{ error: string | null }>
  publishArtist: (slug: string) => Promise<{ error: string | null }>
  unpublishArtist: (slug: string) => Promise<{ error: string | null }>
  resetContent: () => void
  getArtistBySlug: (slug: string) => Artist | undefined
  isArtistDirty: (id: string) => boolean
}

export const CmsContext = createContext<CmsContextValue | null>(null)

export function useCms() {
  const ctx = useContext(CmsContext)
  if (!ctx) {
    throw new Error('useCms must be used within a content provider')
  }
  return ctx
}

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Artist, TeamMember } from '@/types/artist'
import {
  createDefaultContent,
  loadStoredContent,
  persistContent,
  type CmsContent,
  type SiteContent,
} from '@/cms/content'
import { createBlankArtist } from '@/cms/createArtist'
import { ART_DIRECTION_VERSION, withArtDirection } from '@/cms/imageFocus'

type CmsContextValue = {
  content: CmsContent
  savedAt: number | null
  setSite: (updater: (site: SiteContent) => SiteContent) => void
  setTeam: (updater: (team: TeamMember[]) => TeamMember[]) => void
  setArtists: (updater: (artists: Artist[]) => Artist[]) => void
  updateArtist: (slug: string, updater: (artist: Artist) => Artist) => void
  addArtist: (name: string) => Artist
  removeArtist: (slug: string) => void
  resetContent: () => void
  getArtistBySlug: (slug: string) => Artist | undefined
}

const CmsContext = createContext<CmsContextValue | null>(null)

export function CmsProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<CmsContent>(() => {
    const loaded = loadStoredContent() ?? createDefaultContent()
    return {
      ...loaded,
      artists: loaded.artists.map((artist) => withArtDirection(artist)),
    }
  })
  const [savedAt, setSavedAt] = useState<number | null>(() =>
    loadStoredContent() ? Date.now() : null,
  )

  useEffect(() => {
    persistContent(content)
    setSavedAt(Date.now())
  }, [content])

  // Re-apply campaign seeds when art-direction version bumps (HMR / code update)
  useEffect(() => {
    setContent((prev) => {
      const nextArtists = prev.artists.map((artist) => withArtDirection(artist))
      const changed = nextArtists.some(
        (artist, i) =>
          artist.imageFocusX !== prev.artists[i]?.imageFocusX ||
          artist.imageFocusY !== prev.artists[i]?.imageFocusY ||
          artist.imageScale !== prev.artists[i]?.imageScale ||
          artist.artDirectionVersion !== prev.artists[i]?.artDirectionVersion,
      )
      return changed ? { ...prev, artists: nextArtists } : prev
    })
  }, [ART_DIRECTION_VERSION])

  const value = useMemo<CmsContextValue>(
    () => ({
      content,
      savedAt,
      setSite: (updater) => {
        setContent((prev) => ({ ...prev, site: updater(prev.site) }))
      },
      setTeam: (updater) => {
        setContent((prev) => ({ ...prev, team: updater(prev.team) }))
      },
      setArtists: (updater) => {
        setContent((prev) => ({ ...prev, artists: updater(prev.artists) }))
      },
      updateArtist: (slug, updater) => {
        setContent((prev) => ({
          ...prev,
          artists: prev.artists.map((artist) =>
            artist.slug === slug ? updater(artist) : artist,
          ),
        }))
      },
      addArtist: (name) => {
        const created = createBlankArtist(
          name,
          content.artists.map((a) => a.slug),
        )
        setContent((prev) => ({
          ...prev,
          artists: [...prev.artists, created],
        }))
        return created
      },
      removeArtist: (slug) => {
        setContent((prev) => ({
          ...prev,
          artists: prev.artists.filter((artist) => artist.slug !== slug),
        }))
      },
      resetContent: () => {
        const next = createDefaultContent()
        setContent(next)
        persistContent(next)
        setSavedAt(Date.now())
      },
      getArtistBySlug: (slug) => content.artists.find((a) => a.slug === slug),
    }),
    [content, savedAt],
  )

  return <CmsContext.Provider value={value}>{children}</CmsContext.Provider>
}

export function useCms() {
  const ctx = useContext(CmsContext)
  if (!ctx) {
    throw new Error('useCms must be used within CmsProvider')
  }
  return ctx
}

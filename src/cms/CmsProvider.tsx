import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
import {
  deleteArtistInSupabase,
  fetchArtistsFromSupabase,
  insertArtistInSupabase,
  updateArtistInSupabase,
} from '@/cms/api/artists'
import { ART_DIRECTION_VERSION, withArtDirection } from '@/cms/imageFocus'
import { isSupabaseConfigured } from '@/lib/supabase'

type CmsContextValue = {
  content: CmsContent
  savedAt: number | null
  /** Last artist ↔ Supabase sync error, if any. */
  artistSyncError: string | null
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

const ARTIST_SAVE_DEBOUNCE_MS = 450

function initialContent(): CmsContent {
  const defaults = createDefaultContent()
  const stored = loadStoredContent()
  if (!stored) return defaults

  // Prefer stored artists when present (local fallback); else seed
  const artists =
    stored.artists.length > 0
      ? stored.artists.map((artist) => withArtDirection(artist))
      : defaults.artists

  return {
    site: stored.site,
    team: stored.team,
    artists,
  }
}

export function CmsProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<CmsContent>(initialContent)
  const [savedAt, setSavedAt] = useState<number | null>(() =>
    loadStoredContent() ? Date.now() : null,
  )
  const [artistSyncError, setArtistSyncError] = useState<string | null>(null)

  const contentRef = useRef(content)
  contentRef.current = content

  const debounceTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>())
  const artistsHydrated = useRef(false)

  const persistLocal = useCallback((next: CmsContent) => {
    // Artists → Supabase when configured; otherwise keep localStorage fallback
    persistContent(next, { persistArtists: !isSupabaseConfigured })
    setSavedAt(Date.now())
  }, [])

  const reportArtistError = useCallback((message: string) => {
    console.error('[cms] artist sync:', message)
    setArtistSyncError(message)
  }, [])

  const clearArtistError = useCallback(() => {
    setArtistSyncError(null)
  }, [])

  const adoptServerArtist = useCallback((server: Artist) => {
    setContent((prev) => {
      const idx = prev.artists.findIndex(
        (a) => a.id === server.id || a.slug === server.slug,
      )
      if (idx === -1) return prev
      const current = prev.artists[idx]
      // Only patch id (and slug if server won) when local still has legacy id
      if (current.id === server.id && current.slug === server.slug) return prev
      const artists = prev.artists.map((a, i) =>
        i === idx ? { ...a, id: server.id } : a,
      )
      return { ...prev, artists }
    })
  }, [])

  const persistArtistNow = useCallback(
    async (artist: Artist) => {
      if (!isSupabaseConfigured) return
      const { artist: server, error } = await updateArtistInSupabase(artist)
      if (error) {
        reportArtistError(error)
        return
      }
      clearArtistError()
      setSavedAt(Date.now())
      if (server && server.id !== artist.id) {
        adoptServerArtist(server)
      }
    },
    [adoptServerArtist, clearArtistError, reportArtistError],
  )

  const scheduleArtistPersist = useCallback(
    (artist: Artist) => {
      if (!isSupabaseConfigured) return
      const key = artist.id || artist.slug
      const existing = debounceTimers.current.get(key)
      if (existing) clearTimeout(existing)
      debounceTimers.current.set(
        key,
        setTimeout(() => {
          debounceTimers.current.delete(key)
          void persistArtistNow(artist)
        }, ARTIST_SAVE_DEBOUNCE_MS),
      )
    },
    [persistArtistNow],
  )

  // Site + team (+ artists when Supabase off) → localStorage
  useEffect(() => {
    persistLocal(content)
  }, [content, persistLocal])

  // Hydrate CMS artists from Supabase when available (fallback keeps seed/local)
  useEffect(() => {
    if (!isSupabaseConfigured || artistsHydrated.current) return
    let cancelled = false

    void fetchArtistsFromSupabase().then(({ artists, fromSupabase }) => {
      if (cancelled || !fromSupabase) return
      artistsHydrated.current = true
      setContent((prev) => ({
        ...prev,
        artists: artists.map((artist) => withArtDirection(artist)),
      }))
      setSavedAt(Date.now())
    })

    return () => {
      cancelled = true
    }
  }, [])

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

  useEffect(() => {
    const timers = debounceTimers.current
    return () => {
      for (const t of timers.values()) clearTimeout(t)
      timers.clear()
    }
  }, [])

  const value = useMemo<CmsContextValue>(
    () => ({
      content,
      savedAt,
      artistSyncError,
      setSite: (updater) => {
        setContent((prev) => ({ ...prev, site: updater(prev.site) }))
      },
      setTeam: (updater) => {
        setContent((prev) => ({ ...prev, team: updater(prev.team) }))
      },
      setArtists: (updater) => {
        setContent((prev) => {
          const nextArtists = updater(prev.artists)
          if (isSupabaseConfigured) {
            const prevById = new Map(prev.artists.map((a) => [a.id, a]))
            for (const artist of nextArtists) {
              const before = prevById.get(artist.id)
              if (!before || before !== artist) {
                scheduleArtistPersist(artist)
              }
            }
          }
          return { ...prev, artists: nextArtists }
        })
      },
      updateArtist: (slug, updater) => {
        setContent((prev) => {
          let updated: Artist | null = null
          const nextArtists = prev.artists.map((artist) => {
            if (artist.slug !== slug) return artist
            updated = updater(artist)
            return updated
          })
          if (updated && isSupabaseConfigured) {
            scheduleArtistPersist(updated)
          }
          return { ...prev, artists: nextArtists }
        })
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
        if (isSupabaseConfigured) {
          void insertArtistInSupabase(created).then(({ artist, error }) => {
            if (error) {
              reportArtistError(error)
              return
            }
            clearArtistError()
            setSavedAt(Date.now())
            if (artist && artist.id !== created.id) {
              adoptServerArtist(artist)
            }
          })
        }
        return created
      },
      removeArtist: (slug) => {
        const existing = contentRef.current.artists.find((a) => a.slug === slug)
        setContent((prev) => ({
          ...prev,
          artists: prev.artists.filter((artist) => artist.slug !== slug),
        }))
        if (existing && isSupabaseConfigured) {
          const key = existing.id || existing.slug
          const pending = debounceTimers.current.get(key)
          if (pending) {
            clearTimeout(pending)
            debounceTimers.current.delete(key)
          }
          void deleteArtistInSupabase(existing).then(({ error }) => {
            if (error) {
              reportArtistError(error)
              return
            }
            clearArtistError()
            setSavedAt(Date.now())
          })
        }
      },
      resetContent: () => {
        const next = createDefaultContent()
        setContent(next)
        persistLocal(next)
        setSavedAt(Date.now())
        if (isSupabaseConfigured) {
          // Non-destructive: upsert seed artists; do not wipe extra remote rows
          for (const artist of next.artists) {
            void updateArtistInSupabase(artist).then(({ error }) => {
              if (error) reportArtistError(error)
              else clearArtistError()
            })
          }
        }
      },
      getArtistBySlug: (slug) => content.artists.find((a) => a.slug === slug),
    }),
    [
      content,
      savedAt,
      artistSyncError,
      scheduleArtistPersist,
      persistLocal,
      reportArtistError,
      clearArtistError,
      adoptServerArtist,
    ],
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
